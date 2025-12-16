import { Injectable, Logger } from "@nestjs/common";
import { IMailerProvider } from "@application/interface/provider/mailer.provider";
import { SendMailDto } from "@application/dto/mailer.dto";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailerProvider implements IMailerProvider {
	private readonly logger = new Logger(MailerProvider.name);
	private transporter: nodemailer.Transporter;

	constructor(private readonly configService: ConfigService<AppConfig>) {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		const port = appConfig?.mailer.port ?? 587;
		const useSecure = appConfig?.mailer.secure ?? false;
		const secure = useSecure && port === 465;
		const requireTLS = !secure && port === 587;

		const transporterConfig: nodemailer.TransportOptions = {
			host: appConfig?.mailer.host,
			port,
			secure,
			auth: {
				user: appConfig?.mailer.user,
				pass: appConfig?.mailer.password,
			},
			...(requireTLS && {
				requireTLS: true,
				tls: {
					// Do not fail on invalid certificates
					rejectUnauthorized: false,
				},
			}),
			// Additional options for better compatibility
			connectionTimeout: 60000,
			greetingTimeout: 30000,
			socketTimeout: 60000,
		} as nodemailer.TransportOptions;

		this.logger.debug(`Mailer configuration: host=${appConfig?.mailer.host}, port=${port}, secure=${secure}, requireTLS=${requireTLS}, user=${appConfig?.mailer.user}`);

		this.transporter = nodemailer.createTransport(transporterConfig);
	}

	async sendMail(sendMailDto: SendMailDto): Promise<void> {
		this.logger.debug(`Sending email to: ${sendMailDto.to}, subject: ${sendMailDto.subject}`);
		try {
			await this.transporter.sendMail({
				from: sendMailDto.from,
				to: sendMailDto.to,
				subject: sendMailDto.subject,
				html: sendMailDto.html,
				cc: sendMailDto.cc,
				bcc: sendMailDto.bcc,
				replyTo: sendMailDto.replyTo,
				attachments: sendMailDto.attachments,
				headers: sendMailDto.headers,
				envelope: sendMailDto.envelope,
			});
			this.logger.log(`Email sent successfully to: ${sendMailDto.to}`);
		} catch (error) {
			this.logger.error(`Failed to send email to ${sendMailDto.to}: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}
}

