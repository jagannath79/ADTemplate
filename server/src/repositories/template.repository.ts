import sql from 'mssql';

import { getPool } from '../config/database';
import { Template, TemplateInput } from '../models/template';

const mapRecord = (record: sql.IResult<any>): Template[] =>
  record.recordset.map((row) => ({
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
  }));

const TABLE = 'Templates';

export const getTemplates = async (): Promise<Template[]> => {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT * FROM ${TABLE} ORDER BY ID DESC`);
  return mapRecord(result);
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
    `INSERT INTO ${TABLE} (Region, Country, JobFamily, LocationName, LocationID, Company, CostCenterDivision, TemplateID, TemplateObjectGUID, MovePath)
     OUTPUT inserted.*
     VALUES (@Region, @Country, @JobFamily, @LocationName, @LocationID, @Company, @CostCenterDivision, @TemplateID, @TemplateObjectGUID, @MovePath)`
  );

  return mapRecord(result)[0];
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
    `UPDATE ${TABLE}
     SET Region = @Region,
         Country = @Country,
         JobFamily = @JobFamily,
         LocationName = @LocationName,
         LocationID = @LocationID,
         Company = @Company,
         CostCenterDivision = @CostCenterDivision,
         TemplateID = @TemplateID,
         TemplateObjectGUID = @TemplateObjectGUID,
         MovePath = @MovePath
     OUTPUT inserted.*
     WHERE ID = @Id`
  );

  const [updated] = mapRecord(result);
  return updated ?? null;
};

export const deleteTemplate = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`DELETE FROM ${TABLE} WHERE ID = @Id`);

  return result.rowsAffected[0] > 0;
};
