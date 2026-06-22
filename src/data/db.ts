import fs from 'fs';
import path from 'path';

// Tipos
import { Producto } from '../types/product.types';
import { Notification } from '../types/notification.types';

const PRODUCTS_PATH = path.join(__dirname, 'products.json');
const NOTIFICATIONS_PATH = path.join(__dirname, 'notifications.json');

// PRODUCTOS
export const getProducts = (): Producto[] => {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');

    return JSON.parse(raw) as Producto[];
}

export const saveProducts = ( products: Producto[] ): void => {
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

// NOTIFICACIONES
export const getNotifications = (): Notification[] => {
    const raw = fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8');

    return JSON.parse(raw) as Notification[];
}

export const saveNotifications = ( notifications: Notification[] ): void => {
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2), 'utf-8');
}

