import os from 'node:os';
import path from 'node:path';

export const APP_NAME = 'google-apps-script-mcp';
export const APP_VERSION = '0.1.0';

const defaultConfigDir = path.join(os.homedir(), '.config', APP_NAME);

export const config = {
  oauthClientFile:
    process.env.GOOGLE_OAUTH_CLIENT_FILE ||
    path.join(defaultConfigDir, 'oauth-client.json'),
  oauthTokenFile:
    process.env.GOOGLE_OAUTH_TOKEN_FILE ||
    path.join(defaultConfigDir, 'token.json'),
};

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
];

export function redactPath(value: string): string {
  const home = os.homedir();
  return value.startsWith(home) ? value.replace(home, '~') : value;
}
