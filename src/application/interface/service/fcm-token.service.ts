export interface IFcmTokenService {
  saveFcmToken(userId: number, fcmToken: string): Promise<void>;
  clearFcmTokens(userId: number): Promise<void>;
}