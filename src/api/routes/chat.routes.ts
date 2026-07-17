import { Router } from 'express';

// Controlador
import { handleChat } from '../controllers/chat.controller';

const router = Router();
router.post('/', handleChat);

export default router;