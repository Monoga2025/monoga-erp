# src

Server and domain code for Monoga ERP.

- `server.ts`: entry point; listens on `127.0.0.1` only.
- `app.ts`: Fastify app, static client serving and API routes.
- `metadata-store.ts`: local metadata persistence.
- `*-adapter.ts` and `workspace-*.ts`: adapters for YouTube, viral scripts, Jarvis telemetry, projects and folders.
- `client/` and `event-sales/` hold the UI and the lead module.
