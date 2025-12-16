import { IUserDetailsService } from '@application/interface/service/user.details';
import { User } from '@domain/entities/user.entity';
import type { IUserRepository } from '@domain/interface/user.repository';
import { Inject, Injectable } from '@nestjs/common';
import { EntityDeletedException } from '@domain/exceptions/entity.exceptions';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class UserDetailsService implements IUserDetailsService {
  constructor(@Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY) private readonly userRepository: IUserRepository) { }

  async loadUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOneByUsername(username);

    if (user.deletedAt) {
      throw new EntityDeletedException('User');
    }

    return user;
  }
}
