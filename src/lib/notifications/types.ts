export type NanoNotificationType =
  | 'SLOT_LIBERATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER'
  | 'ORDER_STATUS'
  | 'MATCH_ALERT'
  | 'CHAT_MESSAGE'
  | 'COMMUNITY'
  | 'ANNOUNCEMENT'
  | 'ADMIN_ALERT'
  | 'SYSTEM';

export type PlatformDevice =
  | 'WEB_CHROME'
  | 'WEB_SAFARI_IOS'
  | 'WEB_FIREFOX'
  | 'WEB_OTHER'
  | 'ANDROID_NATIVE'
  | 'IOS_NATIVE'
  | 'UNKNOWN';

export interface NanoNotificationPayload {
  title: string;
  body: string;
  type?: NanoNotificationType;
  url?: string;
  badgeCount?: number;
  tag?: string;
  icon?: string;
  data?: Record<string, any>;
}

export interface InAppNotificationItem {
  id: string;
  tenantId?: string | null;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string | Date;
}
