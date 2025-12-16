import { SendMailDto } from "@application/dto/mailer.dto";


export interface IMailerProvider {
	sendMail(sendMailDto: SendMailDto): Promise<void>;
}

export interface IHtmlTemplateReader {
	readTemplate(templatePath: string): Promise<string>;
}