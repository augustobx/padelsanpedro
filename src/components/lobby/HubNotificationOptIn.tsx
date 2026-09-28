'use client';

import NanoNotificationOptIn from '@/components/notifications/NanoNotificationOptIn';

interface HubNotificationOptInProps {
  accentColor?: string;
}

export default function HubNotificationOptIn({ accentColor = '#10b981' }: HubNotificationOptInProps) {
  return <NanoNotificationOptIn accentColor={accentColor} />;
}
