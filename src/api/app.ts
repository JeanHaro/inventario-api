import express from 'express';
import path from 'path';
import cors from 'cors';

import productsRouter from './routes/products.routes';
import reportsRouter from './routes/reports.routes';
import notificationsRouter from './routes/notifications.routes';

const app = express();
const PORT = 3002;

// MIDDLEWARES
app.use(express.json());

// CORS
app.use(cors());

// RUTAS
app.use('/products', productsRouter);
app.use('/reports', reportsRouter);
app.use('/notifications', notificationsRouter);

// Servir imágenes estáticamente — accesibles desde el navegador
app.use('/uploads', express.static(
    path.join(__dirname, '../uploads')
));


// BASE
app.get('/', ( req: express.Request, res: express.Response ) => {
    res.json({
        message: 'Inventario API activa',
        version: '1.0.0',
        recursos: [
            '/products',
            '/reports',
            '/notifications'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
})