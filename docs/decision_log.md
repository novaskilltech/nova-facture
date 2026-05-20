# NOVA FACTURE — Decision Log & Spec Snapshot

Ce document est le registre officiel des décisions d'architecture, de sécurité et d'implémentation de l'application **Nova Facture**, tenu par l'équipe **NOVA SQUAD**.

---

## 1. NOVA-LEAD — Decision Log

| ID | Décision / Sujet | Justification | Alternatives | Impacts | Date / Version |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-01** | **Sécurisation de la Session (HMAC-SHA256)** | Remplacement du stockage en clair du `userId` dans le cookie de session par un jeton signé cryptographiquement avec HMAC-SHA256 via la Web Crypto API (`src/lib/auth.ts`). | Utilisation de sessions JWT classiques avec des bibliothèques tierces plus lourdes. | **Sécurité accrue** : Protection contre l'usurpation et la falsification de session sans dépendance externe. | 20/05/2026<br>*Local non commité* |
| **DEC-02** | **Aesthetic Premium du Dashboard** | Modernisation de l'interface utilisateur avec l'ajout d'une barre de progression des encaissements, de Status Badges élégants et de styles haut de gamme (`src/app/dashboard/page.tsx`). | Interface par défaut ou Tailwind ultra-basique. | **UX Premium** : Clarté immédiate sur les indicateurs de performance clés (brouillons, payés, en retard). | 20/05/2026<br>*Local non commité* |
| **DEC-03** | **Refactoring DRY : AppHeader** | Extraction de la navigation répétitive dans toutes les pages de l'application vers un composant unique `AppHeader` (`src/components/AppHeader.tsx`). | Navigation dupliquée manuellement sur chaque page. | **Maintenabilité** : Simplification des composants de page et centralisation de la gestion des menus. | 20/05/2026<br>*Local non commité* |
| **DEC-04** | **Double Cible Database (SQLite / Supabase)** | Utilisation temporaire de SQLite en développement local (`DATABASE_URL="file:./dev.db"`) tout en conservant Supabase Postgresql comme cible de production. | Forcer Postgresql en local pour tous les développeurs. | **Complexité de synchronisation** : Risque d'incompatibilité des schémas et migrations Prisma entre SQLite et Postgresql en production. | 20/05/2026<br>*Local non commité* |

---

## 2. Spec Snapshot (État du Projet)

*   **MVP Scope** : SaaS B2C de facturation web ("Nova Facture") gérant des émetteurs (Entities), des clients (Clients) et des factures (Invoices) avec téléchargement/visualisation de PDF.
*   **Domaine** : Facturation française avec conformité légale (mentions de TVA, SIREN/SIRET, coordonnées bancaires IBAN/BIC).
*   **Stack** : Next.js, Prisma, SQLite (local) / PostgreSQL Supabase (production cible), CSS Premium.
*   **Paiement** : Pas de passerelle de paiement en direct intégrée pour le moment (flux RIB/IBAN textuel).
*   **Données personnelles collectées** : Noms, prénoms, adresses email, numéros de téléphone, adresses physiques, coordonnées bancaires, mots de passe.
*   **Environnements** : Local (dev.db SQLite) et Vercel (déploiement de production).

---

## 3. Backlog Lot 1 (Priorités Actuelles)

### [P0] - Critique (Sécurité / Stabilité)
- `[ ]` **Alignement et Stabilisation Prisma DB** : Résoudre le conflit SQLite (local) / PostgreSQL (Supabase) pour s'assurer que les builds de production ne plantent pas lors des migrations.
- `[ ]` **Audit Sécurité des Mots de Passe** : Valider que le stockage des mots de passe en base SQLite locale utilise un hachage robuste (ex: bcrypt/argon2) et n'est pas stocké en clair.
- `[ ]` **Commit de sauvegarde** : Consolider et commiter proprement les 12 fichiers locaux modifiés (auth sécurisé, dashboard premium, AppHeader).

### [P1] - Requis pour le MVP
- `[ ]` **Secret Management** : Supprimer le `DEFAULT_SECRET` codé en dur dans `src/lib/auth.ts` et lever une exception bloquante si la variable d'environnement `JWT_SECRET` est manquante.

### [P2] - Confort & Améliorations
- `[ ]` **Tests unitaires et d'intégration** : Mettre en place un plan de test minimal pour sécuriser la partie authentification signée cryptographiquement.

---

## 4. Top 5 Risques & Mitigations

1.  **Désalignement de Schéma SQLite vs Postgresql** : Le schéma Prisma a été repassé localement en SQLite alors que le dépôt cible Postgresql.
    *   *Mitigation* : Configurer un script d'adaptation automatique ou utiliser une base Postgresql locale de dev.
2.  **Perte de modifications locales** : Il y a 12 fichiers modifiés localement non sauvegardés dans Git.
    *   *Mitigation* : Commiter au plus vite l'état stable actuel sur une branche dédiée.
3.  **Secrets codés en dur** : Le fallback sur `DEFAULT_SECRET` dans le code d'auth expose les sessions si la configuration d'environnement échoue.
    *   *Mitigation* : Empêcher le démarrage de l'app si les variables d'environnement critiques sont absentes.
4.  **Stockage local non chiffré** : La base SQLite `dev.db` contient des données personnelles de facturation en clair.
    *   *Mitigation* : Limiter les accès système à la base SQLite et sécuriser le hachage des accès utilisateurs.
5.  **Conformité légale des factures** : Risque de mentions TVA ou bancaires manquantes.
    *   *Mitigation* : Validation juridique par **NOVA-LEGAL** du modèle de facture généré.

---

## 5. Questions en suspens pour la reprise

1.  **Arbitrage Base de données** : Confirmes-tu vouloir développer en SQLite localement et déployer en Postgresql (Supabase) ? Si oui, comment gérons-nous la double configuration Prisma ?
2.  **Commit des changements** : Souhaites-tu que nous fassions un commit de sauvegarde de tes modifications locales (authentification signée, dashboard premium, AppHeader réutilisable) au début de la prochaine session ?
