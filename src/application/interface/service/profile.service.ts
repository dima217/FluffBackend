import { Profile } from "@domain/entities/profile.entity";
import { UpdateProfileDto } from "@application/dto/profile.dto";

export interface IProfileService {
	getProfile(userId: number): Promise<Profile>;
	updateProfile(userId: number, updateDto: UpdateProfileDto): Promise<Profile>;
}

