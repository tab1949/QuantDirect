import { Router } from 'express';
import * as controller from '../controllers/futuresController';

const router = Router();

router.get('/contract/list/:symbol', controller.list);
router.get('/contract/info/:symbol', controller.getInfoBySymbol);
router.get('/contract/assets/:exchange', controller.getAssets);

export default router;
