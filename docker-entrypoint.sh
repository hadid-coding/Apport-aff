#!/bin/sh
set -e

# Applique les migrations Prisma sur la base (volume persistant), puis
# crée l'admin si besoin, puis démarre le serveur Next.js.
echo "[entrypoint] prisma migrate deploy…"
npx prisma migrate deploy

echo "[entrypoint] bootstrap admin…"
node scripts/bootstrap-admin.mjs

echo "[entrypoint] démarrage du serveur…"
exec npm start
