import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { config, GOOGLE_SCOPES } from './config.js';

type OAuthClientConfig = {
  client_id: string;
  client_secret: string;
};

type OAuthClientFile = {
  installed?: OAuthClientConfig;
  web?: OAuthClientConfig;
};

async function readJsonFile<T>(filePath: string): Promise<T> {
  const source = await fs.readFile(filePath, 'utf8');
  return JSON.parse(source) as T;
}

async function ensureParentDirectory(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadClientConfig(): Promise<OAuthClientConfig> {
  let raw: OAuthClientFile;
  try {
    raw = await readJsonFile<OAuthClientFile>(config.oauthClientFile);
  } catch (error) {
    throw new Error(
      `Unable to read Google OAuth client file at ${config.oauthClientFile}. ` +
        'Create a Desktop app OAuth client in Google Cloud and place the downloaded JSON there.',
      { cause: error },
    );
  }

  const client = raw.installed ?? raw.web;
  if (!client?.client_id || !client?.client_secret) {
    throw new Error(
      'OAuth client JSON must contain an installed or web client_id/client_secret pair.',
    );
  }

  return client;
}

async function saveCredentials(credentials: Credentials): Promise<void> {
  await ensureParentDirectory(config.oauthTokenFile);

  let existing: Credentials = {};
  try {
    existing = await readJsonFile<Credentials>(config.oauthTokenFile);
  } catch {
    // First login.
  }

  const merged: Credentials = {
    ...existing,
    ...credentials,
    refresh_token: credentials.refresh_token ?? existing.refresh_token,
  };

  await fs.writeFile(
    config.oauthTokenFile,
    JSON.stringify(merged, null, 2) + '\n',
    { mode: 0o600 },
  );
}

async function buildOAuthClient(redirectUri?: string): Promise<OAuth2Client> {
  const client = await loadClientConfig();
  const oauth = new google.auth.OAuth2(
    client.client_id,
    client.client_secret,
    redirectUri,
  );

  oauth.on('tokens', (tokens) => {
    void saveCredentials(tokens).catch((error) => {
      console.error('Failed to persist refreshed Google OAuth tokens:', error);
    });
  });

  return oauth;
}

export async function hasCachedToken(): Promise<boolean> {
  try {
    const token = await readJsonFile<Credentials>(config.oauthTokenFile);
    return Boolean(token.refresh_token || token.access_token);
  } catch {
    return false;
  }
}

export async function getAuthorizedClient(): Promise<OAuth2Client> {
  if (!(await hasCachedToken())) {
    throw new Error(
      'Google OAuth is not configured yet. Run "npm run auth" in the MCP repository first.',
    );
  }

  const oauth = await buildOAuthClient();
  const token = await readJsonFile<Credentials>(config.oauthTokenFile);
  oauth.setCredentials(token);

  try {
    await oauth.getAccessToken();
  } catch (error) {
    throw new Error(
      'The cached Google OAuth token is invalid or expired. Run "npm run auth" again.',
      { cause: error },
    );
  }

  return oauth;
}

function openBrowser(url: string): void {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // The URL is also printed, so failure to auto-open is non-fatal.
  }
}

export async function loginInteractive(): Promise<void> {
  const state = crypto.randomBytes(24).toString('hex');

  let resolveCode!: (code: string) => void;
  let rejectCode!: (error: Error) => void;
  const codePromise = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');

      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404).end('Not found');
        return;
      }

      if (url.searchParams.get('state') !== state) {
        res.writeHead(400).end('Invalid OAuth state');
        rejectCode(new Error('Google OAuth state did not match.'));
        return;
      }

      const error = url.searchParams.get('error');
      if (error) {
        res.writeHead(400).end('Authorization failed. You may close this window.');
        rejectCode(new Error(`Google OAuth returned: ${error}`));
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400).end('Missing authorization code');
        rejectCode(new Error('Google OAuth callback did not include a code.'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Google Apps Script MCP is authorized. You may close this window.');
      resolveCode(code);
    } catch (error) {
      rejectCode(error instanceof Error ? error : new Error(String(error)));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to open a local OAuth callback port.');
  }

  const redirectUri = `http://127.0.0.1:${address.port}/oauth2callback`;
  const oauth = await buildOAuthClient(redirectUri);

  const authUrl = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  });

  console.error('\nOpen this URL to authorize Google Apps Script MCP:\n');
  console.error(authUrl);
  console.error('\nWaiting for Google OAuth callback...\n');
  openBrowser(authUrl);

  try {
    const code = await codePromise;
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);
    await saveCredentials(tokens);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
