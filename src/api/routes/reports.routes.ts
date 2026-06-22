import { Router } from "express";

// Controlador
import { 
    getFullReport, 
    getLowStockReport, 
    getReportByCategoria, 
    getReportByEstado 
} from "../controllers/reports.controller";

const router = Router();

router.get('/', getFullReport);
router.get('/stock-bajo', getLowStockReport);
router.get('/categoria/:categoria', getReportByCategoria);
router.get('/estado/:estado', getReportByEstado);

export default router;