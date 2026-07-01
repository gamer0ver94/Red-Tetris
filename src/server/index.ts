import { build_server } from './app/build_server.ts';
import { existsSync, readFileSync } from 'node:fs';

//Main server entrypoint
const start = async () => {
  let sessionManagerRaw = process.env.SESSION_MANAGER;
  if (!sessionManagerRaw) {
    try {
      if (existsSync('src/server/session_manager.env')) {
        const content = readFileSync('src/server/session_manager.env', 'utf8');
        const m = content.match(/SESSION_MANAGER=(.*)/);
        if (m) sessionManagerRaw = m[1].trim();
      }
    } catch (e) {
      /* ignore */
    }
  }

  let listenHost = '0.0.0.0';
  const hasTls = Boolean(
    process.env.TLS_KEY_PATH &&
    process.env.TLS_CERT_PATH &&
    existsSync(process.env.TLS_KEY_PATH) &&
    existsSync(process.env.TLS_CERT_PATH)
  );
  const protocol = hasTls ? 'https' : 'http';

  if (sessionManagerRaw) {
    const entry = sessionManagerRaw.split(',')[0] || '';
    const afterFirstSlash = entry.includes('/') ? entry.split('/', 2)[1] : entry;
    const firstPart = (afterFirstSlash || '').split(':')[0];
    const host = firstPart.split('.')[0];

    if (host) {
      process.env.CLIENT_ORIGIN = `${protocol}://${host}:1800`;
      listenHost = '0.0.0.0';
      console.log('Detected SESSION_MANAGER host:', host);
      console.log('Set CLIENT_ORIGIN to', process.env.CLIENT_ORIGIN);
    }
  }

  const app = await build_server();
  await app.listen({
    port: 1800,
    host: listenHost,
  });
};

// entrypoint call
function main() {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

main();
