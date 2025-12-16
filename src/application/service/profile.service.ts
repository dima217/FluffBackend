import { Injectable, Inject, Logger } from "@nestjs/common";
import { IProfileService } from "@application/interface/service/profile.service";
import type { IProfileRepository } from "@domain/interface/profile.repository";
import type { IUserRepository } from "@domain/interface/user.repository";
import { Profile } from "@domain/entities/profile.entity";
import { UpdateProfileDto } from "@application/dto/profile.dto";
import { partialUpdate } from "@application/utils/partial-update.util";
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ProfileService implements IProfileService {
	private readonly logger = new Logger(ProfileService.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.PROFILE_REPOSITORY)
		private readonly profileRepository: IProfileRepository,

		@Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) { }

	async getProfile(userId: number): Promise<Profile> {
		this.logger.log(`Getting profile for user ID: ${userId}`);
		return await this.profileRepository.findByUserId(userId);
	}

	async updateProfile(userId: number, updateDto: UpdateProfileDto): Promise<Profile> {
		this.logger.log(`Updating profile for user ID: ${userId}`);

		const existingProfile = await this.profileRepository.findByUserId(userId);
		const existingUser = existingProfile.user;

		// Update user fields (firstName, lastName) using partial update utility
		const userUpdate = partialUpdate(existingUser, {
			firstName: updateDto.firstName,
			lastName: updateDto.lastName,
		});
		await this.userRepository.update(userId, userUpdate);

		// Update profile fields using partial update utility
		const profileUpdate = partialUpdate(existingProfile, {
			birthDate: updateDto.birthDate,
			bio: updateDto.bio,
			photo: updateDto.photo,
		});
		await this.profileRepository.update(userId, profileUpdate);

		// Return profile with user relation loaded
		return await this.profileRepository.findByUserId(userId);
	}
}

