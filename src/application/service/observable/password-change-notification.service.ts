import { User } from "@domain/index";
import { IObservable } from "@domain/modules/observable.pattern";
import { Injectable, Inject, Logger } from "@nestjs/common";
import type { IMailerProvider } from "@application/interface/provider/mailer.provider";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import { ReactEmailRendererProvider } from "@infrastructure/provider/react-email-renderer.provider";
import { PasswordChangeNotificationEmail } from "@infrastructure/templates/password-change-notification";
import * as React from "react";
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class PasswordChangeNotificationObservable extends IObservable<User> {
	private readonly logger = new Logger(PasswordChangeNotificationObservable.name);

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
		this.sendPasswordChangeEmailAsync(data).catch((error) => {
			this.logger.error(`Failed to send password change notification email to ${data.email}: ${error instanceof Error ? error.message : String(error)}`);
		});
	}

	private async sendPasswordChangeEmailAsync(data: User): Promise<void> {
		this.logger.log(`Sending password change notification email to: ${data.email}`);

		try {
			const appConfig = this.configService.get<AppConfig>("app", { infer: true });
			const emailComponent = React.createElement(PasswordChangeNotificationEmail, {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
			});
			const html = await this.reactEmailRenderer.renderEmail(emailComponent);

			await this.mailerProvider.sendMail({
				to: data.email,
				subject: "ConstructorMini - Password Successfully Changed",
				html,
				from: appConfig?.mailer.from,
			});

			this.logger.log(`Password change notification email sent successfully to: ${data.email}`);
		} catch (error) {
			this.logger.error(`Failed to send password change notification email to ${data.email}: ${error instanceof Error ? error.message : String(error)}`);
			// Don't throw error, just log it - password change should not fail if email sending fails
		}
	}
}

