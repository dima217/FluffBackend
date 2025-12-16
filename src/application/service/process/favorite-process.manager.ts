import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IFavoriteProcessStrategy } from '@application/interface/process/favorite-process.strategy';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { Favorite } from '@domain/entities/favorite.entity';

@Injectable()
export class FavoriteProcessManager implements OnModuleInit {
	private readonly logger = new Logger(FavoriteProcessManager.name);
	private createProcesses: Record<RelatedEntityType, IFavoriteProcessStrategy> = {} as Record<
		RelatedEntityType,
		IFavoriteProcessStrategy
	>;
	private deleteProcesses: Record<RelatedEntityType, IFavoriteProcessStrategy> = {} as Record<
		RelatedEntityType,
		IFavoriteProcessStrategy
	>;

	constructor(private readonly processes: IFavoriteProcessStrategy[]) { }

	onModuleInit(): void {
		this.registerProcesses(this.processes);
	}

	registerProcesses(processes: IFavoriteProcessStrategy[]): void {
		this.logger.log(`Registering ${processes.length} favorite processes`);

		this.createProcesses = processes.reduce(
			(acc, process) => {
				acc[process.type] = process;
				this.logger.log(`Registered create process for type: ${process.type}`);
				return acc;
			},
			{} as Record<RelatedEntityType, IFavoriteProcessStrategy>,
		);

		this.deleteProcesses = processes.reduce(
			(acc, process) => {
				acc[process.type] = process;
				this.logger.log(`Registered delete process for type: ${process.type}`);
				return acc;
			},
			{} as Record<RelatedEntityType, IFavoriteProcessStrategy>,
		);
	}

	async executeOnCreate(favorite: Favorite): Promise<void> {
		const process = this.createProcesses[favorite.relatedEntityType];
		if (!process) {
			this.logger.warn(`No process found for type: ${favorite.relatedEntityType}`);
			return;
		}

		this.logger.log(`Executing create process for type: ${favorite.relatedEntityType}`);
		await process.executeOnCreate(favorite);
	}

	async executeOnDelete(favorite: Favorite): Promise<void> {
		const process = this.deleteProcesses[favorite.relatedEntityType];
		if (!process) {
			this.logger.warn(`No process found for type: ${favorite.relatedEntityType}`);
			return;
		}

		this.logger.log(`Executing delete process for type: ${favorite.relatedEntityType}`);
		await process.executeOnDelete(favorite);
	}
}

