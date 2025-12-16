import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";


@Injectable()
export class DomainCodeService {
	private readonly codeLength: number;
	constructor(private readonly configService: ConfigService) {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		this.codeLength = appConfig?.code.length ?? 5;
	}

	generateCode(): string {
		let code = '';
		for (let i = 0; i < this.codeLength; i++) {
			code += Math.floor(Math.random() * 10).toString();
		}
		return code;
	}
}