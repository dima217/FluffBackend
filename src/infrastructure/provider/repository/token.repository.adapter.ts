import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Token } from '@domain/entities/token.entity';
import { ITokenRepository } from '@domain/interface/token.repository';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class TokenRepositoryAdapter implements ITokenRepository {
	private repository: Repository<Token>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Token);
	}

	async create(token: Token): Promise<Token> {
		const newToken = this.repository.create(token);
		return await this.repository.save(newToken);
	}

	async findOneByToken(token: string): Promise<Token> {
		const foundToken = await this.repository.findOne({
			where: { token },
			relations: ['user'],
		});
		if (!foundToken) {
			throw new NotFoundEntityException('Token');
		}
		return foundToken;
	}

	async delete(id: string): Promise<void> {
		if (!(await this.repository.exists({ where: { id } }))) {
			throw new NotFoundEntityException('Token');
		}
		await this.repository.delete(id);
	}

	async deleteByUserId(userId: number): Promise<void> {
		await this.repository.delete({ user: { id: userId } } as any);
	}
}

