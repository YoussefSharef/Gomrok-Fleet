-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "pinHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "serial" TEXT NOT NULL DEFAULT '',
    "zone" TEXT NOT NULL DEFAULT '',
    "hours" INTEGER NOT NULL DEFAULT 0,
    "lastMeter" INTEGER NOT NULL DEFAULT 0,
    "purchased" TEXT,
    "warranty" TEXT,
    "intervalHours" INTEGER NOT NULL DEFAULT 0,
    "intervalMonths" INTEGER NOT NULL DEFAULT 0,
    "lastService" TEXT,
    "nextService" TEXT,
    "partner" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'operational',
    "complaint" TEXT,
    "reporter" TEXT,
    "channel" TEXT,
    "impact" TEXT,
    "reportedAt" TEXT,
    "issue" TEXT,
    "vendor" TEXT,
    "sent" TEXT,
    "eta" TEXT,
    "wo" TEXT,
    "cost" INTEGER,
    "quoted" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT NOT NULL DEFAULT '-',
    "wo" TEXT NOT NULL DEFAULT '-',
    "cost" INTEGER,
    CONSTRAINT "ServiceEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "cost" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Part_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "lead" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "awarded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Quote_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "covers" TEXT NOT NULL DEFAULT '',
    "contract" TEXT NOT NULL DEFAULT 'Annual contract',
    "contact" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "offersJson" TEXT NOT NULL DEFAULT '[]',
    "since" INTEGER,
    "escalation" TEXT NOT NULL DEFAULT '',
    "turnaround" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "Unit_type_idx" ON "Unit"("type");

-- CreateIndex
CREATE INDEX "Unit_status_idx" ON "Unit"("status");

-- CreateIndex
CREATE INDEX "ServiceEvent_unitId_idx" ON "ServiceEvent"("unitId");

-- CreateIndex
CREATE INDEX "Part_unitId_idx" ON "Part"("unitId");

-- CreateIndex
CREATE INDEX "Quote_unitId_idx" ON "Quote"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");
