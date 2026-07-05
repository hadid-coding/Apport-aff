---
name: verify
description: Build, launch and drive ApportAffaires (Next.js + Prisma/SQLite) to verify changes end-to-end.
---

# Vérifier ApportAffaires

## Build & lancement

```bash
cp .env.example .env
npm install
npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts
npm run build && npm start &   # http://localhost:3000
```

Le seed affiche le lien d'activation du consultant (`/activate/<token>`) et
crée l'admin `hadid.coding@gmail.com` / `admin1234`.

## Parcours à dérouler (formulaires HTML → route handlers, cookies de session)

```bash
# Login admin (303 -> /admin, cookie dans admin.jar)
curl -s -c admin.jar -X POST -d "email=hadid.coding@gmail.com&password=admin1234" \
  -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/api/auth/login

# Activation consultant (303 -> /consultant, connecte directement)
curl -s -c cons.jar -X POST -d "token=<TOKEN>&password=xxxxxxxx&confirm=xxxxxxxx" \
  http://localhost:3000/api/auth/activate

# CRA (303 -> /consultant?saved=1), puis déclaration et confirmation
curl -s -b cons.jar -X POST -d "month=2026-06&daysWorked=20" http://localhost:3000/api/cra
curl -s -b cons.jar -X POST http://localhost:3000/api/cra/<CRA_ID>/declare
curl -s -b admin.jar -X POST http://localhost:3000/api/cra/<CRA_ID>/confirm
```

Récupérer un id de CRA (pas de sqlite3 dans l'environnement) :

```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();\
p.cra.findFirst().then(c=>{console.log(c.id);process.exit(0)})"
```

## Gotchas

- SQLite ne supporte pas les enums Prisma — `role` et `status` sont des String.
- Les pages sont des Server Components : le HTML rendu contient le payload RSC,
  `grep` sur les libellés fonctionne mais peut matcher deux fois.
- Screenshots : Playwright global (`NODE_PATH=/opt/node22/lib/node_modules`) avec
  `executablePath: '/opt/pw-browsers/chromium'`.
