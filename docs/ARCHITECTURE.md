# Architecture

## Runtime

The MCP server is a local Node.js process speaking MCP over **stdio**.

```text
MCP Host
   │
   │ stdio / JSON-RPC
   ▼
google-apps-script-mcp
   │
   │ Google user OAuth 2.0
   ▼
Apps Script REST API
```

No inbound network MCP server is opened in the MVP.

## Modules

```text
src/
├── index.ts           stdio entrypoint
├── server.ts          MCP tools and safety guards
├── config.ts          local paths/scopes
├── auth.ts            Google Desktop OAuth + token cache
├── auth-cli.ts        one-time interactive authorization
├── apps-script.ts     official Apps Script API wrapper
└── project-files.ts   local Apps Script directory conversion
```

## OAuth

The server uses a Google OAuth **Desktop app** client.

Credential locations default to:

```text
~/.config/google-apps-script-mcp/oauth-client.json
~/.config/google-apps-script-mcp/token.json
```

The OAuth token never needs to be given to the MCP model.

## Safety boundaries

### Project content replacement

Google Apps Script `projects.updateContent` replaces the project's full source-file set.

Therefore:

```text
projects_update_content
projects_push_directory
```

perform a read/preview first and write only when `confirm_replace=true`.

### Deployment deletion

`deployments_delete` reads the deployment first and requires `confirm_delete=true`.

### Script Properties

Apps Script project-management REST endpoints do not expose `PropertiesService.getScriptProperties()` as direct CRUD operations.

A future Script Properties feature should use an explicit project-side management function or another carefully scoped mechanism. It should not silently inject temporary source into arbitrary projects.

### Remote execution

`scripts.run()` is intentionally excluded from the MVP. It requires an API executable deployment and Google Cloud project configuration that should be explicit rather than hidden inside project-management operations.
