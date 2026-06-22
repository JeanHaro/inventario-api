import { Request, Response } from "express";

// Tipos
import { 
    Categoria, 
    EstadoProducto 
} from "../../types/product.types";

// Utils de reporte
import { 
    generateFullReport, 
    generateLowStockReport, 
    generateReportByCategoria, 
    generateReportByEstado,
} from '../../utils/report.utils';

// Utils - Notificaciones
import { triggerReporteGenerado } from "../../utils/notification.utils";


const validCategorias: Categoria[] = [
    'electronica', 
    'tecnologia', 
    'ropa', 
    'calzado',
    'alimentos', 
    'bebidas', 
    'hogar', 
    'muebles', 
    'deportes', 
    'belleza', 
    'juguetes', 
    'libros',
    'vehiculos', 
    'herramientas', 
    'otros'
];

const validEstados: EstadoProducto[]    = [
    'disponible',
    'agotado',
    'reservado',
    'proximamente',
    'descontinuado',
    'pausado'
];

// GET /reports
export const getFullReport = ( req: Request, res: Response ): void => {
    const report = generateFullReport();
    triggerReporteGenerado( report.stats.totalProductos, report .titulo );

    res.json(report);
}

// GET /reports/categoria/:categoria
export const getReportByCategoria = ( req: Request, res: Response ): void => {
    const categoria = req.params.categoria as Categoria;

    if ( !validCategorias.includes(categoria) ) {
        res.status(400).json({
            error: `Categoría inválida. Opciones: ${validCategorias.join(', ')}`
        });

        return;
    }

    const report = generateReportByCategoria(categoria);
    triggerReporteGenerado(report.stats.totalProductos, report.titulo);

    res.json(report);
}

// GET /reports/estado/:estado
export const getReportByEstado = ( req: Request, res: Response ): void => {
    const estado = req.params.estado as EstadoProducto;

    if ( !validEstados.includes(estado) ) {
        res.status(400).json({ 
            error: `Estado inválido. Opciones: ${validEstados.join(', ')}` 
        });

        return;
    }

    const report = generateReportByEstado(estado);
    triggerReporteGenerado(report.stats.totalProductos, report.titulo);

    res.json(report);
}

// GET /reports/stock-bajo
export const getLowStockReport = ( req: Request, res: Response ): void => {
    const umbral = req.query.umbral ? Number(req.query.umbral) : 10;

    if ( isNaN(umbral) || umbral <=0 ) {
        res.status(400).json({
            error: 'El umbral debe ser un número mayor a 0'
        });

        return;
    }

    const report = generateLowStockReport(umbral);
    triggerReporteGenerado(report.stats.totalProductos, report.titulo);

    res.json(report);
}