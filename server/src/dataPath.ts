import fs from 'fs';
import path from 'path';

let cachedDataDir: string | null = null;

export function resolveDataDir(): string {
  if (cachedDataDir) {
    return cachedDataDir;
  }

  // 1. If running from repo root, 'server' directory exists in process.cwd()
  const inServerDir = path.resolve(process.cwd(), 'server');
  const serverData = path.resolve(process.cwd(), 'server', 'data');
  const rootData = path.resolve(process.cwd(), 'data');

  if (fs.existsSync(inServerDir)) {
    if (!fs.existsSync(serverData)) {
      try {
        fs.mkdirSync(serverData, { recursive: true });
      } catch {}
    }

    // Migrate any files from root/data to server/data if not already there
    if (fs.existsSync(rootData)) {
      try {
        const rootFiles = fs.readdirSync(rootData);
        for (const file of rootFiles) {
          const src = path.join(rootData, file);
          const dst = path.join(serverData, file);
          if (fs.statSync(src).isFile() && !fs.existsSync(dst)) {
            fs.copyFileSync(src, dst);
          }
        }
      } catch (err) {
        console.warn('Could not sync root data to server/data:', err);
      }
    }

    cachedDataDir = serverData;
    return serverData;
  }

  // 2. If running directly inside server/
  if (!fs.existsSync(rootData)) {
    try {
      fs.mkdirSync(rootData, { recursive: true });
    } catch {}
  }

  cachedDataDir = rootData;
  return rootData;
}
