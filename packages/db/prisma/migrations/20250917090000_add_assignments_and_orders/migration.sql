-- Create Site Supervisor Assignment table
CREATE TABLE IF NOT EXISTS "site_supervisor_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "site_supervisor_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_supervisor_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "site_supervisor_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ensure one assignment per user
DO $$ BEGIN
    CREATE UNIQUE INDEX "site_supervisor_assignments_userId_key" ON "site_supervisor_assignments" ("userId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Create Order Templates tables
CREATE TABLE IF NOT EXISTS "order_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "order_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "order_template_items" (
    "id" TEXT NOT NULL,
    "orderTemplateId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "order_template_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_template_items_orderTemplateId_fkey" FOREIGN KEY ("orderTemplateId") REFERENCES "order_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create BOQ Templates tables (if missing)
CREATE TABLE IF NOT EXISTS "boq_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "equipmentInstallationWorks" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "boq_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "boq_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "boq_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "boq_template_items" (
    "id" TEXT NOT NULL,
    "boqTemplateId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "boq_template_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "boq_template_items_boqTemplateId_fkey" FOREIGN KEY ("boqTemplateId") REFERENCES "boq_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);


