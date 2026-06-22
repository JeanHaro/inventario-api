import multer from "multer";
import path from "path";
import fs from 'fs';

// Carga donde se guardan las imagenes
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Crear la carpeta si no existe
if ( !fs.existsSync(UPLOADS_DIR) ) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuraciónn de destino y nombre de archivo
const storage = multer.diskStorage({
    destination: ( req, file, cb ) => {
        cb(null, UPLOADS_DIR);
    },

    filename: ( req, file, cb ) => {
        // Formato: timestamp-nombreoriginal.ext
        // Ejemplo: 1715200000000-xiaomi14.jog
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
                            .replace(/\s+/g, '-')
                            .toLowerCase();
        
        cb(null, `${Date.now()}-${baseName}${ext}`);
    }
});

// Filtro - solo imágenes
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const validTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    if ( validTypes.includes(file.mimetype) ) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo inválido. Solo se aceptan: jpg, png, webp, gif'));
    }
}

// Múltiples imágenes — máximo 5 por request
export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).array('imagenes', 5);

// Limite de 5MB por imagen
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});