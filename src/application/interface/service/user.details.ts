import { User } from '@domain/entities/user.entity';

export interface IUserDetailsService {
  loadUserByUsername(username: string): Promise<User>;
}
