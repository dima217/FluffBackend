import { Provider } from "@nestjs/common";
import { SendCodeProvider } from "./code.provider";
import { MailerProvider } from "./mailer.provider";
import { HtmlTemplateReaderProvider } from "./html-template-reader.provider";
import { ReactEmailRendererProvider } from "./react-email-renderer.provider";
import { PROVIDER_CONSTANTS } from "@domain/interface/constant";

export const codeProviders: Provider[] = [
	{
		provide: PROVIDER_CONSTANTS.SEND_CODE_PROVIDER,
		useClass: SendCodeProvider,
	},
	{
		provide: PROVIDER_CONSTANTS.MAILER_PROVIDER,
		useClass: MailerProvider,
	},
	{
		provide: PROVIDER_CONSTANTS.HTML_TEMPLATE_READER,
		useClass: HtmlTemplateReaderProvider,
	},
	{
		provide: PROVIDER_CONSTANTS.REACT_EMAIL_RENDERER,
		useClass: ReactEmailRendererProvider,
	},
];

