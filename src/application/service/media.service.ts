import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '@config';
import type {
  IMediaService,
  CreateMediaDto,
  CreateMediaResponseDto,
} from '@application/interface/service/media.service';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

@Injectable()
export class MediaService implements IMediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const appConfig = this.configService.get<AppConfig>('app', { infer: true });
    this.baseUrl = appConfig?.media?.baseUrl ?? 'http://localhost:3001';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    this.logger.log(`MediaService initialized with baseUrl: ${this.baseUrl}`);
  }

  async createMedia(dto: CreateMediaDto, token: string): Promise<CreateMediaResponseDto> {
    try {
      this.logger.debug(`Creating media record for file: ${dto.filename}`);
      const response = await this.httpClient.post<CreateMediaResponseDto>('/media/create', dto, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to create media record: ${error.message}`, error.stack);
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to create media record',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Failed to connect to media service', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async markAsLoaded(mediaId: string, token: string): Promise<void> {
    try {
      this.logger.debug(`Marking media ${mediaId} as loaded`);
      await this.httpClient.post(
        `/media/${mediaId}/loading-end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to mark media as loaded: ${error.message}`, error.stack);
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to mark media as loaded',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Failed to connect to media service', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadFile(
    mediaId: string,
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    token: string,
  ): Promise<void> {
    try {
      this.logger.debug(`Uploading file for media ${mediaId} (size: ${file.buffer.length} bytes)`);
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Use streaming upload for better memory efficiency
      await this.httpClient.put(`/media/upload-redirect/${mediaId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        // Increase timeout for large files
        timeout: 60000, // 60 seconds
      });
    } catch (error: any) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to upload file',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Failed to connect to media service', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
