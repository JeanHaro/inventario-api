import { ToolDefinition } from '../types/chat.types';
import {
    createProducto,
    findAll,
    findById,
    findByCategoria,
    findByEstado,
    findByMarca,
    searchByNombre,
    searchByCategoria,
    findByEtiqueta,
    getPrecioFinal,
    getVariantesAgotadas,
    getVariantesBajas,
} from './product.utils';

export const chatTools: ToolDefinition[] = [

    // ========================================================= LECTURA

    {
    name: 'consultar_productos',
    description: `Consulta productos del inventario con filtros opcionales. Si no se pasa ningún filtro, devuelve TODOS los productos.

    IMPORTANTE:
    - Si el usuario menciona un producto por su nombre, usa ÚNICAMENTE el parámetro "nombre" — no agregues categoria, marca u otros filtros que no estés seguro que apliquen, ya que combinarlos reduce los resultados y podría no encontrar nada si adivinas mal.
    - El parámetro "categoria" solo acepta estos valores exactos: electronica, tecnologia, ropa, calzado, alimentos, bebidas, hogar, muebles, deportes, belleza, juguetes, libros, vehiculos, herramientas, otros. Nunca inventes ni adivines una categoría que no esté en esta lista.
    - Si no estás seguro del valor de un filtro, simplemente omítelo en vez de adivinar.`,
        parameters: {
            type: 'object',
            properties: {
                nombre: { type: 'string', description: 'Búsqueda parcial por nombre' },
                categoria: { type: 'string', description: 'Debe ser exactamente uno de: electronica, tecnologia, ropa, calzado, alimentos, bebidas, hogar, muebles, deportes, belleza, juguetes, libros, vehiculos, herramientas, otros' },
                marca: { type: 'string' },
                etiqueta: { type: 'string' },
                estado: { type: 'string' },
            },
            required: []
        }
    },
    {
        name: 'consultar_stock_bajo',
        description: 'Obtiene variantes con stock bajo (mayor a 0 pero por debajo de un umbral)',
        parameters: {
            type: 'object',
            properties: {
                umbral: { type: 'number', description: 'Por defecto 10 si no se especifica' }
            },
            required: []
        }
    },
    {
        name: 'consultar_stock_agotado',
        description: 'Obtiene las variantes que están completamente sin stock (0 unidades)',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'consultar_precio_final',
        description: 'Calcula el precio final de un producto (con descuento aplicado), opcionalmente de una variante específica',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                varianteId: { type: 'number' }
            },
            required: ['productoId']
        }
    },

    // ========================================================= CREAR

    {
        name: 'crear_producto',
        description: 'Crea un producto nuevo en el inventario, sin imágenes',
        parameters: {
            type: 'object',
            properties: {
                nombre: { type: 'string' },
                marca: { type: 'string' },
                precio: { type: 'number' },
                categoria: { type: 'string' },
                estado: { type: 'string' },
                descripcion: { type: 'string' },
            },
            required: ['nombre', 'marca', 'precio', 'categoria', 'estado']
        }
    },
    {
        name: 'crear_producto_con_imagenes',
        description: 'Crea un producto y le asocia una o varias imágenes que el usuario adjuntó en su mensaje. Usa imagenIndexes (0 = primera imagen adjunta, 1 = segunda, etc). Máximo 5 imágenes por producto.',
        parameters: {
            type: 'object',
            properties: {
                nombre: { type: 'string' },
                marca: { type: 'string' },
                precio: { type: 'number' },
                categoria: { type: 'string' },
                estado: { type: 'string' },
                descripcion: { type: 'string' },
                imagenIndexes: { type: 'array', items: { type: 'number' } }
            },
            required: ['nombre', 'marca', 'precio', 'categoria', 'estado', 'imagenIndexes']
        }
    },
    {
        name: 'crear_variante',
        description: 'Crea una variante nueva para un producto existente, sin imagen',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                nombre: { type: 'string' },
                sku: { type: 'string' },
                precioAdicional: { type: 'number' },
                stock: { type: 'number' },
                estado: { type: 'string' },
                talla: { type: 'string' },
                color: { type: 'string' },
                capacidad: { type: 'string' },
            },
            required: ['productoId', 'nombre', 'sku', 'precioAdicional', 'stock', 'estado']
        }
    },
    {
        name: 'crear_variante_con_imagen',
        description: 'Crea una variante nueva para un producto, asociando una de las imágenes que el usuario adjuntó. Usa imagenIndex (0 = primera imagen adjunta, 1 = segunda, etc).',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                nombre: { type: 'string' },
                sku: { type: 'string' },
                precioAdicional: { type: 'number' },
                stock: { type: 'number' },
                estado: { type: 'string' },
                talla: { type: 'string' },
                color: { type: 'string' },
                capacidad: { type: 'string' },
                imagenIndex: { type: 'number' }
            },
            required: ['productoId', 'nombre', 'sku', 'precioAdicional', 'stock', 'estado', 'imagenIndex']
        }
    },

    // ========================================================= ACTUALIZAR

    {
        name: 'actualizar_producto',
        description: 'Actualiza uno o varios campos de un producto existente (precio, nombre, descripción, categoría, marca, etc). Se puede usar varias veces en la misma conversación para actualizar múltiples productos a la vez.',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                nombre: { type: 'string' },
                marca: { type: 'string' },
                modelo: { type: 'string' },
                precio: { type: 'number' },
                descuento: { type: 'number' },
                categoria: { type: 'string' },
                estado: { type: 'string' },
                descripcion: { type: 'string' },
            },
            required: ['productoId']
        }
    },
    {
        name: 'archivar_producto',
        description: 'Archiva un producto (lo pasa a estado descontinuado)',
        parameters: {
            type: 'object',
            properties: { productoId: { type: 'number' } },
            required: ['productoId']
        }
    },
    {
        name: 'desarchivar_producto',
        description: 'Desarchiva un producto — vuelve a disponible si tiene stock en alguna variante, o a agotado si no tiene stock en ninguna',
        parameters: {
            type: 'object',
            properties: { productoId: { type: 'number' } },
            required: ['productoId']
        }
    },
    {
        name: 'agregar_imagenes_producto',
        description: 'Agrega una o varias imágenes a un producto YA EXISTENTE (no lo crea, solo le añade imágenes). Usa imagenIndexes para indicar cuáles imágenes adjuntas corresponden (0 = primera, 1 = segunda, etc). Máximo 5 imágenes por producto en total.',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                imagenIndexes: { type: 'array', items: { type: 'number' } }
            },
            required: ['productoId', 'imagenIndexes']
        }
    },
    {
        name: 'actualizar_variante',
        description: 'Actualiza uno o varios campos de una variante existente (precio adicional, stock, sku, talla, color, capacidad, etc)',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                varianteId: { type: 'number' },
                nombre: { type: 'string' },
                sku: { type: 'string' },
                precioAdicional: { type: 'number' },
                stock: { type: 'number' },
                estado: { type: 'string' },
                talla: { type: 'string' },
                color: { type: 'string' },
                capacidad: { type: 'string' },
            },
            required: ['productoId', 'varianteId']
        }
    },
    {
        name: 'archivar_variante',
        description: 'Archiva una variante (la pasa a estado descontinuado)',
        parameters: {
            type: 'object',
            properties: { productoId: { type: 'number' }, varianteId: { type: 'number' } },
            required: ['productoId', 'varianteId']
        }
    },
    {
        name: 'desarchivar_variante',
        description: 'Desarchiva una variante — vuelve a disponible si tiene stock, o a sin_stock si no tiene',
        parameters: {
            type: 'object',
            properties: { productoId: { type: 'number' }, varianteId: { type: 'number' } },
            required: ['productoId', 'varianteId']
        }
    },
    {
        name: 'agregar_imagen_variante',
        description: 'Sube o reemplaza la imagen de una variante YA EXISTENTE (no la crea). Usa imagenIndex para indicar cuál imagen adjunta corresponde.',
        parameters: {
            type: 'object',
            properties: {
                productoId: { type: 'number' },
                varianteId: { type: 'number' },
                imagenIndex: { type: 'number' }
            },
            required: ['productoId', 'varianteId', 'imagenIndex']
        }
    }
    
];

// ========================================================= HELPERS INTERNOS

function base64ToBlob ( base64DataUri: string ): Blob {
    const [ header, base64Data ] = base64DataUri.split(',');
    const mimeMatch = header.match(/data:(.*);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    return new Blob([buffer], { type: mimeType });
}

// Mismo criterio que ya usa el frontend al desarchivar un producto
function resolveProductUnarchiveState ( productoId: number ): string {
    const producto = findById(productoId);
    if ( !producto ) return 'disponible';
    return producto.variantes.some( v => v.stock > 0 ) ? 'disponible' : 'agotado';
}

// Mismo criterio que ya usa el frontend al desarchivar una variante
function resolveVariantUnarchiveState ( productoId: number, varianteId: number ): string {
    const producto = findById(productoId);
    const variante = producto?.variantes.find( v => v.id === varianteId );
    return variante && variante.stock > 0 ? 'disponible' : 'sin_stock';
}

// ========================================================= EJECUCIÓN

export async function executeTool (
    name: string,
    args: Record<string, any>,
    images: string[] = []
): Promise<any> {
    const baseUrl = `http://localhost:${process.env.PORT ?? 3002}`;

    switch (name) {

        // --------------------------------------------------- LECTURA

        case 'consultar_productos': {
            let resultados = findAll();

            if ( args.nombre )  {
                const query = args.nombre.toLowerCase();

                resultados = resultados.filter( p => 
                    p.nombre.toLowerCase().includes(query) 
                );
            }
            if ( args.categoria ) {
                const query = args.categoria.toLowerCase();

                resultados = resultados.filter( p => 
                    p.categoria.toLowerCase().includes(query) 
                );
            }

            if ( args.marca ) {
                const query = args.marca.toLowerCase();

                resultados = resultados.filter( p => 
                    p.marca?.toLowerCase().includes(query) 
                );
            }
            
            if ( args.etiqueta ) {
                const query = args.etiqueta.toLowerCase();
                
                resultados = resultados.filter( p => 
                    p.etiquetas?.some( e => e.toLowerCase().includes(query) ) 
                );
            }
            
            if ( args.estado ) {
                resultados = resultados.filter( p => 
                    p.estado === args.estado 
                );
            }

            return resultados;
        }

        case 'consultar_stock_bajo':
            return findAll()
                .map( producto => ({ producto: producto.nombre, variantesBajas: getVariantesBajas(producto, args.umbral) }) )
                .filter( item => item.variantesBajas.length > 0 );

        case 'consultar_stock_agotado':
            return findAll()
                .map( producto => ({ producto: producto.nombre, variantesAgotadas: getVariantesAgotadas(producto) }) )
                .filter( item => item.variantesAgotadas.length > 0 );

        case 'consultar_precio_final': {
            const producto = findById(args.productoId);
            if ( !producto ) throw new Error('Producto no encontrado');
            return { precioFinal: getPrecioFinal(producto, args.varianteId) };
        }

        // --------------------------------------------------- CREAR

        case 'crear_producto': {
            const res = await fetch(`${baseUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args)
            });
            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al crear el producto');
            return data;
        }

        case 'crear_producto_con_imagenes': {
            const { imagenIndexes, ...data } = args;

            const createRes = await fetch(`${baseUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const createData = await createRes.json();
            if ( !createRes.ok ) throw new Error(createData.error ?? 'Error al crear el producto');

            const validIndexes = (imagenIndexes as number[]).filter( i => images[i] !== undefined );

            if ( validIndexes.length > 0 ) {
                const formData = new FormData();
                validIndexes.forEach( ( idx, n ) => {
                    formData.append('imagenes', base64ToBlob(images[idx]), `producto-${n}.jpg`);
                });

                const uploadRes = await fetch(`${baseUrl}/products/${createData.id}/imagenes`, {
                    method: 'POST', body: formData
                });

                if ( uploadRes.ok ) return await uploadRes.json();
                return { ...createData, advertencia: 'El producto se creó, pero no se pudieron subir las imágenes.' };
            }

            return createData;
        }

        case 'crear_variante': {
            const { productoId, ...data } = args;
            const res = await fetch(`${baseUrl}/products/${productoId}/variantes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const responseData = await res.json();
            if ( !res.ok ) throw new Error(responseData.error ?? 'Error al crear la variante');
            return responseData;
        }

        case 'crear_variante_con_imagen': {
            const { productoId, imagenIndex, ...data } = args;

            const createRes = await fetch(`${baseUrl}/products/${productoId}/variantes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const createData = await createRes.json();
            if ( !createRes.ok ) throw new Error(createData.error ?? 'Error al crear la variante');

            const base64Image = images[imagenIndex];
            if ( base64Image ) {
                const varianteRecienCreada = createData.variantes[createData.variantes.length - 1];

                const formData = new FormData();
                formData.append('imagen', base64ToBlob(base64Image), 'variante.jpg');

                const uploadRes = await fetch(
                    `${baseUrl}/products/${productoId}/variantes/${varianteRecienCreada.id}/imagen`,
                    { method: 'POST', body: formData }
                );

                if ( uploadRes.ok ) return await uploadRes.json();
                return { ...createData, advertencia: 'La variante se creó, pero no se pudo subir la imagen.' };
            }

            return createData;
        }

        // --------------------------------------------------- ACTUALIZAR

        case 'actualizar_producto': {
            const { productoId, ...data } = args;
            const res = await fetch(`${baseUrl}/products/${productoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const responseData = await res.json();
            if ( !res.ok ) throw new Error(responseData.error ?? 'Error al actualizar el producto');
            return responseData;
        }

        case 'archivar_producto': {
            const res = await fetch(`${baseUrl}/products/${args.productoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'descontinuado' })
            });
            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al archivar el producto');
            return data;
        }

        case 'desarchivar_producto': {
            const nuevoEstado = resolveProductUnarchiveState(args.productoId);
            const res = await fetch(`${baseUrl}/products/${args.productoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al desarchivar el producto');
            return data;
        }

        case 'agregar_imagenes_producto': {
            const { productoId, imagenIndexes } = args;

            const validIndexes = (imagenIndexes as number[]).filter( i => images[i] !== undefined );
            if ( validIndexes.length === 0 ) throw new Error('No se encontraron imágenes válidas para agregar');

            const formData = new FormData();
            validIndexes.forEach( ( idx, n ) => {
                formData.append('imagenes', base64ToBlob(images[idx]), `producto-${n}.jpg`);
            });

            const res = await fetch(`${baseUrl}/products/${productoId}/imagenes`, {
                method: 'POST', body: formData
            });

            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al subir las imágenes');
            return data;
        }

        case 'actualizar_variante': {
            const { productoId, varianteId, ...data } = args;
            const res = await fetch(`${baseUrl}/products/${productoId}/variantes/${varianteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const responseData = await res.json();
            if ( !res.ok ) throw new Error(responseData.error ?? 'Error al actualizar la variante');
            return responseData;
        }

        case 'archivar_variante': {
            const res = await fetch(`${baseUrl}/products/${args.productoId}/variantes/${args.varianteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'descontinuado' })
            });
            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al archivar la variante');
            return data;
        }

        case 'desarchivar_variante': {
            const nuevoEstado = resolveVariantUnarchiveState(args.productoId, args.varianteId);
            const res = await fetch(`${baseUrl}/products/${args.productoId}/variantes/${args.varianteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al desarchivar la variante');
            return data;
        }

        case 'agregar_imagen_variante': {
            const { productoId, varianteId, imagenIndex } = args;

            const base64Image = images[imagenIndex];
            if ( !base64Image ) throw new Error('No se encontró la imagen indicada');

            const formData = new FormData();
            formData.append('imagen', base64ToBlob(base64Image), 'variante.jpg');

            const res = await fetch(`${baseUrl}/products/${productoId}/variantes/${varianteId}/imagen`, {
                method: 'POST', body: formData
            });

            const data = await res.json();
            if ( !res.ok ) throw new Error(data.error ?? 'Error al subir la imagen de la variante');
            return data;
        }

        default:
            throw new Error(`Tool desconocida: ${name}`);
    }
}