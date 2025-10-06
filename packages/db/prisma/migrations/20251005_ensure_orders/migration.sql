-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "public"."UserRole" AS ENUM ('SITE_SUPERVISOR', 'PROCUREMENT', 'SUPPLIER', 'CHAIRMAN', 'CHAIRMAN_PA', 'FINANCE_PROCUREMENT');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryLogType') THEN
    CREATE TYPE "public"."InventoryLogType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentCategory') THEN
    CREATE TYPE "public"."DocumentCategory" AS ENUM ('CONTRACTS', 'REPORTS', 'POLICIES', 'PROCEDURES', 'TEMPLATES', 'PROJECT_DOCUMENTS', 'BOQ_DOCUMENTS', 'OTHER');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
    CREATE TYPE "public"."DocumentType" AS ENUM ('PDF', 'DOC', 'DOCX', 'JPG', 'JPEG', 'PNG');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus') THEN
    CREATE TYPE "public"."ProjectStatus" AS ENUM ('TO_START', 'ONGOING', 'COMPLETED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectDocumentCategory') THEN
    CREATE TYPE "public"."ProjectDocumentCategory" AS ENUM ('LETTER_OF_AWARD', 'ACCEPTANCE_OF_AWARD', 'PERFORMANCE_BOND', 'CONTRACT_SIGNING', 'BOQ_DOCUMENT', 'SAMPLE_APPROVAL', 'OTHER');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StakeholderRole') THEN
    CREATE TYPE "public"."StakeholderRole" AS ENUM ('MAIN_CONTRACTOR', 'CLIENT', 'CONSULTANT', 'STRUCTURAL_ENGINEER', 'ARCHITECT', 'QUANTITY_SURVEYOR', 'SUB_CONTRACTOR', 'LAW_FIRM');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProcurementStatus') THEN
    CREATE TYPE "public"."ProcurementStatus" AS ENUM ('PENDING', 'QUOTED', 'APPROVED', 'ORDERED', 'DELIVERED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PhaseStatus') THEN
    CREATE TYPE "public"."PhaseStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PROCUREMENT', 'PENDING_CHAIRMAN', 'APPROVED', 'REJECTED', 'SOURCING', 'SOURCED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED', 'VERIFIED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
    CREATE TYPE "public"."QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "poBox" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."inventory_logs" (
    "id" TEXT NOT NULL,
    "type" "public"."InventoryLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."office_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."DocumentCategory" NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'TO_START',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."project_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ProjectDocumentCategory" NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentType" TEXT NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."project_stakeholders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "role" "public"."StakeholderRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."procurement_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "estimatedCost" DECIMAL(15,2),
    "supplierId" TEXT,
    "actualCost" DECIMAL(15,2),
    "status" "public"."ProcurementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."project_phases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseName" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."PhaseStatus" NOT NULL DEFAULT 'PLANNED',
    "weekNumber" INTEGER NOT NULL,
    "tasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."boq_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "equipmentInstallationWorks" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "boq_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."boq_template_items" (
    "id" TEXT NOT NULL,
    "boqTemplateId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boq_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."site_supervisor_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_supervisor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."order_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."order_template_items" (
    "id" TEXT NOT NULL,
    "orderTemplateId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING_PROCUREMENT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(15,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "inventoryId" TEXT,
    "procurementApprovedAt" TIMESTAMP(3),
    "procurementApprovedBy" TEXT,
    "chairmanApprovedAt" TIMESTAMP(3),
    "chairmanApprovedBy" TEXT,
    "procurementSourcedAt" TIMESTAMP(3),
    "procurementSourcedBy" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2),
    "totalPrice" DECIMAL(15,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" TIMESTAMP(3),
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."delivery_documents" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."quote_items" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quoteId" TEXT NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (guarded)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "public"."users"("email");

-- CreateIndex (guarded)
CREATE UNIQUE INDEX IF NOT EXISTS "site_supervisor_assignments_userId_key" ON "public"."site_supervisor_assignments"("userId");

-- CreateIndex (guarded)
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "public"."orders"("orderNumber");

-- CreateIndex (guarded)
CREATE UNIQUE INDEX IF NOT EXISTS "deliveries_deliveryNumber_key" ON "public"."deliveries"("deliveryNumber");

-- CreateIndex (guarded)
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_quoteNumber_key" ON "public"."quotes"("quoteNumber");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_stakeholders" ADD CONSTRAINT "project_stakeholders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."procurement_items" ADD CONSTRAINT "procurement_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_phases" ADD CONSTRAINT "project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boq_templates" ADD CONSTRAINT "boq_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boq_templates" ADD CONSTRAINT "boq_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boq_template_items" ADD CONSTRAINT "boq_template_items_boqTemplateId_fkey" FOREIGN KEY ("boqTemplateId") REFERENCES "public"."boq_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_supervisor_assignments" ADD CONSTRAINT "site_supervisor_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_supervisor_assignments" ADD CONSTRAINT "site_supervisor_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_templates" ADD CONSTRAINT "order_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_templates" ADD CONSTRAINT "order_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_template_items" ADD CONSTRAINT "order_template_items_orderTemplateId_fkey" FOREIGN KEY ("orderTemplateId") REFERENCES "public"."order_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_procurementApprovedBy_fkey" FOREIGN KEY ("procurementApprovedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_chairmanApprovedBy_fkey" FOREIGN KEY ("chairmanApprovedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_procurementSourcedBy_fkey" FOREIGN KEY ("procurementSourcedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deliveries" ADD CONSTRAINT "deliveries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_documents" ADD CONSTRAINT "delivery_documents_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

