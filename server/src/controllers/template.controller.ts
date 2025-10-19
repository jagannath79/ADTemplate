import { Request, Response } from 'express';

import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate
} from '../repositories/template.repository.js';
import { TemplateInput } from '../models/template.js';

const REQUIRED_FIELDS = [
  'region',
  'country',
  'jobFamily',
  'locationName',
  'locationId',
  'company',
  'costCenterDivision',
  'templateId',
  'templateObjectGuid',
  'movePath'
] as const;

type TemplateBody = Record<string, unknown>;

const validateTemplateBody = (body: TemplateBody): string | null => {
  const missingField = REQUIRED_FIELDS.find((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
  return missingField ? `Field "${missingField}" is required.` : null;
};

const parseTemplateInput = (body: TemplateBody): TemplateInput => ({
  region: String(body.region ?? ''),
  country: String(body.country ?? ''),
  jobFamily: String(body.jobFamily ?? ''),
  locationName: String(body.locationName ?? ''),
  locationId: String(body.locationId ?? ''),
  company: String(body.company ?? ''),
  costCenterDivision: String(body.costCenterDivision ?? ''),
  templateId: String(body.templateId ?? ''),
  templateObjectGuid: String(body.templateObjectGuid ?? ''),
  movePath: String(body.movePath ?? '')
});

export const listTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await getTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch templates.', error: (error as Error).message });
  }
};

export const createTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const validationError = validateTemplateBody(req.body ?? {});
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const template = await createTemplate(parseTemplateInput(req.body ?? {}));
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create template.', error: (error as Error).message });
  }
};

export const updateTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: 'Invalid template id.' });
    return;
  }

  const validationError = validateTemplateBody(req.body ?? {});
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const updated = await updateTemplate(id, parseTemplateInput(req.body ?? {}));
    if (!updated) {
      res.status(404).json({ message: 'Template not found.' });
      return;
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update template.', error: (error as Error).message });
  }
};

export const deleteTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: 'Invalid template id.' });
    return;
  }

  try {
    const deleted = await deleteTemplate(id);
    if (!deleted) {
      res.status(404).json({ message: 'Template not found.' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete template.', error: (error as Error).message });
  }
};
