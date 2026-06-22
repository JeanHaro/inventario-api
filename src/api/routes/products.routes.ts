import { Router } from "express";

// Middlewars
import { upload, uploadMultiple } from "../middlewares/upload.middleware";

// Controlador
import { 
    addProductVariante,
    createProduct, 
    updateProduct,
    updateProductVariante,
    deleteProduct, 
    deleteProductVariante, 
    getAllProducts, 
    getProductById, 
    getProductPrice, 
    getVariantesAgotadasByProducto, 
    getVariantesBajasByProducto,
    uploadProductImage,
    uploadVarianteImage,
    deleteProductImage,
    deleteVarianteImage, 
} from "../controllers/products.controller";


const router = Router();

// PRODUCTOS:
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/:id/precio', getProductPrice);
router.get('/:id/variantes_agotadas', getVariantesAgotadasByProducto);
router.get('/:id/variantes_bajas', getVariantesBajasByProducto);

router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// VARIANTES
router.post('/:id/variantes', upload.single('imagen'), addProductVariante);
router.patch('/:id/variantes/:varianteId', updateProductVariante);
router.delete('/:id/variantes/:varianteId', deleteProductVariante);

// IMAGENES
router.post(
    '/:id/imagenes', 
    uploadMultiple, 
    uploadProductImage
);
router.delete('/:id/imagenes', deleteProductImage);

router.post(
    '/:id/variantes/:varianteId/imagen', 
    upload.single('imagen'), 
    uploadVarianteImage
);
router.delete('/:id/variantes/:varianteId/imagen', deleteVarianteImage);

export default router;