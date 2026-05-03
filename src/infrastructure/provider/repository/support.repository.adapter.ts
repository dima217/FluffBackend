import { SupportTicket } from "@domain/entities/support-ticket.entity";
import { PROVIDER_CONSTANTS } from "@domain/interface/constant";
import { ISupportRepository } from "@domain/interface/support.repository";
import { DataSource, Repository } from "typeorm";
import { Inject, Injectable } from "@nestjs/common";
import { NotFoundEntityException } from "@domain/exceptions/entity.exceptions";
import { PaginationOptions } from "@domain/interface/product.repository";

@Injectable()
export class SupportRepositoryAdapter implements ISupportRepository {
    private repository: Repository<SupportTicket>;

    constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(SupportTicket);
    }

    async create(supportTicket: SupportTicket): Promise<SupportTicket> {
        const newSupportTicket = this.repository.create(supportTicket);
        return await this.repository.save(newSupportTicket);
    }

    async findAll(options?: PaginationOptions): Promise<{data: SupportTicket[], total: number}> {
        if (!options) {
			const data = await this.repository.find();
			return { data, total: data.length };
		}
        const { page, limit } = options;
		const skip = (page - 1) * limit;
        const [data, total] = await this.repository.findAndCount({skip, take: limit });
        return {data, total}
    }

    async findAllByUserId(userId: number, options?: PaginationOptions): Promise<{data: SupportTicket[], total: number}> {
        if (!options) {
			const data = await this.repository.find({ where: { userId } });
			return { data, total: data.length };
		}
    
		const { page, limit } = options;
		const skip = (page - 1) * limit;
        const [data, total] = await this.repository.findAndCount({ where: { userId }, skip, take: limit });
        return { data, total };
    }

    async findOne(id: number, userId?: number): Promise<SupportTicket> {
        const foundSupportTicket = await this.repository.findOne({ where: { id, userId } });
        if (!foundSupportTicket) {
            throw new NotFoundEntityException('Support ticket');
        }
        return foundSupportTicket;
    }

    async update(id: number, supportTicket: Partial<SupportTicket>): Promise<SupportTicket> {
        await this.repository.update(id, supportTicket);
        const updatedSupportTicket = await this.repository.findOne({ where: { id } });
        if (!updatedSupportTicket) {
            throw new NotFoundEntityException('Support ticket');
        }
        return updatedSupportTicket;
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}