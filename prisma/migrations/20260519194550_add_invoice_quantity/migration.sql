-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amountHT" REAL NOT NULL,
    "tvaRate" REAL NOT NULL DEFAULT 0,
    "tvaAmount" REAL NOT NULL DEFAULT 0,
    "totalTTC" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paymentMethod" TEXT NOT NULL,
    "paymentLink" TEXT,
    "notes" TEXT,
    "entityId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emittedAt" DATETIME,
    CONSTRAINT "Invoice_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("amountHT", "clientId", "createdAt", "date", "description", "emittedAt", "entityId", "id", "notes", "number", "paymentLink", "paymentMethod", "periodEnd", "periodStart", "status", "totalTTC", "tvaAmount", "tvaRate", "updatedAt") SELECT "amountHT", "clientId", "createdAt", "date", "description", "emittedAt", "entityId", "id", "notes", "number", "paymentLink", "paymentMethod", "periodEnd", "periodStart", "status", "totalTTC", "tvaAmount", "tvaRate", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
