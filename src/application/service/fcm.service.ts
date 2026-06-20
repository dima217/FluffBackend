import { IFcmService } from '@application/interface/service/fcm.service';
import { AppConfig } from '@config/index';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

/** Must match fluffMobile constants/pushNotifications.ts */
const ANDROID_NOTIFICATION_CHANNEL_ID = 'default';

/**
 * Firebase Cloud Messaging via Admin SDK.
 *
 * Supported env vars (first match wins):
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON — full service account JSON string (Railway / cloud)
 * 2. GOOGLE_APPLICATION_CREDENTIALS — path to service account JSON file (local / Docker)
 */
@Injectable()
export class FcmService implements IFcmService, OnModuleInit {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  private readonly logger = new Logger(FcmService.name);
  private enabled = false;

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.enabled = true;
      return;
    }

    const appConfig = this.configService.get<AppConfig>('app', { infer: true });
    const credentialsPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
      appConfig?.oauth?.google?.creditionals?.trim() ||
      '';
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

    try {
      if (serviceAccountJson) {
        const parsed = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
        admin.initializeApp({ credential: admin.credential.cert(parsed) });
        this.enabled = true;
        this.logger.log('Firebase Admin initialized for FCM (FIREBASE_SERVICE_ACCOUNT_JSON)');
        return;
      }

      if (!credentialsPath) {
        this.logger.warn(
          'FCM disabled: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS',
        );
        return;
      }

      if (!fs.existsSync(credentialsPath)) {
        this.logger.error(
          `FCM disabled: credentials file not found at "${credentialsPath}"`,
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      this.enabled = true;
      this.logger.log(`Firebase Admin initialized for FCM (${credentialsPath})`);
    } catch (e) {
      this.logger.error('Firebase Admin init failed', e instanceof Error ? e.stack : e);
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(`FCM send skipped (${tokens.length} token(s)): service is disabled`);
      return;
    }
    if (tokens.length === 0) {
      return;
    }

    const messages: admin.messaging.Message[] = tokens.map((token) => ({
      token,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
        },
      },
    }));

    const result = await admin.messaging().sendEach(messages);
    this.logger.log(`FCM: ${result.successCount}/${tokens.length} sends succeeded`);
    if (result.failureCount > 0) {
      result.responses.forEach((response, index) => {
        if (!response.success && response.error) {
          this.logger.warn(
            `FCM send failed for token[${index}] (${tokens[index]?.slice(0, 12)}…): ${response.error.code} — ${response.error.message}`,
          );
        }
      });
    }
  }
}
