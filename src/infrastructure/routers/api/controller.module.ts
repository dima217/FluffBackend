import { UserController } from "./user.controller";
import { Module } from "@nestjs/common";
import { OAuthController } from "./oauth.controller";
import { RecipeController } from "./recipe.controller";
import { ProductController } from "./product.controller";
import { FavoriteController } from "./favorite.controller";
import { TrackingController } from "./tracking.controller";
import { MediaController } from "./media.controller";
import { ApplicationModule } from "@application/application.module";

@Module({
	imports: [ApplicationModule],
	controllers: [
		UserController,
		OAuthController,
		RecipeController,
		ProductController,
		FavoriteController,
		TrackingController,
		MediaController,
	],
})
export class ControllerModule {
}