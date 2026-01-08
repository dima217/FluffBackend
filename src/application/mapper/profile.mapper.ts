import { Profile } from '@domain/entities/profile.entity';
import type { User } from '@domain/entities/user.entity';
import { CreateProfileDto } from '@application/dto/profile.dto';

export interface ProfileRegistrationData {
  birthDate: Date;
  gender: string;
  height: number;
  weight: number;
  bio?: string;
  photo?: string;
}

export class ProfileMapper {
  static toEntity(user: User, data?: CreateProfileDto | ProfileRegistrationData): Profile {
    return {
      user,
      birthDate: data?.birthDate || new Date(),
      bio: data?.bio || '',
      photo: data?.photo || '',
      gender: (data as ProfileRegistrationData)?.gender || null,
      height: (data as ProfileRegistrationData)?.height || null,
      weight: (data as ProfileRegistrationData)?.weight || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Profile;
  }
}
