# AD Template Dashboard

Enterprise-ready Active Directory template management platform featuring a modern Angular front-end and a secure Express API backed by Microsoft SQL Server.

## Project structure

```
frontend/   # Angular 17 application with Angular Material UI
server/     # Express + TypeScript API connected to MS SQL Server
```

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+
- SQL Server instance with the `AutomationDB` database and a `Templates` table containing the columns (update connection credentials in `server/.env`).
```sql
CREATE TABLE dbo.Templates (
  ID INT IDENTITY(1,1) PRIMARY KEY,
  Region NVARCHAR(255) NOT NULL,
  Country NVARCHAR(255) NOT NULL,
  JobFamily NVARCHAR(255) NOT NULL,
  LocationName NVARCHAR(255) NOT NULL,
  LocationID NVARCHAR(255) NOT NULL,
  Company NVARCHAR(255) NOT NULL,
  CostCenterDivision NVARCHAR(255) NOT NULL,
  TemplateID NVARCHAR(255) NOT NULL,
  TemplateObjectGUID NVARCHAR(255) NOT NULL,
  MovePath NVARCHAR(MAX) NOT NULL
);
```

  - `ID` (INT, identity)
  - `Region`
  - `Country`
  - `JobFamily`
  - `LocationName`
  - `LocationID`
  - `Company`
  - `CostCenterDivision`
  - `TemplateID`
  - `TemplateObjectGUID`
  - `MovePath`

### Backend API

1. Copy the environment template and update credentials as needed:
   ```bash
   cd server
   cp .env.example .env
   ```
2. Install dependencies and start the API:
   ```bash
   npm install
   npm run dev
   ```

The API exposes REST endpoints at `http://localhost:3000/api/templates` for CRUD operations.

### Angular front-end

### Root helpers

Run `npm install` from the repository root to install both workspaces (`frontend` and `server`) at once. Afterwards you can run `npm start` from the root to launch both the API and Angular UI concurrently.

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run the development server:
   ```bash
   npm start
   ```

The Angular dev server proxies API requests to `http://localhost:3000` via `proxy.conf.json`.

## Testing

- Front-end unit tests: `npm test` within `frontend`
- Backend linting: `npm run lint` within `server`

## Production builds

- Front-end: `npm run build` (outputs to `frontend/dist`)
- Backend: `npm run build` (outputs to `server/dist`)

## Additional notes

- The Angular UI is built with Angular Material dark theme, responsive cards, and interactive dialogs for create/update workflows.
- Update `server/src/repositories/template.repository.ts` if your actual table name or schema differs from `Templates`.
