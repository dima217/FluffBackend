import { Code, CodeType } from "@domain/entities/code.entity";



export interface ICodeService {
	verifyCode(username: string, code: string, type: CodeType): Promise<boolean>;
	generateCode(username: string, type: CodeType): Promise<Code>;
}