// Data
import { getNotifications, saveNotifications } from "../data/db";

// Tipos
import { 
    Notification, 
    NotificationType 
} from "../types/notification.types";
import { Producto, Variante } from "../types/product.types";

// TODO: CONSULTAS

// Obtener todas las notificaciones
export const findAllNotifications = (): Notification[] => {
    return getNotifications();
}

// Obtener notificacion por id
export const findNotificationById = ( id: string ): Notification | undefined => {
    return getNotifications().find( notification => notification.id === id );
}

// Obtener notificacion por tipo
export const findByType = ( type: NotificationType ): Notification[] => {
    return getNotifications().filter( notification => notification.type === type );
}

// Obtener notificaciones no leidas
export const findUnread = (): Notification[] => {
    return getNotifications().filter( notification => !notification.isRead );
}

// Obtener notificaciones no leidas por tipo
export const findUnreadByType = ( type: NotificationType ): Notification[] => {
    return findUnread().filter( notification => notification.type === type );
}

// Obtener cantidad de notificaciones no leidas
export const getUnreadCount = (): number => {
    return findUnread().length;
}

// Obtener cantidad de notificaciones no leidas por tipo
export const getUnreadCountByType = ( type: NotificationType ): number => {
    return findUnreadByType(type).length;
}

// TODO: CRUD

// Crear notificaciones
export const createNotification = (
    data: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
): Notification => {
    const notifications = getNotifications();
    const count = notifications.length;
    const newNotification: Notification = {
        ...data,
        id: `notif-${String(count + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        isRead: false
    };

    saveNotifications([...notifications, newNotification]);

    return newNotification;
}

// Marcar notificacion como leida
export const markAsRead = ( id: string ): Notification | undefined => {
    const notifications = getNotifications();
    const index = notifications.findIndex( notification => notification.id === id );
    if ( index === -1 ) return undefined;

    notifications[index] = { 
        ...notifications[index],
        isRead: true
    };

    saveNotifications(notifications);

    return notifications[index];
}

// Marcar todas las notificaciones como leidas
export const markAllAsRead = (): void => {
    const notifications = getNotifications().map(
        notification => ({
            ...notification,
            isRead: true
        })
    );

    saveNotifications(notifications);
}

// Eliminar notificacion
export const deleteNotification = ( id: string ): boolean => {
    const notifications = getNotifications();
    const index = notifications.findIndex( notification => notification.id === id );
    if ( index === -1 ) return false;

    notifications.splice(index, 1);

    saveNotifications(notifications);

    return true;
}

// TODO: TRIGGERS AUTOMATICOS

// Variantes con stock === 0 recién detectadas
export const triggerStockAgotado = (
    producto: Producto,
    variantes: Variante[]
): void => {
    variantes.forEach( variante => {
        const nombre = variante.nombre ?? variante.color ?? variante.talla ?? `Variante ${variante.id}`;

        createNotification({
            type: 'critical',
            title: `Stock agotado - ${producto.nombre} (${nombre})`,
            description: `La variante ${variante.sku ?? nombre} tiene 0 unidades. Ventas bloqueadas automáticamente.`,
            badges: ['Critica', 'Sin stock'],
            action: {
                type: 'navigate',
                route: [
                    'products',
                    String(producto.id)
                ]
            }
        });
    });
}

// Variante con stock bajo, pero mayor a 0
export const triggerStockBajo = ( 
    producto: Producto, 
    variantes: Variante[],
    umbral: number
): void => {
    variantes.forEach( variante => {
        const nombre = variante.nombre ?? variante.color ?? variante.talla ?? `Variante ${variante.id}`;

        createNotification({
            type: 'warning',
            title: `Stock bajo - ${producto.nombre} (${nombre})`,
            description: `La variante ${variante.sku ?? nombre} tiene solo ${variante.stock} unidades. Punto de reorden recomendado: ${umbral}`,
            badges: ['Alerta', 'Stock bajo'],
            action: {
                type: 'navigate',
                route: [ 
                    'products',
                    String(producto.id)
                ]
            }
        });
    });
}

// Producto recién creado
export const triggerProductoCreado = ( producto: Producto ): void => {
    createNotification({
        type: 'movements',
        title: `Nuevo producto registrado - ${producto.nombre}`,
        description: `Èl producto fue agregado al catálogo con estado '${producto.estado}'. ${producto.marca ? `Marca: ${producto.marca}.` : '' }`,
        badges: ['Movimiento', 'Entrada'],
        action: {
            type: 'navigate',
            route: [
                'products',
                String(producto.id)
            ]
        }
    });
}

// Producto eliminado
export const triggerProductoEliminado = ( producto: Producto ): void => {
    createNotification({
        type: 'movements',
        title: `Producto eliminado - ${producto.nombre}`,
        description: `El producto fue removido del catálogo permanentemente.`,
        badges: ['Movimiento', 'Salida'],
        action: { type: 'none' }
    });
}

// Stock subió (recepción de mercancía)
export const triggerStockRecibido = ( 
    producto: Producto, 
    variante: Variante, 
    cantidadAnterior: number
): void => {
    const nombre = variante.nombre ?? variante.color ?? variante.talla ?? `Variante ${variante.id}`;
    const cantidad = variante.stock - cantidadAnterior;

    createNotification({
        type: 'movements',
        title: `Recepción confirmada - ${producto.nombre} (${nombre})`,
        description: `Se ingresaron ${cantidad} unidades. Stock actual: ${variante.stock}.`,
        badges: ['Movimiento', 'Entrada', 'Recepción'],
        action: {
            type: 'navigate',
            route: [
                'products',
                String(producto.id)
            ]
        }
    });
}

// Variante nueva agregada al producto
export const triggerVarianteAgregada = (
    producto: Producto,
    variante: Variante
): void => {
    const nombre = variante.nombre ?? variante.color ?? variante.talla ?? `Variante ${variante.id}`;

    createNotification({
        type: 'movements',
        title: `Nueva variante agregada - ${producto.nombre}`,
        description: `Se agregó la variante "${nombre}" con ${variante.stock} unidades iniciales. ${variante.sku ? `SKU: ${variante.sku}.` : ''}`,
        badges: ['Movimiento', 'Entrada'],
        action: {
            type: 'navigate',
            route: [
                'products',
                String(producto.id)
            ]
        }
    });
}

// Estado del producto cambió a 'disponible'
export const triggerProductoActivado = ( producto: Producto ): void => {
    createNotification({
        type: 'confirmed',
        title: `Producto activado - ${producto.nombre}`,
        description: `El producto pasó a estado 'disponible' y ya aparece en el catálogo.`,
        badges: ['Confirmada', 'Activado'],
        action: {
            type: 'navigate',
            route: [
                'products',
                String(producto.id)
            ]
        }
    });
}

// Estado del producto cambió a 'descontinuado'
export const triggerProductoDescontinuado = ( producto: Producto ): void => {
    createNotification({
        type: 'confirmed',
        title: `Producto descontinuado - ${producto.nombre}`,
        description: `El producto fue marcado como descontinuado y salió del catálogo activo.`,
        badges: ['Confirmada', 'Descontinuado'],
        action: { type: 'none' }
    })
}

// Reporte generado (lo llama el reports controller)
export const triggerReporteGenerado = ( 
    totalProductos: number, 
    titulo: string 
): void => {
    createNotification({
        type: 'system',
        title: `Reporte generado - ${titulo}`,
        description: `El reporte fue procesado exitosamente. ${totalProductos} productos analizados.`,
        badges: ['Sistema', 'Reporte'],
        action: { type: 'none' }
    })
}