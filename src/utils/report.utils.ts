// Data
import { getProducts } from "../data/db";

// Tipos
import { 
    Categoria, 
    EstadoProducto, 
    InventoryReport, 
    InventoryStats, 
    Producto 
} from "../types/product.types";

// Utils
import { getPrecioFinal } from './product.utils';

// TODO: GENERACIÓN DE STATS

// Generar Estadísticas
export const generateStats = ( products: Producto[] ): InventoryStats => {
    const disponibles = products.filter( product => product.estado === 'disponible' );
    const agotados = products.filter( product => product.estado === 'agotado' );
    const descontinuados = products.filter( product => product.estado === 'descontinuado' );

    const sorted = [...products].sort(( a, b ) => b.precio - a.precio);
    const masCaro = sorted[0];
    const masBarato = sorted[sorted.length - 1];

    const valorTotal = products.reduce( ( total, product ) => {
        const stockTotal = product.variantes.reduce( 
            ( sum, variant ) => sum + variant.stock, 
            0 
        );

        return total + (getPrecioFinal(product) * stockTotal);
    }, 0 );

    const precioPromedio = products.length > 0
            ? Number(
                ( 
                    products.reduce(
                        ( sum, product ) => sum + product.precio, 
                        0
                    ) / products.length
                ).toFixed(2)
            )
            : 0;
    
    const productosPorCategoria = products.reduce<Partial<Record<Categoria, number>>>(
        ( acc, product ) => {
            acc[product.categoria] = ( acc[product.categoria] ?? 0 ) + 1;

            return acc;
        },
        {}
    );

    return {
        totalProductos: products.length,
        totalDisponibles: disponibles.length,
        totalAgotados: agotados.length,
        totalDescontinuados: descontinuados.length,
        masCaro,
        masBarato,
        valorTotalInventario: Number(valorTotal.toFixed(2)),
        precioPromedio,
        productosPorCategoria
    }
}

// TODO: GENERACIÓN DE REPORTES
let reportCounter = 1;

// Reporte completo - todos los productos
export const generateFullReport = (): InventoryReport => {
    const products = getProducts();

    return {
        id: reportCounter++,
        titulo: 'Reporte General de Inventario',
        generadoEn: new  Date().toISOString(),
        stats: generateStats(products),
        filtrosActivos: ['ninguno']
    };
}

// Reporte filtrado por categoría
export const generateReportByCategoria = ( categoria: Categoria ): InventoryReport => {
    const products = getProducts().filter( product => product.categoria === categoria );

    return {
        id: reportCounter++,
        titulo: `Reporte de Inventario - ${categoria}`,
        generadoEn: new Date().toISOString(),
        stats: generateStats(products),
        filtrosActivos: [`categoria: ${categoria}`]
    };
}

// Reporte filtrado por estado
export const generateReportByEstado = ( estado: EstadoProducto ): InventoryReport => {
    const products = getProducts().filter( product => product.estado === estado );

    return {
        id: reportCounter++,
        titulo: `Reporte de Inventario - ${estado}`,
        generadoEn: new Date().toISOString(),
        stats: generateStats(products),
        filtrosActivos: [`estado: ${estado}`]
    };
}

// Reporte de productos con stock bajo ( al menos una variante bajo el umbral )
export const generateLowStockReport = ( umbral: number = 10 ): InventoryReport => {
    const products = getProducts().filter( 
        product => product.variantes.some( 
            variant => variant.stock > 0 && variant.stock < umbral 
        ) 
    );

    return {
        id: reportCounter++,
        titulo: `Reporte de Stock Bajo ( umbral: ${umbral} unidades )`,
        generadoEn: new Date().toISOString(),
        stats: generateStats(products),
        filtrosActivos: [`stock < ${umbral}`]
    };
}