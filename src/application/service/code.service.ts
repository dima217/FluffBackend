import { Injectable, Inject } from '@nestjs/common';
import { ICodeService } from '@application/interface/service/code.serviece';
import { Code, CodeType } from '@domain/entities/code.entity';
import { DomainCodeService } from '@domain/service/code.serviece';
import type { ICodeRepository } from '@domain/interface/code.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class CodeService implements ICodeService {

	constructor(
		private readonly domainCodeService: DomainCodeService,
		@Inject(REPOSITORY_CONSTANTS.CODE_REPOSITORY)
		private readonly codeRepository: ICodeRepository,
	) { }

	async generateCode(username: string, type: CodeType): Promise<Code> {
		await this.codeRepository.deleteByUsernameAndType(username, type);

		const code = this.domainCodeService.generateCode();
		const expirationDate = new Date();
		expirationDate.setMinutes(expirationDate.getMinutes() + 10);

		const codeEntity = await this.codeRepository.create({
			id: 0,
			username,
			code,
			type,
			expirationDate,
			createdAt: new Date(),
		});
		codeEntity.code = code;
		return codeEntity;
	}

	async verifyCode(username: string, code: string, type: CodeType): Promise<boolean> {
		const foundCode = await this.codeRepository.findByUsernameAndCode(username, code, type);
		if (!foundCode) {
			return false;
		}

		if (foundCode.expirationDate < new Date()) {
			return false;
		}

		return true;
	}
}

