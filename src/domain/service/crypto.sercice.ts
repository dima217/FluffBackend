import { createHmac, timingSafeEqual } from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";


@Injectable()
export class DomainCryptoService {
	private readonly encryptionSecret: string;

	constructor(private readonly configService: ConfigService) {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		this.encryptionSecret = appConfig?.encryption.secret ?? "your-encryption-secret";
	}

	encrypt(data: string): string {
		return createHmac("sha256", this.encryptionSecret).update(data).digest("hex");
	}

	verify(data: string, signature: string): boolean {
		const computed = this.encrypt(data);
		if (computed.length !== signature.length) {
			return false;
		}

		return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(signature, "hex"));
	}
}