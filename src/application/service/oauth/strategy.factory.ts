import { OAuthStrategy } from "@application/interface/oauth.strategy";
import { OAuthType } from "@application/dto/oauth.dto";
import { ForbiddenException } from "@nestjs/common";

export class OAuthStrategyFactory {
	private readonly strategiesMap: Map<OAuthType, OAuthStrategy>;

	constructor(strategies: OAuthStrategy[]) {
		this.strategiesMap = new Map<OAuthType, OAuthStrategy>(
			strategies.map(strategy => [strategy.type, strategy])
		);
	}

	getStrategy(type: OAuthType): OAuthStrategy {
		const strategy = this.strategiesMap.get(type);
		if (!strategy) {
			throw new ForbiddenException(`OAuth type ${type} not supported`);
		}
		return strategy;
	}
}