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

## 3. Configure the OAuth consent screen

In Google Cloud Console:

1. Open **Google Auth Platform** / **OAuth consent screen**.
2. Configure the app name and support/contact details.
3. If the app is in Testing mode, add your Google account as a test user.

The MCP currently requests:

```text
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.deployments
https://www.googleapis.com/auth/script.metrics
```

These scopes allow project management, versions/deployments, and metrics access.

## 4. Create a Desktop OAuth client

Create an OAuth client with application type:

```text
Desktop app
```

Download the JSON file.

By default, save it to:

```text
~/.config/google-apps-script-mcp/oauth-client.json
```

You may instead set:

```bash
export GOOGLE_OAUTH_CLIENT_FILE=/absolute/path/oauth-client.json
```

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
ls ~/.config/google-apps-script-mcp/oauth-client.json
```

or set `GOOGLE_OAUTH_CLIENT_FILE`.

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

### Multiple Google accounts

OAuth and Apps Script access can become confusing when several accounts are active in the same browser. Use a dedicated browser profile if needed.

### Permission denied for a Script ID

The authorized Google user must have access to that Apps Script project.

### Content push would delete files

That is expected behavior of Apps Script `projects.updateContent`: the supplied file list replaces the whole remote project. Preview before confirming.
