import { Request, Response } from "express";

// Tipos
import { 
    Categoria, 
    EstadoProducto, 
    EstadoVariante, 
    Variante
} from "../../types/product.types";

// Utils de Productos y Variantes
import { 
    addVariante,
    createProducto,
    deleteProducto,
    deleteVariante,
    findAll,
    findByCategoria, 
    findByEstado, 
    findByEtiqueta, 
    findById, 
    findByMarca,
    getPrecioFinal,
    searchByCategoria,
    searchByNombre,
    updateProducto,
    updateVariante,
    getVariantesAgotadas,
    getVariantesBajas
} from "../../utils/product.utils";

// Utils de Notificaciones
import { 
    triggerProductoActivado, 
    triggerProductoCreado, 
    triggerProductoDescontinuado, 
    triggerProductoEliminado, 
    triggerStockAgotado, 
    triggerStockBajo, 
    triggerStockRecibido, 
    triggerVarianteAgregada 
} from "../../utils/notification.utils";

// Utils de Archivo
import { deleteFileFromDisk } from '../../utils/file.utils';

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

const validEstadosVariante: EstadoVariante[] = [
    'disponible',
    'sin_stock',
    'reservado',
    'descontinuado'
];

// TODO: CONSULTAS

// GET /products
export const getAllProducts = ( req: Request, res: Response ): void => {
    const { categoria, estado, marca, etiqueta, searchNombre, searchCategoria } = req.query;

    if ( categoria ) {
        if ( !validCategorias.includes( categoria as Categoria ) ) {
            res.status(400).json({ 
                error: `Categoría inválida. Opciones: ${validCategorias.join(', ')}` 
            });

            return;
        }

        res.json( findByCategoria( categoria as Categoria ) );

        return;
    }

    if ( estado ) {
        if ( !validEstados.includes(estado as EstadoProducto) ) {
            res.status(400).json({ 
                error: `Estado inválido. Opciones: ${validEstados.join(', ')}` 
            });

            return;
        }

        res.json( findByEstado( estado as EstadoProducto ) );

        return;
    }

    if ( marca )    { 
        res.json( findByMarca( marca as string ) );
        
        return; 
    }

    if ( etiqueta ) { 
        res.json( findByEtiqueta( etiqueta as string ) ); 

        return; 
    }

    if ( searchNombre )   { 
        res.json( searchByNombre( searchNombre as string ) );   

        return; 
    }

    if ( searchCategoria )   { 
        res.json( searchByCategoria( searchCategoria as string ) );   

        return; 
    }

    res.json(findAll());
}

// GET /products/:id
export const getProductById = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    res.json(product);
}

// GET /products/:id/precio
export const getProductPrice = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const varianteId = req.query.varianteId ? Number(req.query.varianteId) : undefined;
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    res.json({
        producto: product.nombre,
        precioBase: product.precio,
        descuento: product.descuento ?? 0,
        precioFinal: getPrecioFinal(product, varianteId)
    });
}

// TODO: CRUD DE PRODUCTOS

// POST /products
export const createProduct = ( req: Request, res: Response ): void => {
    const { nombre, precio, categoria, estado, etiquetas } = req.body;

    if ( 
        !nombre || 
        !precio || 
        !categoria || 
        !estado 
    ) {
        res.status(400).json({ 
            error: 'Campos obligatorios: nombre, precio, categoria, estado' 
        });

        return;
    }

    if ( !validCategorias.includes(categoria) ) {
        res.status(400).json({ 
            error: `Categoría inválida. Opciones: ${validCategorias.join(', ')}` 
        });
        
        return;
    }

    if ( !validEstados.includes(estado) ) {
        res.status(400).json({ 
            error: `Estado inválido. Opciones: ${validEstados.join(', ')}` 
        });

        return;
    }

    if ( isNaN(Number(precio)) || Number(precio) <= 0 ) {
        res.status(400).json({ 
            error: 'El precio debe ser un número mayor a 0' 
        });

        return;
    }

    // Eliminamos etiquetas duplicadas que pueda enviar el usuario
    const eti = etiquetas && Array.isArray(etiquetas) 
                                    ? [...new Set(
                                        (etiquetas as string[])
                                            .map(etiqueta => etiqueta.trim())
                                            .filter(etiqueta => etiqueta.length > 0)
                                        )]
                                    : undefined;

    const newProduct = createProducto({
        ...req.body,
        precio: Number(precio),
        variantes: [],
        etiquetas
    });

    // TRIGGER: producto creado
    triggerProductoCreado(newProduct);

    res.status(201).json(newProduct);
}

// PATCH /products/:id
export const updateProduct = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const body = req.body;

    // Validar categoria y estado si vienen
    if ( body.categoria && !validCategorias.includes(body.categoria) ) {
        res.status(400).json({ 
            error: `Categoría inválida. Opciones: ${validCategorias.join(', ')}` 
        });

        return;
    }

    if ( body.estado && !validEstados.includes(body.estado) ) {
        res.status(400).json({ 
            error: `Estado inválido. Opciones: ${validEstados.join(', ')}` 
        });

        return;
    }

    // Guardamos el estado anterior para detectar cambios
    const productoAnterior = findById(id);

    if ( !productoAnterior ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    const allowedData = {
        ...(body.nombre      && { nombre: body.nombre }),
        ...(body.descripcion && { descripcion: body.descripcion }),
        ...(body.marca       && { marca: body.marca }),
        ...(body.modelo      && { modelo: body.modelo }),
        ...(body.precio      && { precio: Number(body.precio) }),
        ...(body.descuento !== undefined && { descuento: Number(body.descuento) }),
        ...(body.categoria   && { categoria: body.categoria }),
        ...(body.estado      && { estado: body.estado }),
        ...(body.etiquetas   && { etiquetas: body.etiquetas }),
        ...(body.imagenes    && { imagenes: body.imagenes }),
        ...(body.etiquetas && Array.isArray(body.etiquetas) && {
                etiquetas: [...new Set(
                    (body.etiquetas as string[])
                        .map(etiqueta => etiqueta.trim())
                        .filter(etiqueta => etiqueta.length > 0)
                )]
            }),
    };

    const updated = updateProducto(id, allowedData);
    
    if ( !updated ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    // TRIGGERS según cambio de estado
    if ( body.estado && body.estado !== productoAnterior.estado ) {
        if (body.estado === 'disponible') triggerProductoActivado(updated);
        if (body.estado === 'descontinuado') triggerProductoDescontinuado(updated);
    }

    res.json(updated);
}

// DELETE /products/:id
export const deleteProduct = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    deleteProducto(id);

    // TRIGGER: producto eliminado
    triggerProductoEliminado(product);

    res.json({ 
        message: `Producto "${product.nombre}" eliminado correctamente` 
    });
}

// TODO: CRUD DE VARIANTES

// GET /products/:id/variantes_agotadas
export const getVariantesAgotadasByProducto = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    const agotadas = getVariantesAgotadas(product);

    if ( agotadas.length === 0 ) {
        res.status(200).json({ 
            msg: `El producto ${id} no tiene variantes agotadas` 
        });

        return;
    }
    
    res.json(agotadas)
}

// GET /products/:id/variantes_bajas
export const getVariantesBajasByProducto = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const product = findById(id);
    const umbral = 10;

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    const bajas = getVariantesBajas(product, umbral);

    if ( bajas.length === 0 ) {
        res.status(200).json({ 
            msg: `El producto ${id} no tiene variantes con stock menor a ${umbral}` 
        });

        return;
    }
    
    res.json(bajas);
}

// POST /products/:id/variantes
export const addProductVariante = ( req: Request, res: Response ): void => {
    const productoId = Number(req.params.id);

    // Extraemos y convertimos del body
    const stockRaw = req.body.stock;
    const estado = req.body.estado;

    if (stockRaw === undefined || !estado) {
        res.status(400).json({
            error: 'Campos obligatorios en variante: stock, estado'
        });
        return;
    }

    if ( !validEstadosVariante.includes(estado) ) {
        res.status(400).json({ 
            error: `Estado de variante inválido. Opciones: ${validEstadosVariante.join(', ')}` 
        });
        return;
    }

    // Con multipart/form-data los campos llegan como string - convertimos los numéricos
    const stock = Number(stockRaw);

    const varianteData: Omit<Variante, 'id'> = {
        stock,
        estado: stock === 0 ? 'sin_stock' : estado as EstadoVariante, // Si crean una variante con stock 0, forzar estado sin_stock
        nombre: req.body.nombre,
        talla: req.body.talla,
        color: req.body.color,
        capacidad: req.body.capacidad,
        sku: req.body.sku,
        precioAdicional:req.body.precioAdicional ? Number(req.body.precioAdicional) : undefined,
        imagen: req.file ? `http://localhost:3002/uploads/${req.file.filename}` : undefined
    };

    const updated = addVariante(productoId, varianteData);
    if ( !updated ) {
        res.status(404).json({ 
            error: `Producto con id ${productoId} no encontrado` 
        });

        return;
    }

    const nuevaVariante = updated.variantes[updated.variantes.length - 1];

    // TRIGGER: variante agregada
    triggerVarianteAgregada(updated, nuevaVariante);

    // TRIGGER: si la nueva variante ya tiene stock bajo
    if ( nuevaVariante.stock > 0 && nuevaVariante.stock < 10 ) {
        triggerStockBajo(updated, [nuevaVariante], 10);
    }

    res.status(201).json(updated);
}

// PATCH /products/:id/variantes/:varianteId
export const updateProductVariante = ( req: Request, res: Response ): void => {
    const productoId = Number(req.params.id);
    const varianteId = Number(req.params.varianteId);
    const body = req.body;

    if ( body.estado && !validEstadosVariante.includes(body.estado) ) {
        res.status(400).json({ 
            error: `Estado de variante inválido. Opciones: ${validEstadosVariante.join(', ')}` 
        });

        return;
    }

    // Guardamos stock anterior para detectar cambios de dirección
    const productoAnterior = findById(productoId);
    if ( !productoAnterior ) {
        res.status(404).json({ 
            error: `Producto con id ${productoId} no encontrado` 
        });

        return;
    }

    const varianteAnterior = productoAnterior.variantes.find( 
        variant => variant.id === varianteId 
    );
    if ( !varianteAnterior ) {
        res.status(404).json({ 
            error: `Variante con id ${varianteId} no encontrada` 
        });

        return;
    }

    const allowedData = {
        ...(body.nombre          !== undefined && { nombre: body.nombre }),
        ...(body.talla           !== undefined && { talla: body.talla }),
        ...(body.color           !== undefined && { color: body.color }),
        ...(body.capacidad       !== undefined && { capacidad: body.capacidad }),
        ...(body.stock           !== undefined && { stock: Number(body.stock) }),
        ...(body.estado          !== undefined && { estado: body.estado }),
        ...(body.sku             !== undefined && { sku: body.sku }),
        ...(body.precioAdicional !== undefined && { precioAdicional: Number(body.precioAdicional) }),
        ...(body.imagen          !== undefined && { imagen: body.imagen }),
    };

    if ( body.stock !== undefined ) {
        const stockNuevo = Number(body.stock);

        // Si stock llega a 0 -> sin_stock automático
        if ( stockNuevo === 0 ) {
            allowedData.estado = 'sin_stock';
        }

        // Si stock sube desde 0 -> disponible automático ( Solo si no mandaron un estado explicito )
        if ( stockNuevo > 0 && varianteAnterior.stock === 0 && !body.estado ) {
            allowedData.estado = 'disponible'
        }
    }

    const updated = updateVariante(productoId, varianteId, allowedData);
    if ( !updated ) {
        res.status(404).json({ 
            error: 'Producto o variante no encontrado' 
        });

        return;
    }

    const varianteActualizada = updated.variantes.find( 
        variant => variant.id === varianteId
    )!;

    // Guardamos el producto final
    let productoFinal = updated;

    // TRIGGERS de stock — solo si el stock cambió
    if ( body.stock !== undefined ) {
        const stockAnterior = varianteAnterior.stock;
        const stockNuevo = varianteActualizada.stock;

        if ( stockNuevo === 0 ) {
            triggerStockAgotado(updated, [varianteActualizada]);
        } else if ( stockNuevo < 10 && stockNuevo < stockAnterior ) {
            triggerStockBajo(updated, [varianteActualizada], 10);
        } else if ( stockNuevo > stockAnterior ) {
            triggerStockRecibido(updated, varianteActualizada, stockAnterior);
        }

        // Sincronizar estado del PRODUCTO según stock total de variantes
        const todasAgotadas = updated.variantes.every(v => v.stock === 0);
        const estadoAnteriorProducto = productoAnterior.estado;

        if ( todasAgotadas && estadoAnteriorProducto === 'disponible' ) {
            productoFinal = updateProducto(productoId, { estado: 'agotado' }) ?? updated;
            
        } else if ( !todasAgotadas && estadoAnteriorProducto === 'agotado' ) {
            productoFinal = updateProducto(productoId, { estado: 'disponible' }) ?? updated;
        }
    }

    res.json(productoFinal);
}

// DELETE /products/:id/variantes/:varianteId
export const deleteProductVariante = ( req: Request, res: Response ): void => {
    const productoId = Number(req.params.id);
    const varianteId = Number(req.params.varianteId);
    const updated = deleteVariante(productoId, varianteId);

    if ( !updated ) {
        res.status(404).json({ 
            error: 'Producto o variante no encontrado' 
        });

        return;
    }

    res.json(updated);
}

// TODO: IMÁGENES

// POST /products/:id/imagenes
export const uploadProductImage = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${id} no encontrado` 
        });

        return;
    }

    // Imagenes
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        res.status(400).json({ 
            error: 'No se recibió ningún archivo' 
        });
        
        return;
    }

    const MAX_IMAGENES = 10;
    const imagenesActuales = product.imagenes?.length ?? 0;
    const espacioDisponible = MAX_IMAGENES - imagenesActuales;

    if ( espacioDisponible <= 0 ) {
        res.status(400).json({
            error: `El producto ya tiene el máximo de ${MAX_IMAGENES} imágenes`
        });
        return;
    }

    if ( files.length > espacioDisponible ) {
        res.status(400).json({
            error: `Solo puedes agregar ${espacioDisponible} imagen(es) más. El producto tiene ${imagenesActuales} de ${MAX_IMAGENES}`
        });
        return;
    }

    // Construir URLs de todas las imágenes subidas
    const imageUrls = files.map( file => `http://localhost:3002/uploads/${file.filename}`);

    // Agregar al array existente sin borrar las anteriores
    const imagenes = [...(product.imagenes ?? []), ...imageUrls];
    const updated  = updateProducto(id, { imagenes });

    res.status(201).json({
        message: `${files.length} imagen(es) subida(s) correctamente`,
        imagenesNuevas: imageUrls,
        producto: updated
    });
}

// POST /products/:id/variantes/:varianteId/imagen
export const uploadVarianteImage = ( req: Request, res: Response ): void => {
    const productoId = Number(req.params.id);
    const varianteId = Number(req.params.varianteId);
    const product = findById(productoId);

    if ( !product ) {
        res.status(404).json({ 
            error: `Producto con id ${productoId} no encontrado` 
        });

        return;
    }

    const variante = product.variantes.find( variant => variant.id === varianteId );

    if ( !variante ) {
        res.status(404).json({ 
            error: `Variante con id ${varianteId} no encontrada` 
        });

        return;
    }

    if ( !req.file ) {
        res.status(400).json({ 
            error: 'No se recibió ningún archivo' 
        });

        return;
    }

    // Si la variante ya tenía imagen borrar el archivo viejo del disco
    if (variante.imagen) {
        deleteFileFromDisk(variante.imagen);                
    }

    const imageUrl = `http://localhost:3002/uploads/${req.file.filename}`;
    const updated  = updateVariante(productoId, varianteId, { imagen: imageUrl });

    res.status(201).json({
        message: 'Imagen de variante subida correctamente',
        imageUrl,
        producto: updated
    });
}

// DELETE /products/:id/imagenes?url=...
export const deleteProductImage = ( req: Request, res: Response ): void => {
    const id = Number(req.params.id);
    const { url } = req.query;
    const product = findById(id);

    if ( !product ) {
        res.status(404).json({
            error: `Producto con id ${id} no encontrado`
        });
        return;
    }

    if ( !url || typeof url !== 'string' ) {
        res.status(400).json({
            error: 'Query params requerido: url'
        });
        return;
    }

    const imagenesActuales = product.imagenes ?? [];

    if ( !imagenesActuales.includes(url) ) {
        res.status(404).json({
            error: 'La imagen no existe en este producto'
        });
        return;
    }

    // Borrar el archivo del disco
    deleteFileFromDisk(url);           

    // Filtrar fuera la imagen a eliminar
    const imagenes = imagenesActuales.filter( img => img !== url);
    const updated = updateProducto(id, { imagenes });

    res.json({
        message: 'Imagen eliminada del producto',
        producto: updated
    });
}

// DELETE /products/:id/variantes/:varianteId/imagen
export const deleteVarianteImage = ( req: Request, res: Response ): void => {
    const productoId = Number(req.params.id);
    const varianteId = Number(req.params.varianteId);
    const product = findById(productoId);

    if ( !product ) {
        res.status(404).json({
            error: `Producto con id ${productoId} no encontrado`
        });
        return;
    }

    const variante = product.variantes.find( variante => variante.id === varianteId );

    if ( !variante ) {
        res.status(404).json({
            error: `Variante con id ${varianteId} no encontrada`
        });
        return;
    }

    if ( !variante.imagen ) {
        res.status(404).json({
            error: 'Esta variante no tiene imagen'
        });
        return;
    }

    // Borrar el archivo del disco
    deleteFileFromDisk(variante.imagen); 

    const updated = updateVariante(productoId, varianteId, { imagen: undefined });

    res.json({
        message: 'Imagen de variante eliminada',
        producto: updated
    });
}