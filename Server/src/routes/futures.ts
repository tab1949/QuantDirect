import { Router } from 'express';
import * as controller from '../controllers/futuresController';

const router = Router();

router.get('/', controller.list);
router.get('/:symbol', controller.getBySymbol);

export default router;
