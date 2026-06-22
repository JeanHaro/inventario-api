export type Categoria =
    | 'electronica'
    | 'tecnologia'
    | 'ropa'
    | 'calzado'
    | 'alimentos'
    | 'bebidas'
    | 'hogar'
    | 'muebles'
    | 'deportes'
    | 'belleza'
    | 'juguetes'
    | 'libros'
    | 'vehiculos'
    | 'herramientas'
    | 'otros';

export type EstadoProducto =
    | 'disponible'
    | 'agotado'
    | 'reservado'
    | 'proximamente'
    | 'descontinuado'
    | 'pausado';

export type EstadoVariante =
    | 'disponible'
    | 'sin_stock'
    | 'reservado'
    | 'descontinuado';

export interface Variante {
    id: number;
    nombre?: string;
    talla?: string;
    color?: string;
    capacidad?: string;
    stock: number;
    estado: EstadoVariante;
    sku?: string;
    precioAdicional?: number;
    imagen?: string;
}

export interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    marca?: string;
    modelo?: string;
    precio: number;
    descuento?: number;
    categoria: Categoria;
    estado: EstadoProducto;
    variantes: Variante[];
    imagenes?: string[];
    etiquetas?: string[];
    creadoEn: string;
    actualizadoEn: string;
}

export interface InventoryStats {
    totalProductos: number;
    totalDisponibles: number;
    totalAgotados: number;
    totalDescontinuados: number;
    masCaro: Producto;
    masBarato: Producto;
    valorTotalInventario: number;
    precioPromedio: number;
    productosPorCategoria: Partial<Record<Categoria, number>>;
}

export interface InventoryReport {
    id: number;
    titulo: string;
    generadoEn: string;
    stats: InventoryStats;
    filtrosActivos: string[];
}