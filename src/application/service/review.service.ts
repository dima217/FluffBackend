import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IReviewRepository } from '@domain/interface/review.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @Inject(REPOSITORY_CONSTANTS.REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async findAllAdmin(page: number, limit: number): Promise<{ data: any[]; total: number }> {
    this.logger.log(`Finding all reviews (admin), page=${page}, limit=${limit}`);
    const all = await this.reviewRepository.findAll();
    const total = all.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = all.slice(start, end);
    return { data, total };
  }
}
