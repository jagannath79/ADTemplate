// server/src/repositories/template.repository.ts
import sql from 'mssql';

import { getPool } from '../config/database.js';
import { Template, TemplateInput } from '../models/template.js';

export interface TemplatePaginationOptions {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TemplatePaginationResult {
  data: Template[];
  total: number;
}

/**
 * Allow overriding the table via env (e.g., DB_TEMPLATES_TABLE=hr.ADWDTemplates).
 * Defaults to dbo.ADWDTemplates.
 */
const RAW_TABLE = process.env.DB_TEMPLATES_TABLE ?? 'dbo.ADWDTemplates';

/** Bracket-quote [schema].[table] safely */
function normalize(ident: string): string {
  const parts = ident.split('.');
  if (parts.length === 2) {
    const [schema, table] = parts;
    return `[${schema}].[${table}]`;
  }
  // No schema provided -> assume dbo
  return `[dbo].[${ident}]`;
}

const TABLE = normalize(RAW_TABLE);

/** Map a single row from SQL to our Template model */
function mapRow(row: any): Template {
  return {
    id: row.ID,
    region: row.Region,
    country: row.Country,
    jobFamily: row.JobFamily,
    locationName: row.LocationName,
    locationId: row.LocationID,
    company: row.Company,
    costCenterDivision: row.CostCenterDivision,
    templateId: row.TemplateID,
    templateObjectGuid: row.TemplateObjectGUID,
    movePath: row.MovePath
  };
}

/** Common SELECT projection (explicit columns; avoid SELECT *) */
const SELECT_COLUMNS = `
  ID,
  Region,
  Country,
  JobFamily,
  LocationName,
  LocationID,
  Company,
  CostCenterDivision,
  TemplateID,
  TemplateObjectGUID,
  MovePath
`;

const SEARCHABLE_COLUMNS = [
  'Region',
  'Country',
  'JobFamily',
  'LocationName',
  'LocationID',
  'Company',
  'CostCenterDivision',
  'TemplateID',
  'TemplateObjectGUID',
  'MovePath'
];

const SORTABLE_COLUMNS: Record<string, string> = {
  id: 'ID',
  region: 'Region',
  country: 'Country',
  jobfamily: 'JobFamily',
  locationname: 'LocationName',
  locationid: 'LocationID',
  company: 'Company',
  costcenterdivision: 'CostCenterDivision',
  templateid: 'TemplateID',
  templateobjectguid: 'TemplateObjectGUID',
  movepath: 'MovePath'
};

const LIKE_SPECIAL_CHARS = /[%_\[\]]/g;

const escapeForLike = (value: string): string => value.replace(LIKE_SPECIAL_CHARS, (match) => `[${match}]`);

const buildWhereClause = (search?: string): { clause: string; searchParam?: string } => {
  if (!search) {
    return { clause: '' };
  }

  const normalized = search.trim();
  if (!normalized) {
    return { clause: '' };
  }

  const likeExpressions = SEARCHABLE_COLUMNS.map((column) => `${column} LIKE @SearchTerm`);
  return {
    clause: `WHERE ${likeExpressions.join(' OR ')}`,
    searchParam: `%${escapeForLike(normalized)}%`
  };
};

const resolveSortColumn = (field?: string): string => {
  if (!field) {
    return 'ID';
  }

  const normalized = field.toLowerCase();
  return SORTABLE_COLUMNS[normalized] ?? 'ID';
};

const resolveSortDirection = (direction?: string): 'ASC' | 'DESC' => {
  if (!direction) {
    return 'DESC';
  }

  return direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
};

export const getTemplatesPaginated = async (
  options: TemplatePaginationOptions
): Promise<TemplatePaginationResult> => {
  const pool = await getPool();
  const page = Math.max(1, Number.isFinite(options.page) ? Math.trunc(options.page) : 1);
  const pageSize = Math.max(1, Math.min(200, Math.trunc(options.pageSize) || 50));
  const offset = (page - 1) * pageSize;
  const where = buildWhereClause(options.search);
  const sortColumn = resolveSortColumn(options.sortField);
  const sortDirection = resolveSortDirection(options.sortDirection);

  const countRequest = pool.request();
  if (where.searchParam) {
    countRequest.input('SearchTerm', sql.NVarChar(sql.MAX), where.searchParam);
  }
  const countResult = await countRequest.query(`SELECT COUNT(1) AS Total FROM ${TABLE} ${where.clause}`);
  const total = countResult.recordset[0]?.Total ?? 0;

  const dataRequest = pool.request();
  dataRequest.input('Offset', sql.Int, offset);
  dataRequest.input('PageSize', sql.Int, pageSize);
  if (where.searchParam) {
    dataRequest.input('SearchTerm', sql.NVarChar(sql.MAX), where.searchParam);
  }

  const dataResult = await dataRequest.query(
    `
    SELECT ${SELECT_COLUMNS}
    FROM ${TABLE}
    ${where.clause}
    ORDER BY ${sortColumn} ${sortDirection}
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    `
  );

  return {
    data: dataResult.recordset.map(mapRow),
    total
  };
};

export const createTemplate = async (input: TemplateInput): Promise<Template> => {
  const pool = await getPool();
  const request = pool.request();

  request.input('Region', sql.NVarChar(255), input.region);
  request.input('Country', sql.NVarChar(255), input.country);
  request.input('JobFamily', sql.NVarChar(255), input.jobFamily);
  request.input('LocationName', sql.NVarChar(255), input.locationName);
  request.input('LocationID', sql.NVarChar(255), input.locationId);
  request.input('Company', sql.NVarChar(255), input.company);
  request.input('CostCenterDivision', sql.NVarChar(255), input.costCenterDivision);
  request.input('TemplateID', sql.NVarChar(255), input.templateId);
  request.input('TemplateObjectGUID', sql.NVarChar(255), input.templateObjectGuid);
  request.input('MovePath', sql.NVarChar(sql.MAX), input.movePath);

  const result = await request.query(
    `
    INSERT INTO ${TABLE}
      (Region, Country, JobFamily, LocationName, LocationID, Company, CostCenterDivision, TemplateID, TemplateObjectGUID, MovePath)
    OUTPUT
      inserted.ID,
      inserted.Region,
      inserted.Country,
      inserted.JobFamily,
      inserted.LocationName,
      inserted.LocationID,
      inserted.Company,
      inserted.CostCenterDivision,
      inserted.TemplateID,
      inserted.TemplateObjectGUID,
      inserted.MovePath
    VALUES
      (@Region, @Country, @JobFamily, @LocationName, @LocationID, @Company, @CostCenterDivision, @TemplateID, @TemplateObjectGUID, @MovePath)
    `
  );

  return mapRow(result.recordset[0]);
};

export const updateTemplate = async (id: number, input: TemplateInput): Promise<Template | null> => {
  const pool = await getPool();
  const request = pool.request();

  request.input('Id', sql.Int, id);
  request.input('Region', sql.NVarChar(255), input.region);
  request.input('Country', sql.NVarChar(255), input.country);
  request.input('JobFamily', sql.NVarChar(255), input.jobFamily);
  request.input('LocationName', sql.NVarChar(255), input.locationName);
  request.input('LocationID', sql.NVarChar(255), input.locationId);
  request.input('Company', sql.NVarChar(255), input.company);
  request.input('CostCenterDivision', sql.NVarChar(255), input.costCenterDivision);
  request.input('TemplateID', sql.NVarChar(255), input.templateId);
  request.input('TemplateObjectGUID', sql.NVarChar(255), input.templateObjectGuid);
  request.input('MovePath', sql.NVarChar(sql.MAX), input.movePath);

  const result = await request.query(
    `
    UPDATE ${TABLE}
    SET
      Region = @Region,
      Country = @Country,
      JobFamily = @JobFamily,
      LocationName = @LocationName,
      LocationID = @LocationID,
      Company = @Company,
      CostCenterDivision = @CostCenterDivision,
      TemplateID = @TemplateID,
      TemplateObjectGUID = @TemplateObjectGUID,
      MovePath = @MovePath
    OUTPUT
      inserted.ID,
      inserted.Region,
      inserted.Country,
      inserted.JobFamily,
      inserted.LocationName,
      inserted.LocationID,
      inserted.Company,
      inserted.CostCenterDivision,
      inserted.TemplateID,
      inserted.TemplateObjectGUID,
      inserted.MovePath
    WHERE ID = @Id
    `
  );

  const row = result.recordset[0];
  return row ? mapRow(row) : null;
};

export const deleteTemplate = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`DELETE FROM ${TABLE} WHERE ID = @Id`);

  return (result.rowsAffected?.[0] ?? 0) > 0;
};
