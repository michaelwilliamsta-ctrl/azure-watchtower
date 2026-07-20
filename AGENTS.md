# Azure Watchtower Project Instructions

## Project Mission

Azure Watchtower reduces Azure cloud risk through Blast Radius Intelligence.

The platform should identify:

- Azure resources
- Security relationships between resources and identities
- Potential attack paths
- The impact and blast radius of a compromise

## Architecture

- .NET 10 ASP.NET Core API
- Next.js 16 frontend using React, TypeScript, and Tailwind CSS
- Microsoft Entra ID authentication using MSAL
- Azure Resource Manager and Azure Resource Graph for read-only discovery
- Keep all Azure access read-only unless a future task explicitly requires otherwise

## Repository Structure

- `src/AzureWatchtower.Api`
- `src/AzureWatchtower.Core`
- `src/AzureWatchtower.Inventory`
- `src/AzureWatchtower.Shared`
- `src/azure-watchtower-web`
- `AzureWatchtower.slnx`

## Development Rules

- Preserve existing working behavior.
- Keep TypeScript strict and strongly typed.
- Do not use `any`.
- Do not expose access tokens, client secrets, tenant secrets, or environment-variable contents.
- Never commit `.env.local`.
- Do not add a client secret to the frontend.
- Do not run destructive Azure commands.
- Do not create, update, or delete Azure resources unless explicitly requested.
- Do not commit or push unless explicitly requested.
- Do not change branches unless explicitly requested.
- Avoid unnecessary dependencies.
- Prefer small, reviewable changes.
- Explain architecture or security tradeoffs when relevant.

## Frontend Validation

From `src/azure-watchtower-web`, run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Use `npm.cmd` on Windows because PowerShell may block `npm.ps1`.

## .NET Validation

From the repository root, run:

```powershell
dotnet build AzureWatchtower.slnx
```

Run the .NET solution build when .NET files are affected.

## Git Validation

After making changes:

```powershell
git status --short
```

- Report all modified files.
- Do not commit automatically.

## Definition of Done

- The requested feature is implemented.
- Existing authentication still works.
- Existing subscription discovery still works.
- Existing inventory scanning still works.
- Frontend lint passes.
- The frontend production build passes.
- The .NET solution build passes when .NET files are affected.
- No secrets or local environment files are included.
