export interface IFcmService {
    sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
    isEnabled: boolean;
}