import { SendCodeDto } from "@application/dto/mailer.dto";


export interface ISendCodeProvider {
	sendCode(sendCodeDto: SendCodeDto): Promise<void>
}