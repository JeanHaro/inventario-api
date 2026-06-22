import { Router } from "express";

// Controaldor
import { 
    createNewNotification, 
    deleteExistingNotification, 
    getAllNotifications, 
    getNotificationById, 
    getNotificationCount, 
    markAllNotificationsAsRead, 
    markNotificationAsRead 
} from "../controllers/notifications.controller";

const router = Router();

router.get('/count', getNotificationCount);
router.get('/read-all', markAllNotificationsAsRead);
router.get('/:id', getNotificationById);
router.get('/', getAllNotifications);

router.post('/', createNewNotification);

router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

router.delete('/:id', deleteExistingNotification);

export default router;