import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Borra el archivo fisico del disco - silencioso sino existe o hay error
export const deleteFileFromDisk = ( imageUrl: string ): void => {
    try {
        const filename = imageUrl.split('/uploads/')[1];
        if (!filename) return;

        const filepath = path.join(UPLOADS_DIR, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch ( error ) {
        console.error('Error al eliminar archivo del disco:', error);
    }
}