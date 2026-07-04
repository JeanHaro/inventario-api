// Data
import { getProducts, saveProducts } from "../data/db";

// Tipos
import { 
    Categoria, 
    EstadoProducto, 
    Producto, 
    Variante
} from "../types/product.types";

// TODO: CONSULTAS

// Obtener todos los productos
export const findAll = (): Producto[] => {
    return getProducts();
}

// Obtener producto por id
export const findById = ( id: number ): Producto | undefined => {
    return getProducts().find( product => product.id === id );
}

// Obtener productos por categoría
export const findByCategoria = ( categoria: Categoria ): Producto[] => {
    return getProducts().filter( product => product.categoria === categoria );
}

// Obtener productos por estado
export const findByEstado = ( estado: EstadoProducto ): Producto[] => {
    return getProducts().filter( product => product.estado === estado );
}

// Obtener productos por marca
export const findByMarca = ( marca: string ): Producto[] => {
    return getProducts().filter( 
        product => product.marca?.toLowerCase().includes(
            marca.toLowerCase()
        ) 
    );
}

// Buscar productos por nombre
export const searchByNombre = ( query: string ): Producto[] => {
    return getProducts().filter( 
        product => product.nombre.toLowerCase().includes(
            query.toLowerCase()
        ) 
    );
}

// Buscar productos por categoría
export const searchByCategoria = ( query: string ): Producto[] => {
    return getProducts().filter(
        product => product.categoria.toLowerCase().includes(
            query.toLowerCase()
        )
    );
}

// Buscar productos por etiqueta
export const findByEtiqueta = ( etiqueta: string ): Producto[] => {
    const query = etiqueta.toLowerCase();

    return getProducts().filter(
        // some() - verifica si al menos una etiqueta cumple con la condición especifica
        product => product.etiquetas?.some( 
            etiqueta => etiqueta.toLowerCase().includes(query)
        )
    );
}

// TODO: PRECIO FINAL
export const getPrecioFinal = ( producto: Producto, varianteId?: number ): number => {
    const descuento = producto.descuento ?? 0;
    const precioBase = producto.precio * ( 1 - ( descuento / 100 ) );

    if ( varianteId !== undefined ) {
        const variante = producto.variantes.find( variante => variante.id === varianteId );
        const adicional = variante?.precioAdicional ?? 0;
        
        return Number( ( precioBase + adicional ).toFixed(2) );
    }

    return Number(precioBase.toFixed(2));
}

// TODO: CRUD DE PRODUCTOS

// Crear producto
export const createProducto = ( 
    data: Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'> 
): Producto => {
    const products = getProducts();
    const now = new Date().toISOString();
    const newProduct: Producto = {
        ...data,
        id: products.length === 0 ? 1 : Math.max( ...products.map( product => product.id )) + 1,
        creadoEn: now,
        actualizadoEn: now,
    };

    saveProducts([
        ...products,
        newProduct
    ]);

    return newProduct;
}

// Actualizar producto
export const updateProducto = (
    id: number,
    data: Partial<Omit<Producto, 'id' | 'creadoEn'>>
): Producto | undefined => {
    const products = getProducts();
    const index = products.findIndex( product => product.id === id );
    if ( index === -1 ) return undefined;

    // Actualizamos
    products[index] = {
        ...products[index],
        ...data,
        actualizadoEn: new Date().toISOString()
    };

    saveProducts(products);

    return products[index];
}

// Eliminar producto
export const deleteProducto = ( id: number ): boolean => {
    const products = getProducts();
    const index = products.findIndex( product => product.id === id );
    if ( index === -1 ) return false;

    products.splice(index, 1);
    saveProducts(products);

    return true;
}

// TODO: CRUD DE VARIANTES

// Agregar variante
export const addVariante = (
    productId: number,
    data: Omit<Variante, 'id'>
): Producto | undefined => {
    const products = getProducts();
    const index = products.findIndex( product => product.id === productId );
    if ( index === -1 ) return undefined;

    const variantes = products[index].variantes;
    const newVariante: Variante = {
        ...data,
        id: variantes.length === 0 ? 1 : Math.max(...variantes.map(v => v.id)) + 1
    }

    products[index].variantes.push(newVariante);
    products[index].actualizadoEn = new Date().toISOString();

    saveProducts(products);

    return products[index];
}

// Actualizar variante
export const updateVariante = (
    productoId: number,
    varianteId: number,
    data: Partial<Omit<Variante, 'id'>>
): Producto | undefined => {
    const products = getProducts();
    const productIndex = products.findIndex( product => product.id === productoId );
    if ( productIndex === -1 ) return undefined;

    const variantIndex = products[productIndex].variantes.findIndex( 
        variant => variant.id === varianteId
    );
    if ( variantIndex === -1 ) return undefined;

    // Actualizamos
    products[productIndex].variantes[variantIndex] = {
        ...products[productIndex].variantes[variantIndex],
        ...data
    };
    products[productIndex].actualizadoEn = new Date().toISOString();

    saveProducts(products);

    return products[productIndex];
}

// Eliminar variante
export const deleteVariante = (
    productoId: number,
    varianteId: number
): Producto | undefined => { 
    const products = getProducts();
    const productIndex = products.findIndex( product => product.id === productoId );
    if ( productIndex === -1 ) return undefined;
    
    const variantIndex = products[productIndex].variantes.findIndex( 
        variant => variant.id === varianteId
    );
    if ( variantIndex === -1 ) return undefined;

    // Eliminamos
    products[productIndex].variantes.splice(variantIndex, 1);
    products[productIndex].actualizadoEn = new Date().toISOString();

    saveProducts(products);

    return products[productIndex];
}

// TODO: HELPERS PARA TRIGGERS

// Obtener variantes que llegaron a 0 stock
export const getVariantesAgotadas = ( producto: Producto ): Variante[] => {
    return producto.variantes.filter( variant => variant.stock === 0 );
}

// Obtener variantes con stock bajo ( menos de 10 )
export const getVariantesBajas = ( producto: Producto, umbral: number = 10 ): Variante[] => {
    return producto.variantes.filter( 
        variant => variant.stock > 0 && variant.stock < umbral 
    );
}

// Verificar si el SKU ya existe en alguna variante de cualquier producto
export const isSkuUnique = (
    sku: string, 
    excludeVarianteId?: number 
): boolean => {
    return !getProducts().some( product =>
        product.variantes.some( variante =>
            variante.sku === sku && variante.id !== excludeVarianteId
        )
    );
}


