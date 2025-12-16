import { User } from "@domain/index";
import { IObservable } from "@domain/modules/observable.pattern";
import { Injectable, Inject, Logger } from "@nestjs/common";
import type { IMailerProvider } from "@application/interface/provider/mailer.provider";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import { ReactEmailRendererProvider } from "@infrastructure/provider/react-email-renderer.provider";
import { RegistrationWelcomeEmail } from "@infrastructure/templates/registration-welcome";
import * as React from "react";
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class NotificationRegistrationObservable extends IObservable<User> {
	private readonly logger = new Logger(NotificationRegistrationObservable.name);

	constructor(
		@Inject(PROVIDER_CONSTANTS.MAILER_PROVIDER)
		private readonly mailerProvider: IMailerProvider,
		@Inject(PROVIDER_CONSTANTS.REACT_EMAIL_RENDERER)
		private readonly reactEmailRenderer: ReactEmailRendererProvider,
		private readonly configService: ConfigService<AppConfig>,
	) {
		super();
	}

	async accept(data: User): Promise<void> {
		this.sendWelcomeEmailAsync(data).catch((error) => {
			this.logger.error(`Failed to send registration welcome email to ${data.email}: ${error instanceof Error ? error.message : String(error)}`);
		});
	}

	private async sendWelcomeEmailAsync(data: User): Promise<void> {
		this.logger.log(`Sending registration welcome email to: ${data.email}`);

		try {
			const appConfig = this.configService.get<AppConfig>("app", { infer: true });
			const emailComponent = React.createElement(RegistrationWelcomeEmail, {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
			});
			const html = await this.reactEmailRenderer.renderEmail(emailComponent);

			await this.mailerProvider.sendMail({
				to: data.email,
				subject: "Welcome to ConstructorMini - Registration Successful",
				html,
				from: appConfig?.mailer.from,
			});

			this.logger.log(`Registration welcome email sent successfully to: ${data.email}`);
		} catch (error) {
			this.logger.error(`Failed to send registration welcome email to ${data.email}: ${error instanceof Error ? error.message : String(error)}`);
			// Don't throw error, just log it - registration should not fail if email sending fails
		}
	}
}