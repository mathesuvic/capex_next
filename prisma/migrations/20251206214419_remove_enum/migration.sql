-- CreateTable
CREATE TABLE "Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Subplan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "meta" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "planId" INTEGER NOT NULL,
    CONSTRAINT "Subplan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subplanId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    CONSTRAINT "MonthlyValue_subplanId_fkey" FOREIGN KEY ("subplanId") REFERENCES "Subplan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromSubplanId" INTEGER NOT NULL,
    "toSubplanId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Transfer_fromSubplanId_fkey" FOREIGN KEY ("fromSubplanId") REFERENCES "Subplan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toSubplanId_fkey" FOREIGN KEY ("toSubplanId") REFERENCES "Subplan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyValue_subplanId_month_type_key" ON "MonthlyValue"("subplanId", "month", "type");

-- CreateIndex
CREATE INDEX "Transfer_fromSubplanId_idx" ON "Transfer"("fromSubplanId");

-- CreateIndex
CREATE INDEX "Transfer_toSubplanId_idx" ON "Transfer"("toSubplanId");
