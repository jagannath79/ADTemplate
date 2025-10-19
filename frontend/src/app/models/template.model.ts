export interface Template {
  id: number;
  region: string;
  country: string;
  jobFamily: string;
  locationName: string;
  locationId: string;
  company: string;
  costCenterDivision: string;
  templateId: string;
  templateObjectGuid: string;
  movePath: string;
}

export type TemplateDraft = Omit<Template, 'id'>;

export interface TemplatePage {
  items: Template[];
  total: number;
  page: number;
  pageSize: number;
}
