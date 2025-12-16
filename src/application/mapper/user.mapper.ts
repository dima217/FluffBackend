import { UserSignUpDto } from '@application/dto/user.dto';
import { User } from '@domain/entities/user.entity';

export class UserMapper {
	static toEntity(dto: UserSignUpDto, encryptedPassword: string): User {
		return {
			id: 0,
			firstName: dto.firstName,
			lastName: dto.lastName,
			username: dto.email.toLowerCase(),
			email: dto.email.toLowerCase(),
			password: encryptedPassword,
			isActive: true,
			isSuper: false,
			roles: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		} as User;
	}

	static toEntityFromGoogle(email: string, firstName: string, lastName: string, encryptedPassword: string): User {
		return {
			id: 0,
			firstName,
			lastName,
			username: email.toLowerCase(),
			email: email.toLowerCase(),
			password: encryptedPassword,
			isActive: true,
			isSuper: false,
			roles: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		} as User;
	}
}

