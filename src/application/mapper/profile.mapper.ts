import { Profile } from '@domain/entities/profile.entity';
import type { User } from '@domain/entities/user.entity';
import { CreateProfileDto } from '@application/dto/profile.dto';

export class ProfileMapper {
	static toEntity(user: User, data?: CreateProfileDto): Profile {
		return {
			user,
			birthDate: data?.birthDate || new Date(),
			bio: data?.bio || '',
			photo: data?.photo || '',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Profile;
	}
}

