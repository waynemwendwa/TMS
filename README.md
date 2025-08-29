# Tender Management System (TMS)

Monorepo with Next.js (web), Express (api), Prisma (db), Postgres and MinIO.

## Getting started

- Start services: `docker compose up -d`
- Configure env: copy `.env.example` files and set secrets
- Install deps: `npm install`
- Generate Prisma client: `npm -w packages/db run generate`
- Run API: `npm run dev:api`
- Run Web: `npm run dev`
