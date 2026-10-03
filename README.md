# Google Apps Script MCP

A local **Model Context Protocol (MCP)** server for managing Google Apps Script projects through Google's official Apps Script REST API.

The first goal is simple: let an MCP-capable assistant create, inspect, push, version, and deploy Apps Script projects without relying on browser automation.

## Current MVP

The server exposes these tools:

| Tool | Purpose |
| --- | --- |
| `auth_status` | Check local OAuth setup without exposing tokens |
| `projects_create` | Create a standalone or bound Apps Script project |
| `projects_get` | Read project metadata |
| `projects_get_content` | Read project file metadata or source |
| `projects_update_content` | Replace the complete project file set with explicit confirmation |
| `projects_push_directory` | Push a local flat Apps Script source directory |
| `versions_create` | Create an immutable Apps Script version |
| `versions_list` | List versions |
| `deployments_create` | Create a deployment from a version |
| `deployments_list` | List deployments |
| `deployments_get` | Read one deployment |
| `deployments_update` | Move a deployment to another version |
| `deployments_delete` | Delete a deployment with explicit confirmation |

## Why this exists

For Apps Script projects managed in Git, the normal workflow often looks like:

```text
Git repository
  ↓
clasp / manual Apps Script setup
  ↓
Apps Script project
  ↓
version
  ↓
deployment
```

This MCP server gives an AI assistant a controlled API surface for that workflow:

```text
MCP host
  ↓ stdio
google-apps-script-mcp
  ↓ OAuth 2.0
Google Apps Script API
```

`clasp` is still useful as a developer fallback. This project does not try to replace it everywhere.

## Requirements

- Node.js 20+
- A Google account
- A Google Cloud project with the **Google Apps Script API** enabled
- A **Desktop app OAuth client**
- Apps Script API access enabled for your Google account

> Google Apps Script API user operations are authenticated with user OAuth. This project intentionally does not use service-account credentials.

## Quick start

Clone the repository and install dependencies:

```bash
git clone https://github.com/gilmour59/google-apps-script-mcp.git
cd google-apps-script-mcp
npm install
```

Create a Google Cloud **Desktop app** OAuth client and save the downloaded JSON as:

```text
~/.config/google-apps-script-mcp/oauth-client.json
```

Then authorize once:

```bash
npm run auth
```

Build:

```bash
npm run build
```

Run directly over stdio:

```bash
npm start
```

The MCP process writes protocol messages to stdout. Diagnostic messages are written to stderr.

See [docs/SETUP.md](docs/SETUP.md) for the full Google Cloud/OAuth walkthrough.

## MCP host configuration

After building, configure your MCP host to launch the compiled server.

Example:

```json
{
  "mcpServers": {
    "google-apps-script": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/google-apps-script-mcp/dist/index.js"
      ]
    }
  }
}
```

Optional environment overrides:

```json
{
  "env": {
    "GOOGLE_OAUTH_CLIENT_FILE": "/absolute/path/oauth-client.json",
    "GOOGLE_OAUTH_TOKEN_FILE": "/absolute/path/token.json"
  }
}
```

## Pushing a local Apps Script project

`projects_push_directory` understands a flat directory containing:

- `*.gs` → `SERVER_JS`
- `*.js` → `SERVER_JS`
- `*.html` → `HTML`
- `appsscript.json` → required `JSON` manifest

Example directory:

```text
src/
├── Code.gs
├── FarmerService.gs
├── Index.html
├── Styles.html
└── appsscript.json
```

The Apps Script API's content update operation replaces the **entire** remote project file set. For that reason, `projects_update_content` and `projects_push_directory` default to preview mode and require:

```text
confirm_replace = true
```

before writing.

## Security model

- OAuth refresh tokens stay on the local machine.
- OAuth JSON and token files are ignored by Git.
- `auth_status` reports paths/status only; it never returns credential contents.
- Destructive content replacement requires an explicit confirmation flag.
- Deployment deletion requires an explicit confirmation flag.
- The server uses stdio by default, so it does not open a network MCP endpoint.

Treat the local token file like a password. Restrict access to your user account.

## Not in the MVP yet

The following are intentionally deferred:

- remote `scripts.run()` execution;
- Apps Script `PropertiesService` helpers;
- process/execution-log tooling;
- automatic Git repository synchronization;
- hosted Streamable HTTP transport;
- multi-user OAuth/session management.

Remote function execution needs an Apps Script **API executable deployment** and additional Google Cloud configuration. Script Properties are not directly exposed by the Apps Script project-management REST API, so they need a separate design.

See [docs/TODO.md](docs/TODO.md) for the ordered development queue and [docs/ROADMAP.md](docs/ROADMAP.md) for the longer-term architecture plan.

## Development

Type check:

```bash
npm run check
```

Run from TypeScript during development:

```bash
npm run dev
```

Authenticate:

```bash
npm run auth
```

## License

MIT
