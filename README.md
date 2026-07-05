# ApportAffaires — Suivi des apports d'affaires

Plateforme de suivi des apports d'affaires : les consultants saisissent leur CRA
mensuel, l'apport dû est calculé automatiquement (jours travaillés × taux
d'apport), le consultant déclare son virement et l'admin confirme la réception
depuis son dashboard.

## Fonctionnalités

- **Admin**
  - Ajoute les consultants par email (nom, client, TJM, apport €/jour) — un lien
    d'activation est généré, le consultant choisit lui-même son mot de passe.
  - Dashboard : apport total dû, versé (confirmé), non versé, CA généré.
  - **Confirme la réception des virements** déclarés par les consultants.
  - Vue détaillée par consultant (historique des CRA et paiements).
- **Consultant**
  - Active son compte via le lien d'invitation et crée son mot de passe.
  - Saisit son CRA chaque mois (jours travaillés, demi-journées acceptées) —
    l'apport dû est calculé automatiquement.
  - Déclare l'envoi du virement ; suit ce qui est versé / reste à verser.

Cycle de vie d'un CRA : `SUBMITTED` (apport dû) → `DECLARED` (virement envoyé
par le consultant) → `CONFIRMED` (réception confirmée par l'admin = versé).

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io/) + SQLite (fichier local, zéro infra)
- Sessions JWT signées (cookie httpOnly), mots de passe hashés bcrypt
- Tests [Vitest](https://vitest.dev/), lint ESLint, CI GitHub Actions

## Démarrage

```bash
cp .env.example .env        # puis changez AUTH_SECRET
npm install
npm run db:push             # crée la base SQLite
npm run db:seed             # admin + consultant Yassir CHOUAF (EDF, TJM 630 €, apport 30 €/j)
npm run dev                 # http://localhost:3000
```

Comptes créés par le seed :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `hadid.coding@gmail.com` (ou `ADMIN_EMAIL`) | `admin1234` (ou `ADMIN_PASSWORD`) — **à changer** |
| Consultant | `yassir.chouaf@example.com` | à définir via le lien d'activation affiché par le seed |

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:push` | Applique le schéma Prisma à la base |
| `npm run db:seed` | Données initiales |

## CI/CD

Chaque push et pull request déclenche le workflow GitHub Actions
(`.github/workflows/ci.yml`) : install, génération Prisma, contrôle de
dérive migrations ↔ schéma, lint, typecheck, tests puis build. Bonnes
pratiques : travailler sur des branches de fonctionnalité, ouvrir une PR
vers `main`, merger seulement quand la CI est verte.

## Déploiement (Railway)

L'app est conteneurisée (`Dockerfile`) et déployable sur
[Railway](https://railway.app/) avec la base SQLite sur un volume
persistant. Au démarrage, le conteneur applique les migrations Prisma
(`prisma migrate deploy`), crée le compte admin si besoin, puis lance le
serveur (voir `docker-entrypoint.sh`).

1. **Créer le projet** : sur Railway, _New Project → Deploy from GitHub repo_,
   sélectionner ce dépôt. Railway détecte le `Dockerfile` (voir `railway.json`).
2. **Ajouter un volume persistant** : sur le service, _Volumes → New Volume_,
   point de montage `/data`. C'est là que vivra la base SQLite (sinon elle
   serait perdue à chaque redéploiement).
3. **Variables d'environnement** (_Variables_) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | `file:/data/prod.db` |
   | `AUTH_SECRET` | un secret fort — `openssl rand -base64 32` |
   | `APP_URL` | l'URL publique du service (`https://<app>.up.railway.app`) |
   | `ADMIN_EMAIL` | votre email admin |
   | `ADMIN_PASSWORD` | un mot de passe fort (créé au 1er démarrage) |
   | `ADMIN_NAME` | _(optionnel)_ nom affiché |
   | `SMTP_*`, `MAIL_FROM` | _(optionnel)_ envoi des invitations — voir section SMTP |

   `PORT` est fourni automatiquement par Railway.
4. **Déployer**. Au premier démarrage, l'admin est créé à partir de
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Connectez-vous, puis ajoutez vos
   consultants depuis l'interface. Les redéploiements sont sûrs : les
   migrations et le bootstrap admin sont idempotents.

> **Sécurité** : sans `AUTH_SECRET`, l'app refuse de démarrer en production
> (pas de secret par défaut). Ne réutilisez jamais le secret de développement.

### Build/exécution en local avec Docker

```bash
docker build -t apport-aff .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="file:/data/prod.db" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e ADMIN_EMAIL="admin@example.com" -e ADMIN_PASSWORD="motdepasse" \
  -v apport_data:/data \
  apport-aff
```

## Envoi des emails d'invitation (SMTP)

Quand l'admin ajoute un consultant, un email d'invitation contenant le lien
d'activation lui est envoyé automatiquement — **si le SMTP est configuré**.
Sinon, l'app reste fonctionnelle : le lien d'activation est affiché à l'admin
(mode manuel) et un bouton « Renvoyer l'email » est disponible.

L'envoi passe par n'importe quel fournisseur SMTP via ces variables :

| Variable | Exemple | Rôle |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | serveur SMTP |
| `SMTP_PORT` | `465` | port (465 = SSL, 587 = STARTTLS) |
| `SMTP_SECURE` | `true` | `true` pour le port 465 |
| `SMTP_USER` | `vous@gmail.com` | identifiant SMTP |
| `SMTP_PASS` | `…` | mot de passe SMTP |
| `MAIL_FROM` | `ApportAffaires <vous@gmail.com>` | expéditeur affiché |

Deux options simples, sans nom de domaine :

- **Gmail** : activez la validation en 2 étapes sur le compte Google, créez un
  **mot de passe d'application** (Google → Sécurité → Mots de passe des
  applications), et utilisez-le comme `SMTP_PASS` avec `smtp.gmail.com:465`.
- **Brevo** (ex-Sendinblue) : créez un compte, validez votre email expéditeur,
  et récupérez vos identifiants SMTP (`smtp-relay.brevo.com:587`). Offre
  gratuite ~300 emails/jour.

Sur Railway, ajoutez simplement ces variables au service.

## Notes

- SQLite convient au volume actuel ; le schéma Prisma permet de migrer vers
  PostgreSQL en changeant une ligne de configuration.
