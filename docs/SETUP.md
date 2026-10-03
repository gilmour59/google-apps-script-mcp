# Setup Guide

This guide configures the local MCP server with Google OAuth.

## 1. Create or choose a Google Cloud project

Open Google Cloud Console and create a project for this MCP integration, or choose an existing development project.

Keep this separate from production Apps Script projects when possible.

## 2. Enable the Google Apps Script API

In the Google Cloud project:

1. Open **APIs & Services**.
2. Open **Library**.
3. Search for **Google Apps Script API**.
4. Click **Enable**.

Also enable Apps Script API access for your Google account at:

```text
https://script.google.com/home/usersettings
```

Turn **Google Apps Script API** on.

This account-level switch is required before third-party applications can create or modify Apps Script projects through the API.

## 3. Configure Google Auth Platform

In the same Google Cloud project, open **Google Auth Platform**.

Configure these sections:

### Branding

Set an app name such as:

```text
Google Apps Script MCP
```

Add the required support/contact email addresses.

### Audience

For local development:

- use **Internal** only if the Google Cloud project belongs to a Google Workspace organization and the MCP will only be used by users in that organization;
- otherwise use **External** and keep the app in **Testing** while developing.

If the app is External and in Testing, add the Google account you will use with the MCP as a **test user**.

### Data Access

Add only the scopes required by the current MVP:

```text
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.deployments
```

These scopes cover Apps Script project content/version management and deployment management.

Do not add future scopes until their features are implemented. For example, Phase 2 process monitoring may require `script.processes`, and project metrics would require `script.metrics`.

## 4. Create a Desktop OAuth client

In **Google Auth Platform > Clients**, create a new OAuth client with application type:

```text
Desktop app
```

A name such as this is sufficient:

```text
Google Apps Script MCP Local
```

Download the generated JSON file.

Desktop OAuth clients support loopback redirects. The MCP opens a temporary listener on `127.0.0.1` with a random local port, so you do not manually configure a fixed redirect URI for this client.

By default, save the downloaded JSON to:

```text
~/.config/google-apps-script-mcp/oauth-client.json
```

On macOS/Linux:

```bash
mkdir -p ~/.config/google-apps-script-mcp
mv ~/Downloads/<downloaded-client-file>.json \
  ~/.config/google-apps-script-mcp/oauth-client.json
chmod 600 ~/.config/google-apps-script-mcp/oauth-client.json
```

You may instead set:

```bash
export GOOGLE_OAUTH_CLIENT_FILE=/absolute/path/oauth-client.json
```

The downloaded file should contain an `installed` object with a `client_id` and `client_secret`.

Do not commit this file.

## 5. Install the MCP

```bash
git clone https://github.com/gilmour59/google-apps-script-mcp.git
cd google-apps-script-mcp
npm install
```

During development of the MVP branch:

```bash
git switch feat/mvp-apps-script-mcp
```

## 6. Authorize your Google account

Run:

```bash
npm run auth
```

The command:

1. opens a loopback callback server on `127.0.0.1`;
2. prints the Google authorization URL;
3. attempts to open your browser;
4. waits for the OAuth callback;
5. stores the refresh token locally.

The default token file is:

```text
~/.config/google-apps-script-mcp/token.json
```

The file is created with user-only file permissions where supported.

If you want a different path:

```bash
export GOOGLE_OAUTH_TOKEN_FILE=/absolute/path/token.json
```

Do not commit either OAuth file.

## 7. Build

```bash
npm run check
npm run build
```

## 8. Test with MCP Inspector

Build first, then run:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

In the Inspector:

1. connect;
2. open **Tools**;
3. run `auth_status`;
4. run `projects_create` with a throwaway project title;
5. run `projects_get` with the returned Script ID.

## 9. Add to your MCP host

Use a local stdio configuration similar to:

```json
{
  "mcpServers": {
    "google-apps-script": {
      "command": "node",
      "args": [
        "/absolute/path/google-apps-script-mcp/dist/index.js"
      ]
    }
  }
}
```

Restart the host after editing its MCP configuration.

## 10. First safe content test

Prepare a small directory:

```text
sample/
├── Code.gs
└── appsscript.json
```

Example `Code.gs`:

```javascript
function helloMcp() {
  return 'hello';
}
```

Example `appsscript.json`:

```json
{
  "timeZone": "Asia/Manila",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Call `projects_push_directory` with:

```text
confirm_replace = false
```

Review the current and proposed file lists.

Then call it again with:

```text
confirm_replace = true
```

Only use replacement mode when the local directory represents the complete Apps Script project.

## Troubleshooting

### OAuth client file not found

Check:

```bash
ls -l ~/.config/google-apps-script-mcp/oauth-client.json
```

or set `GOOGLE_OAUTH_CLIENT_FILE`.

### OAuth client file has the wrong application type

For this MCP, create a **Desktop app** OAuth client. The downloaded JSON should normally contain an `installed` object.

### No refresh token

Run:

```bash
npm run auth
```

The OAuth flow uses `prompt=consent` and `access_type=offline` so Google can issue a refresh token.

### Apps Script API disabled

Enable it both:

- in the Google Cloud project;
- in your Apps Script user settings.

### App is in Testing but account cannot authorize

In **Google Auth Platform > Audience**, add the Google account being used by the MCP as a test user.

### Multiple Google accounts

OAuth and Apps Script access can become confusing when several accounts are active in the same browser. Use a dedicated browser profile if needed.

### Permission denied for a Script ID

The authorized Google user must have access to that Apps Script project.

### Content push would delete files

That is expected behavior of Apps Script `projects.updateContent`: the supplied file list replaces the whole remote project. Preview before confirming.
