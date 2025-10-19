// server/src/repositories/template.repository.ts
import sql from 'mssql';

import { getPool } from '../config/database.js';
import { Template, TemplateInput } from '../models/template.js';

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

export const getTemplates = async (): Promise<Template[]> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT ${SELECT_COLUMNS} FROM ${TABLE} ORDER BY ID DESC`);
  return result.recordset.map(mapRow);
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
