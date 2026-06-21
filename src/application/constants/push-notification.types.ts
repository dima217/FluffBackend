export const PushNotificationType = {
  GENERIC: 'generic',
  TRACKING_REMINDER: 'tracking_reminder',
  SUPPORT_TICKET_REPLY: 'support_ticket_reply',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const;

export type PushNotificationTypeValue =
  (typeof PushNotificationType)[keyof typeof PushNotificationType];

export type PushNotificationData = Record<string, string>;

export interface SupportTicketReplyNotificationData {
  type: typeof PushNotificationType.SUPPORT_TICKET_REPLY;
  ticketId: string;
  subject: string;
  status: string;
}

export interface TrackingReminderNotificationData {
  type: typeof PushNotificationType.TRACKING_REMINDER;
  targetCalories: string;
  consumedCalories: string;
  caloriesLeft: string;
  date: string;
}

const truncate = (text: string, maxLength: number): string => {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
};

export const PushNotificationContent = {
  trackingReminder: (caloriesLeft: number) => ({
    title: 'Not enough calories today',
    body: `You still need around ${caloriesLeft} kcal today. Add one more meal to stay on track.`,
  }),

  trackingReminderImmediate: () => ({
    title: 'Not enough calories today',
    body: 'At this rate, you yourself will become like my stem. Have another meal!',
  }),

  supportTicketReply: (subject: string, messagePreview: string) => ({
    title: 'Ответ от поддержки',
    body: messagePreview
      ? truncate(messagePreview, 120)
      : `Получен ответ по обращению «${truncate(subject, 80)}»`,
  }),
};

export const pushDataString = (value: string | number | undefined | null): string =>
  value === undefined || value === null ? '' : String(value);

export const buildSupportTicketReplyData = (
  ticketId: number,
  subject: string,
  status: string,
): Record<string, string> => ({
  type: PushNotificationType.SUPPORT_TICKET_REPLY,
  ticketId: pushDataString(ticketId),
  subject: pushDataString(subject),
  status: pushDataString(status),
});

export const buildAchievementUnlockedData = (
  achievementCode: string,
): Record<string, string> => ({
  type: PushNotificationType.ACHIEVEMENT_UNLOCKED,
  achievementCode: pushDataString(achievementCode),
});
