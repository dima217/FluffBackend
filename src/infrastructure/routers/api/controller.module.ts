import { UserController } from "./user.controller";
import { Module } from "@nestjs/common";
import { OAuthController } from "./oauth.controller";
import { RecipeController } from "./recipe.controller";
import { ProductController } from "./product.controller";
import { FavoriteController } from "./favorite.controller";
import { TrackingController } from "./tracking.controller";
import { MediaController } from "./media.controller";
import { AdminController } from "./admin.controller";
import { ApplicationModule } from "@application/application.module";
import { SupportController } from "./support.controller";

@Module({
	imports: [ApplicationModule],
	controllers: [
		UserController,
		OAuthController,
		RecipeController,
		ProductController,
		FavoriteController,
		SupportController,
		TrackingController,
		MediaController,
		AdminController,
	],
})
export class ControllerModule {
}