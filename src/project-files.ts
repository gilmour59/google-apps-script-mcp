import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppsScriptFile } from './apps-script.js';

function appsScriptFileFromPath(
  filePath: string,
  source: string,
): AppsScriptFile | null {
  const base = path.basename(filePath);

  if (base === 'appsscript.json') {
    return { name: 'appsscript', type: 'JSON', source };
  }

  if (base.endsWith('.gs')) {
    return {
      name: base.slice(0, -3),
      type: 'SERVER_JS',
      source,
    };
  }

  if (base.endsWith('.js')) {
    return {
      name: base.slice(0, -3),
      type: 'SERVER_JS',
      source,
    };
  }

  if (base.endsWith('.html')) {
    return {
      name: base.slice(0, -5),
      type: 'HTML',
      source,
    };
  }

  return null;
}

export async function loadAppsScriptDirectory(
  directory: string,
): Promise<AppsScriptFile[]> {
  const absolute = path.resolve(directory);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const files: AppsScriptFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filePath = path.join(absolute, entry.name);
    const source = await fs.readFile(filePath, 'utf8');
    const converted = appsScriptFileFromPath(filePath, source);
    if (converted) files.push(converted);
  }

  if (!files.some((file) => file.name === 'appsscript' && file.type === 'JSON')) {
    throw new Error(
      `Directory ${absolute} does not contain appsscript.json. Apps Script updateContent requires a manifest.`,
    );
  }

  const duplicateKeys = files
    .map((file) => `${file.type}:${file.name}`)
    .filter((key, index, all) => all.indexOf(key) !== index);

  if (duplicateKeys.length) {
    throw new Error(
      `Duplicate Apps Script file names detected: ${[...new Set(duplicateKeys)].join(', ')}`,
    );
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export function summarizeFiles(files: AppsScriptFile[]) {
  return files.map((file) => ({
    name: file.name,
    type: file.type,
    characters: file.source.length,
  }));
}
