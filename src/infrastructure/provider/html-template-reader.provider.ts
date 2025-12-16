import { Injectable } from "@nestjs/common";
import { IHtmlTemplateReader } from "@application/interface/provider/mailer.provider";
import { readFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class HtmlTemplateReaderProvider implements IHtmlTemplateReader {
	private readonly templatesBasePath: string;

	constructor() {
		this.templatesBasePath = join(process.cwd(), "src", "infrastructure", "templates");
	}

	async readTemplate(templatePath: string): Promise<string> {
		const fullPath = join(this.templatesBasePath, templatePath);
		try {
			return await readFile(fullPath, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read template: ${templatePath}. ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

