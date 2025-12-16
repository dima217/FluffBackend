import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/interface/user.repository';
import {
  NotFoundEntityException,
  AlreadyExistEntityException,
} from '@domain/exceptions/entity.exceptions';
import { isUniqueError } from '@domain/utils/error.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

type UserCacheFields = Pick<User, 'id' | 'username'>;

@Injectable()
export class UserRepositoryAdapter implements IUserRepository {
  private repository: Repository<User>;
  private readonly cachePrefix = 'user';
  private readonly logger = new Logger(UserRepositoryAdapter.name);

  constructor(
    @Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.repository = this.dataSource.getRepository(User);
  }

  private getCacheKeys(user: Partial<UserCacheFields>): string[] {
    const keys: string[] = [];
    if (user.username) {
      keys.push(`${this.cachePrefix}:username:${user.username}`);
    }
    if (user.id) {
      keys.push(`${this.cachePrefix}:id:${user.id}`);
    }
    return keys;
  }

  private async invalidateCache(user: Partial<UserCacheFields>): Promise<void> {
    const cacheKeys = this.getCacheKeys(user);
    this.logger.debug(`Invalidating cache for keys: ${cacheKeys.join(', ')}`);
    await Promise.all(cacheKeys.map(key => this.cacheManager.del(key)));
    this.logger.debug(`Cache invalidated successfully for ${cacheKeys.length} key(s)`);
  }

  private async setCachedUser(user: Partial<UserCacheFields>): Promise<void> {
    const cacheKeys = this.getCacheKeys(user);
    this.logger.debug(`Setting cache for keys: ${cacheKeys.join(', ')}`);
    await Promise.all(cacheKeys.map(key => this.cacheManager.set(key, user)));
    this.logger.debug(`Cache set successfully for ${cacheKeys.length} key(s)`);
  }

  private async getCachedUser(user: Partial<UserCacheFields>): Promise<User | null> {
    const cacheKeys = this.getCacheKeys(user);
    this.logger.debug(`Getting cache for keys: ${cacheKeys.join(', ')}`);
    const cachedUsers = await Promise.all(cacheKeys.map(key => this.cacheManager.get<User>(key)));
    const foundUser = cachedUsers.find(user => user !== null) ?? null;
    if (foundUser) {
      this.logger.debug(`Cache hit for user: ${foundUser.id || foundUser.username}`);
    } else {
      this.logger.debug(`Cache miss for keys: ${cacheKeys.join(', ')}`);
    }
    return foundUser;
  }

  async create(user: User): Promise<User> {
    try {
      const newUser = this.repository.create(user);
      const savedUser = await this.repository.save(newUser);
      this.setCachedUser(savedUser);
      return savedUser;
    } catch (error) {
      if (isUniqueError(error)) {
        throw new AlreadyExistEntityException('User');
      }
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    const cacheKey = `${this.cachePrefix}:id:${id}`;
    this.logger.debug(`Getting user from cache by id: ${id}`);
    const cachedUser = await this.cacheManager.get<User>(cacheKey);

    if (cachedUser) {
      this.logger.debug(`Cache hit for user id: ${id}`);
      return cachedUser;
    }

    this.logger.debug(`Cache miss for user id: ${id}, fetching from database`);
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundEntityException('User');
    }

    this.setCachedUser(user);
    return user;
  }

  async findOneByUsername(username: string): Promise<User> {
    const cacheKey = `${this.cachePrefix}:username:${username}`;
    this.logger.debug(`Getting user from cache by username: ${username}`);
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`Cache hit for username: ${username}`);
      return cachedUser;
    }

    this.logger.debug(`Cache miss for username: ${username}, fetching from database`);
    const user = await this.repository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundEntityException('User');
    }

    this.setCachedUser(user);

    return user;
  }

  async update(id: number, user: Partial<User>): Promise<User> {
    try {
      const existingUser = await this.repository.findOne({ where: { id } });
      if (!existingUser) {
        throw new NotFoundEntityException('User');
      }

      Object.assign(existingUser, user);
      const updatedUser = await this.repository.save(existingUser);

      this.invalidateCache(existingUser);
      this.setCachedUser(updatedUser);
      return updatedUser;
    } catch (error) {
      if (isUniqueError(error)) {
        throw new AlreadyExistEntityException('User');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.repository.softDelete(id);
    this.invalidateCache(user);
  }

  async findEmailOrPhone(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    this.logger.debug(`Getting user from cache by email: ${email}`);
    const cachedUser = await this.getCachedUser({ username: email });
    if (cachedUser) {
      this.logger.debug(`Cache hit for email: ${email}`);
      return cachedUser;
    }

    this.logger.debug(`Cache miss for email: ${email}, fetching from database`);
    const user = await this.repository.findOne({ where: { email } });

    if (user) {
      this.setCachedUser(user);
    }

    return user;
  }
}
