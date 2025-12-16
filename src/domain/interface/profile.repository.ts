import { Profile } from '@domain/entities/profile.entity';

export interface IProfileRepository {
  create(userId: number, profile: Profile): Promise<Profile>;
  findByUserId(userId: number): Promise<Profile>;
  update(userId: number, profile: Profile): Promise<Profile>;
}
