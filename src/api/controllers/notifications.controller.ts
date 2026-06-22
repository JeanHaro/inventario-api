import { Request, Response } from 'express';

// Tipo
import { NotificationType } from '../../types/notification.types';

// Utils
import { 
    createNotification,
    deleteNotification,
    findAllNotifications,
    findByType,
    findNotificationById,
    findUnread,
    findUnreadByType, 
    getUnreadCount, 
    getUnreadCountByType, 
    markAllAsRead, 
    markAsRead
} from '../../utils/notification.utils';

const validTypes: NotificationType[] = [
    'critical', 
    'warning', 
    'movements', 
    'confirmed', 
    'system'
];

// GET /notifications
export const getAllNotifications = ( req: Request, res: Response ): void => {
    const { type, unread } = req.query;

    if ( type ) {
        if ( !validTypes.includes( type as NotificationType ) ) {
            res.status(400).json({ 
                error: `Tipo inválido. Opciones: ${validTypes.join(', ')}` 
            });

            return;
        }

        if ( unread === 'true' ) {
            res.json(
                findUnreadByType(type as NotificationType)
            );
            
            return;
        }

        res.json(
            findByType(type as NotificationType)
        );

        return;
    }

    if (unread === 'true') {
        res.json(findUnread());
        return;
    }

    res.json(findAllNotifications());
}

// GET /notifications/count
export const getNotificationCount = ( req: Request, res: Response ): void => {
    const { type } = req.query;

    if (type) {
        if ( !validTypes.includes( type as NotificationType ) ) {
            res.status(400).json({ 
                error: `Tipo inválido. Opciones: ${validTypes.join(', ')}` 
            });

            return;
        }

        res.json({ 
            type, 
            unreadCount: getUnreadCountByType( type as NotificationType ) 
        });

        return;
    }

    res.json({ 
        unreadCount: getUnreadCount() 
    });
}

// GET /notifications/:id
export const getNotificationById = ( req: Request, res: Response ): void => {
    const notification = findNotificationById(req.params.id.toString());

    if ( !notification ) {
        res.status(404).json({ 
            error: `Notificación ${req.params.id} no encontrada` 
        });

        return;
    }

    res.json(notification);
}

// POST /notifications — solo para uso interno o admin
export const createNewNotification = ( req: Request, res: Response ): void => {
    const { type, title, description, badges, action } = req.body;

    if ( 
        !type || 
        !title || 
        !description || 
        !badges || 
        !action 
    ) {
        res.status(400).json({ 
            error: 'Campos obligatorios: type, title, description, badges, action' 
        });

        return;
    }

    if ( !validTypes.includes(type) ) {
        res.status(400).json({ 
            error: `Tipo inválido. Opciones: ${validTypes.join(', ')}` 
        });

        return;
    }

    const notification = createNotification({ 
        type, 
        title, 
        description, 
        badges, 
        action 
    });

    res.status(201).json(notification);
}

// PATCH /notifications/:id/read
export const markNotificationAsRead = ( req: Request, res: Response ): void => {
    const updated = markAsRead(req.params.id.toString());

    if ( !updated ) {
        res.status(404).json({ 
            error: `Notificación ${req.params.id} no encontrada` 
        });

        return;
    }

    res.json(updated);
}

// PATCH /notifications/read-all
export const markAllNotificationsAsRead = ( req: Request, res: Response ): void => {
    markAllAsRead();
    res.json({ 
        message: 'Todas las notificaciones marcadas como leídas' 
    });
}

// DELETE /notifications/:id
export const deleteExistingNotification = ( req: Request, res: Response ): void => {
    const deleted = deleteNotification(req.params.id.toString());

    if ( !deleted ) {
        res.status(404).json({ 
            error: `Notificación ${req.params.id} no encontrada` 
        });

        return;
    }

    res.json({
        message: `Notificación ${req.params.id} eliminada correctamente` 
    });
}