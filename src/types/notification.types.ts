export type NotificationType =
    | 'critical'
    | 'warning'
    | 'movements'
    | 'confirmed'
    | 'system';

export type NotificationFilter = 'all' | NotificationType;

export interface NotificationAction {
    type: 'navigate' | 'none';
    route?: string[];
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    badges: string[];
    timestamp: string;      // ISO string — JSON no serializa Date, usamos string
    isRead: boolean;
    action: NotificationAction;
}