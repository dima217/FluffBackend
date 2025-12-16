import { Code, CodeType } from '@domain/entities/code.entity';

export interface ICodeRepository {
	create(code: Code): Promise<Code>;
	findByUsernameAndCode(username: string, code: string, type: CodeType): Promise<Code | null>;
	findByUsernameAndType(username: string, type: CodeType): Promise<Code | null>;
	delete(id: number): Promise<void>;
	deleteByUsernameAndType(username: string, type: CodeType): Promise<void>;
}

