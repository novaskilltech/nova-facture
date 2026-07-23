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
| **DEC-05** | **Suppléments Produits Omra** | Ajout de suppléments automatiques dans la création de facture : chambre Single +600 €, Double +200 €, Triple +100 €, Quad +0 €, Quintuple +0 €, et petit déjeuner à 10 €/jour selon la durée du séjour. | Saisie manuelle d'un prix global sans détail de supplément. | **Fiabilité commerciale** : Réduction des erreurs de calcul et meilleure transparence dans la description de prestation. | 21/05/2026<br>*Commité et poussé* |
| **DEC-06** | **Aéroport de Départ Facturable** | Ajout d'un champ de sélection de l'aéroport de départ dans la nouvelle facture : Paris, Marseille, Lyon, Bruxelles. L'information est intégrée à la description de prestation. | Champ libre ou absence d'information dans la facture. | **Traçabilité client** : La facture porte explicitement le point de départ retenu pour le package. | 21/05/2026<br>*Commité et poussé* |
| **DEC-07** | **Mentions CGV et TVA sur Factures** | Reformulation professionnelle des mentions légales : CGV consultables sur omrayanair.com, acceptation des CGV par règlement total ou partiel, absence d'annulation/remboursement après paiement, et TVA non applicable conformément à l'article 293 B du CGI. | Mention courte non juridique ou uniquement visible hors PDF. | **Conformité documentaire** : La page facture et le PDF affichent des mentions plus claires pour le client. | 21/05/2026<br>*Local à pousser* |
| **DEC-08** | **Auto-adaptation du Schéma Prisma (SQLite/Postgresql)** | Création d'un script (`prisma/prepare.js`) intégré à `postinstall`, `dev`, `build` et `db:migrate` qui adapte dynamiquement le type de `datasource` (sqlite vs postgresql) et les propriétés (`directUrl`) en fonction de la variable `DATABASE_URL`. | Gestion manuelle de deux fichiers de schéma distincts. | **Builds et Dev fiables** : Permet le développement en SQLite local sans casser le schéma PostgreSQL ciblé pour Supabase/production. | 21/05/2026<br>*Local commité* |
| **DEC-09** | **Sécurisation et Résolution API Auth Bypass** | Remplacement de `requireAuth()` (qui lève une redirection caught par les blocs `try-catch` des API Routes, masquant les erreurs d'accès comme des codes 400 ou 500) par un appel direct à `getSession()`. | Garder `requireAuth()` et filtrer l'erreur spécifique de Next.js. | **Sécurité et Statuts conformes** : Les API retournent désormais un vrai code `401 Non autorisé` lors d'un défaut de session, et des statuts 400/500 précis en cas d'autres erreurs. | 21/05/2026<br>*Local commité* |
| **DEC-10** | **Sécurisation Secrets & Hachage** | Retrait du `DEFAULT_SECRET` codé en dur dans `src/lib/auth.ts`, forçant une exception bloquante si `JWT_SECRET` manque. Validation du stockage des mots de passe avec hachage bcrypt (confirmé via seed et login). | Aucun, la levée d'exception est indispensable en production. | **Conformité Sécurité** : Zéro secret en dur, configuration d'environnement impérative. | 21/05/2026<br>*Local commité* |
| **DEC-11** | **Retrait du mode insensible pour SQLite** | Suppression de `mode: "insensitive"` dans la requête Prisma `findMany` de `generate-number` qui levait une erreur de compilation avec le provider SQLite en développement. | Conserver une casse stricte ou appliquer une conversion manuelle sur les enregistrements. | **Robustesse locale** : Correction d'une erreur bloquante TypeScript lors de la génération de numéro de facture. | 21/05/2026<br>*Local commité* |
| **DEC-12** | **Fiche Client & Édition Tiroir Latéral** | Implémentation du composant `ClientDetailDrawer` et de l'API `PUT /api/clients/[id]` permettant d'afficher et modifier la fiche d'un client au clic sur sa ligne (consultation complète, rectification des coordonnées, historique des factures). | Page dédiée `/clients/[id]` vs Modal centrale classique. | **UX & Conformité RGPD** : Droit de rectification fluide et centralisé avec immutabilité des factures déjà émises. | 24/07/2026<br>*Local commité & validé* |

---

## 2. Spec Snapshot (État du Projet)

*   **MVP Scope** : SaaS B2C de facturation web ("Nova Facture") gérant des émetteurs (Entities), des clients (Clients) et des factures (Invoices) avec téléchargement/visualisation de PDF et **consultation/édition interactive des fiches clients via tiroir latéral**.
*   **Domaine** : Facturation française avec conformité légale (mentions de TVA, SIREN/SIRET, coordonnées bancaires IBAN/BIC).
*   **Stack** : Next.js 16 (App Router / Turbopack), Prisma, SQLite (local) / PostgreSQL Supabase (production cible), CSS Premium.
*   **Paiement** : Pas de passerelle de paiement en direct intégrée pour le moment (flux RIB/IBAN textuel).
*   **Packages Omra** : Les factures peuvent inclure des informations de séjour, d'aéroport de départ, de visa, d'hébergement, de petit déjeuner et de suppléments automatisés.
*   **Données personnelles collectées** : Noms, prénoms, adresses email, numéros de téléphone, adresses physiques, coordonnées bancaires, mots de passe.
*   **Environnements** : Local (dev.db SQLite) et Vercel (déploiement de production).

---

## 3. Backlog Lot 1 (Priorités Actuelles)

### [P0] - Critique (Sécurité / Stabilité)
- `[x]` **Alignement et Stabilisation Prisma DB** : Résoudre le conflit SQLite (local) / PostgreSQL (Supabase) pour s'assurer que les builds de production ne plantent pas lors des migrations.
- `[x]` **Audit Sécurité des Mots de Passe** : Valider que le stockage des mots de passe en base SQLite locale utilise un hachage robuste (ex: bcrypt/argon2) et n'est pas stocké en clair.
- `[x]` **API Modification Client & Auth (`PUT /api/clients/[id]`)** : Handler d'édition sécurisé par `getSession()` avec validation des données et statuts d'erreur HTTP explicites.

### [P1] - Requis pour le MVP
- `[x]` **Secret Management** : Supprimer le `DEFAULT_SECRET` codé en dur dans `src/lib/auth.ts` et lever une exception bloquante si la variable d'environnement `JWT_SECRET` est manquante.
- `[x]` **Fiche Client & Édition Tiroir Latéral (`ClientDetailDrawer`)** : Intégration du composant slide-over avec modes Consultation (coordonnées + factures liées) et Édition.
- `[x]` **Recherche & Interactivité Liste Clients (`ClientsListWrapper`)** : Recherche en temps réel (nom, entreprise, email, téléphone) et ouverture automatique de la fiche au clic.

### [P2] - Confort & Améliorations
- `[ ]` **Tests unitaires et d'intégration** : Mettre en place un plan de test minimal pour sécuriser la partie authentification et les API routes clients.

---

## 4. Top 5 Risques & Mitigations

1.  **Désalignement de Schéma SQLite vs Postgresql** : Le schéma Prisma a été repassé localement en SQLite alors que le dépôt cible Postgresql.
    *   *Mitigation* (Résolu) : Script d'adaptation automatique `prisma/prepare.js` qui réécrit à la volée le provider.
2.  **Immutabilité des Factures Émises** : Modifier l'adresse d'un client ne doit pas altérer l'adresse imprimée sur une facture déjà émise au niveau comptable.
    *   *Mitigation* (Résolu) : Les factures en état `emitted` ou `paid` conservent leur état historique, seules la fiche client et les factures `draft` s'actualisent.
3.  **Bypass de Sécurité par try-catch sur API** : `requireAuth()` lève une redirection interne Next.js, capturée comme une erreur 400 ou 500 par les try-catch, empêchant d'isoler le défaut d'auth.
    *   *Mitigation* (Résolu) : Utilisation directe de `getSession()` et retour immédiat de `401 Non autorisé` avant le try-catch.
4.  **Secrets codés en dur** : Le fallback sur `DEFAULT_SECRET` dans le code d'auth expose les sessions si la configuration d'environnement échoue.
    *   *Mitigation* (Résolu) : Empêcher le démarrage de l'app si `JWT_SECRET` est absente (lever de manière bloquante).
5.  **Stockage local non chiffré** : La base SQLite `dev.db` contient des données personnelles de facturation en clair.
    *   *Mitigation* : Limiter les accès système à la base SQLite et sécuriser le hachage des accès utilisateurs.

---

## 5. Questions en suspens pour la reprise

Toutes les questions en suspens de la session précédente ont été résolues, validées et implémentées avec succès.

