import { User } from '@domain/entities/user.entity';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findOne(id: number): Promise<User>;
  findOneByUsername(username: string): Promise<User>;
  findAll(skip?: number, take?: number): Promise<[User[], number]>;
  update(id: number, user: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;

  findEmailOrPhone(email?: string): Promise<User | null>;
}
