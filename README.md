# kcorp-matches-discord

Poste chaque jour les matchs de la Karmine Corp dans un salon Discord, via un webhook. Pas de bot, pas de serveur, pas de build.

## Fonctionnement

1. Le script interroge l'API MediaWiki de Liquipedia pour les 8 pages d'équipe listées dans `src/config.ts`.
2. Il garde les matchs des 24 heures qui suivent le lancement, les trie, et note les pages Liquipedia en échec.
3. Il poste un embed dans le salon via `DISCORD_WEBHOOK_URL`, avec un champ par jeu qui a des matchs. Sans aucun match, l'embed indique « Aucun match trouvé pour aujourd'hui. ». Si toutes les pages Liquipedia sont en échec, il ne poste rien et sort avec le code 1.

Compte environ 3 min 30 par exécution, à cause de la limite Liquipedia d'une requête `action=parse` toutes les 30 secondes.

## Installation

Prérequis : Node 22.18 ou plus récent.

1. Dans Discord : Paramètres du salon, Intégrations, Webhooks, Nouveau webhook, Copier l'URL.
2. `cp .env.example .env`, puis colle l'URL dans `DISCORD_WEBHOOK_URL`. Renseigne aussi `LIQUIPEDIA_USER_AGENT` avec le nom du projet et ton contact, comme l'exigent les conditions de Liquipedia.
3. `npm install`
4. `npm start`

Pour voir le payload sans poster, sans webhook mais avec `LIQUIPEDIA_USER_AGENT` :

```bash
DRY_RUN=1 npm start
```

Pour viser une autre date, passée ou future, donne le début de la fenêtre de 24 heures. Une date seule vaut minuit UTC. `+02:00` est le décalage de Paris en heure d'été, `+01:00` en hiver.

```bash
TARGET_DATE=2026-09-24T08:00:00+02:00 npm start
```

## Déploiement sur un serveur

Le post quotidien tourne sur un serveur à soi, par exemple un NAS. Liquipedia refuse les requêtes venant de GitHub Actions avec un 429, alors qu'il accepte une adresse IP de particulier.

1. `git clone https://github.com/fbourdenet/kcorp-matches-discord.git`
2. `cp .env.example .env`, remplis `DISCORD_WEBHOOK_URL` et `LIQUIPEDIA_USER_AGENT`, puis `chmod 600 .env`.
3. Planifie chaque jour à 8h, heure de Paris, la commande `git pull --ff-only && npm ci --omit=dev && npm start`, lancée dans le dossier du projet avec Node 22.18 ou plus récent.
4. Active la notification d'échec de la tâche planifiée : le script sort avec le code 1 si le post échoue.

Il n'y a pas d'étape de déploiement. Chaque run commence par `git pull --ff-only`, donc le serveur utilise toujours le dernier `main`, validé par la CI GitHub. Le serveur fait seulement des connexions sortantes, vers GitHub, Liquipedia et Discord.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm start` | Exécution réelle |
| `npm test` | Tests unitaires |
| `npm run typecheck` | Vérification TypeScript |
| `npm run check` | Lint et format Biome |
| `npm run check:fix` | Corrige le lint et le format |

## Style

Le code suit le [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) et les règles de typage de [TypeScript Best Practices](https://github.com/ofershap/typescript-best-practices). Biome applique le format et le lint.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/index.ts` | Entrée : validation, date, orchestration |
| `src/config.ts` | Env et équipes surveillées |
| `src/types.ts` | Types `GameId`, `Match`, `Team`, payload Discord |
| `src/date.ts` | Helpers Europe/Paris |
| `src/match.ts` | Tri des matchs |
| `src/liquipedia.ts` | Fetch des pages et parsing du carrousel Liquipedia |
| `src/webhook.ts` | Payload : un champ par jeu avec des matchs, POST Discord |

## Crédits

Les données des matchs viennent de [Liquipedia](https://liquipedia.net), sous licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Chaque récap le rappelle en pied de page. Les pages de `tests/fixtures/` sont des copies de Liquipedia, sous la même licence.

Le logo `assets/kc-logo.png` appartient à la Karmine Corp. Il n'est pas couvert par la licence MIT du projet. Ce projet n'est pas officiel et n'a aucun lien avec la Karmine Corp.
