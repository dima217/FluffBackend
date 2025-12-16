import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '@domain/entities/profile.entity';
import { User } from '@domain/entities/user.entity';
import { IProfileRepository } from '@domain/interface/profile.repository';
import {
  NotFoundEntityException,
  AlreadyExistEntityException,
} from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ProfileRepositoryAdapter implements IProfileRepository {
  private repository: Repository<Profile>;

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Profile);
  }

  async create(userId: number, profile: Profile): Promise<Profile> {
    const userRepository = this.dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundEntityException('User');
    }

    // Check if profile already exists for this user
    const existingProfile = await this.repository.findOne({
      where: { user: { id: userId } },
    });

    if (existingProfile) {
      throw new AlreadyExistEntityException('Profile');
    }

    const newProfile = this.repository.create({
      ...profile,
      user,
    });

    return await this.repository.save(newProfile);
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.repository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'user.roles'],
    });

    if (!profile) {
      throw new NotFoundEntityException('Profile');
    }

    return profile;
  }

  async update(userId: number, profile: Profile): Promise<Profile> {
    const existingProfile = await this.findByUserId(userId);

    Object.assign(existingProfile, {
      birthDate: profile.birthDate,
      bio: profile.bio,
      photo: profile.photo,
    });

    return await this.repository.save(existingProfile);
  }
}
