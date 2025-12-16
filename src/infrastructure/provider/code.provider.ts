import { Injectable, Inject, Logger } from "@nestjs/common";
import { ISendCodeProvider } from "@application/interface/provider/code.provider";
import type { IMailerProvider } from "@application/interface/provider/mailer.provider";
import { SendCodeDto } from "@application/dto/mailer.dto";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import { ReactEmailRendererProvider } from "./react-email-renderer.provider";
import { CodeSignupEmail } from "@infrastructure/templates/code-signup";
import { CodeRecoveryEmail } from "@infrastructure/templates/code-recovery";
import { CodeDefaultEmail } from "@infrastructure/templates/code-default";
import * as React from "react";
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class SendCodeProvider implements ISendCodeProvider {
	private readonly logger = new Logger(SendCodeProvider.name);

	constructor(
		@Inject(PROVIDER_CONSTANTS.MAILER_PROVIDER)
		private readonly mailerProvider: IMailerProvider,
		@Inject(PROVIDER_CONSTANTS.REACT_EMAIL_RENDERER)
		private readonly reactEmailRenderer: ReactEmailRendererProvider,
		private readonly configService: ConfigService<AppConfig>,
	) { }

	async sendCode(sendCodeDto: SendCodeDto): Promise<void> {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		const expirationMinutes = Math.floor(
			(sendCodeDto.expirationDate.getTime() - new Date().getTime()) / 1000 / 60,
		);
		const expirationDate = sendCodeDto.expirationDate.toLocaleString();

		const emailComponent = this.getEmailComponent(sendCodeDto.type, {
			code: sendCodeDto.code,
			expirationMinutes,
			expirationDate,
		});
		const html = await this.reactEmailRenderer.renderEmail(emailComponent);

		this.logger.log(`Sending code ${sendCodeDto.code} to ${sendCodeDto.email} with type ${sendCodeDto.type}`);
		await this.mailerProvider.sendMail({
			to: sendCodeDto.email,
			subject: this.getSubject(sendCodeDto.type),
			html,
			from: appConfig?.mailer.from,
		});
		this.logger.log(`Code ${sendCodeDto.code} sent to ${sendCodeDto.email} with type ${sendCodeDto.type}`);
	}

	private getEmailComponent(
		type: string,
		props: { code: string; expirationMinutes: number; expirationDate: string },
	): React.ReactElement {
		const templates = {
			signup: CodeSignupEmail,
			recovery: CodeRecoveryEmail,
		};
		const EmailComponent = templates[type as keyof typeof templates] ?? CodeDefaultEmail;
		return React.createElement(EmailComponent, props);
	}

	private getSubject(type: string): string {
		const subjects = {
			signup: "Verification Code for Sign Up",
			recovery: "Password Recovery Code",
		};
		return subjects[type as keyof typeof subjects] ?? "Verification Code";
	}
}

