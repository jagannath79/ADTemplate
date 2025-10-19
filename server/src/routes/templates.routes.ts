import { Router } from 'express';

import {
  createTemplateHandler,
  deleteTemplateHandler,
  listTemplates,
  updateTemplateHandler
} from '../controllers/template.controller.js';

const router = Router();

router.get('/', listTemplates);
router.post('/', createTemplateHandler);
router.put('/:id', updateTemplateHandler);
router.delete('/:id', deleteTemplateHandler);

export default router;
