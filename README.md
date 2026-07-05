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
(`.github/workflows/ci.yml`) : install, génération Prisma, lint, typecheck,
tests puis build. Bonnes pratiques : travailler sur des branches de
fonctionnalité, ouvrir une PR vers `main`, merger seulement quand la CI est
verte.

## Notes

- L'envoi d'email n'est pas branché : le lien d'activation est affiché à
  l'admin, qui le transmet au consultant (WhatsApp, mail…). Un provider SMTP
  (Resend, SES…) pourra être ajouté ensuite.
- SQLite convient au volume actuel ; le schéma Prisma permet de migrer vers
  PostgreSQL en changeant une ligne de configuration.
