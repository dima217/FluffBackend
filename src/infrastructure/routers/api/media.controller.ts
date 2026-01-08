import {
  Controller,
  Get,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { MediaService } from '@application/service/media.service';
import { Token } from '@infrastructure/decorator/token.decorator';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get media file (proxy to media service)',
    description:
      'Proxy endpoint to get media files from the media microservice. ' +
      'This endpoint streams the file from the media service to the client. ' +
      'Frontend should use this URL instead of direct media service URLs for better encapsulation.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'mediaId',
    type: String,
    description: 'Media ID from recipe/product image or step resource',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file streamed successfully',
    content: {
      'image/*': {},
      'video/*': {},
      'application/octet-stream': {},
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid mediaId or missing token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  @ApiResponse({ status: 503, description: 'Media service unavailable' })
  async getMedia(
    @Param('mediaId') mediaId: string,
    @Token() token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      throw new BadRequestException('JWT token is required');
    }

    if (!mediaId || mediaId.trim() === '') {
      throw new BadRequestException('Media ID is required');
    }

    try {
      const stream = await this.mediaService.getMediaStream(mediaId, token);

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${mediaId}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Handle stream errors
      stream.on('error', (error) => {
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to stream media file',
          });
        }
      });

      // Pipe stream to response
      stream.pipe(res);
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException(`Media file with ID ${mediaId} not found`);
      }
      throw error;
    }
  }
}
