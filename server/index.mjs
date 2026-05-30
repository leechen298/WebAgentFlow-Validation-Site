import { createInventoryServer } from './inventoryServer.mjs';

const host = process.env.VALIDATION_API_HOST ?? '127.0.0.1';
const port = Number(process.env.VALIDATION_API_PORT ?? 8003);

const server = createInventoryServer();

server.listen(port, host, () => {
  console.log(`Validation API listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
