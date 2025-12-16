import { UserSignUpDto } from '@application/dto/user.dto';
import { User } from '@domain/entities/user.entity';

export interface IUserInitializationService {
  initializeUser(user: UserSignUpDto): Promise<User>;
}
