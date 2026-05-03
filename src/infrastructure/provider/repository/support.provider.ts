import { Provider } from "@nestjs/common";
import { REPOSITORY_CONSTANTS } from "@domain/interface/constant";
import { SupportRepositoryAdapter } from "./support.repository.adapter";

export const supportRepository: Provider[] = [
    {
        provide: REPOSITORY_CONSTANTS.SUPPORT_TICKET_REPOSITORY,
        useClass: SupportRepositoryAdapter,
    },
];