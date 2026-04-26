export interface IPushEventsService {
    sendToUserIds(userIds: number[], title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendToUserIdsAll(title: string, body: string, data?: Record<string, string>): Promise<void>;
}