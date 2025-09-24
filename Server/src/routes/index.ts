import { Router } from 'express';
import futuresRouter from './futures';
import stockRouter from './stock';

const router = Router();

// Mount sub-routers under their paths: /futures, /stock
router.use('/futures', futuresRouter);
router.use('/stock', stockRouter);

export default router;
