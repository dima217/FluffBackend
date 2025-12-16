import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Code, CodeType } from '@domain/entities/code.entity';
import { ICodeRepository } from '@domain/interface/code.repository';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class CodeRepositoryAdapter implements ICodeRepository {
	private repository: Repository<Code>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Code);
	}

	async create(code: Code): Promise<Code> {
		const newCode = this.repository.create(code);
		return await this.repository.save(newCode);
	}

	async findByUsernameAndCode(username: string, code: string, type: CodeType): Promise<Code | null> {
		return await this.repository.findOne({
			where: { username, code, type },
			order: { createdAt: 'DESC' },
		});
	}

	async findByUsernameAndType(username: string, type: CodeType): Promise<Code | null> {
		return await this.repository.findOne({
			where: { username, type },
			order: { createdAt: 'DESC' },
		});
	}

	async delete(id: number): Promise<void> {
		await this.repository.delete(id);
	}

	async deleteByUsernameAndType(username: string, type: CodeType): Promise<void> {
		await this.repository.delete({ username, type });
	}
}

