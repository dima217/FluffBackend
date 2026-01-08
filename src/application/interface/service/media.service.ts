export interface CreateMediaDto {
  filename: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface CreateMediaResponseDto {
  mediaId: string;
  url: string;
  uploadUrl: string;
}

export interface MediaUrlResponseDto {
  mediaId: string;
  url: string;
  isLoaded: boolean;
}

export interface IMediaService {
  createMedia(dto: CreateMediaDto, token: string): Promise<CreateMediaResponseDto>;
  markAsLoaded(mediaId: string, token: string): Promise<void>;
  uploadFile(mediaId: string, file: Express.Multer.File, token: string): Promise<void>;
  getMediaUrls(mediaIds: string[], token: string): Promise<MediaUrlResponseDto[]>;
}
