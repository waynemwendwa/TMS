/*
  Warnings:

  - You are about to drop the column `projectId` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the `approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `boq_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `boqs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deliveries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `market_survey_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `market_surveys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `procurement_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `procurement_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchasing_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quote_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quotes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sample_approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tool_usage_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tools` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('CONTRACTS', 'REPORTS', 'POLICIES', 'PROCEDURES', 'TEMPLATES', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('PDF', 'DOC', 'DOCX', 'JPG', 'JPEG', 'PNG');

-- DropForeignKey
ALTER TABLE "public"."approvals" DROP CONSTRAINT "approvals_approverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."approvals" DROP CONSTRAINT "approvals_sampleApprovalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."boq_items" DROP CONSTRAINT "boq_items_boqId_fkey";

-- DropForeignKey
ALTER TABLE "public"."boqs" DROP CONSTRAINT "boqs_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deliveries" DROP CONSTRAINT "deliveries_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deliveries" DROP CONSTRAINT "deliveries_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."delivery_documents" DROP CONSTRAINT "delivery_documents_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory" DROP CONSTRAINT "inventory_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."market_survey_items" DROP CONSTRAINT "market_survey_items_marketSurveyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."market_survey_items" DROP CONSTRAINT "market_survey_items_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."market_surveys" DROP CONSTRAINT "market_surveys_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."parties" DROP CONSTRAINT "parties_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."procurement_items" DROP CONSTRAINT "procurement_items_procurementPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."procurement_items" DROP CONSTRAINT "procurement_items_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."procurement_plans" DROP CONSTRAINT "procurement_plans_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_suppliers" DROP CONSTRAINT "project_suppliers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_suppliers" DROP CONSTRAINT "project_suppliers_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchasing_plans" DROP CONSTRAINT "purchasing_plans_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."quote_items" DROP CONSTRAINT "quote_items_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."quotes" DROP CONSTRAINT "quotes_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sample_approvals" DROP CONSTRAINT "sample_approvals_procurementPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sample_approvals" DROP CONSTRAINT "sample_approvals_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sample_approvals" DROP CONSTRAINT "sample_approvals_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tool_usage_logs" DROP CONSTRAINT "tool_usage_logs_toolId_fkey";

-- AlterTable
ALTER TABLE "public"."inventory" DROP COLUMN "projectId";

-- DropTable
DROP TABLE "public"."approvals";

-- DropTable
DROP TABLE "public"."boq_items";

-- DropTable
DROP TABLE "public"."boqs";

-- DropTable
DROP TABLE "public"."deliveries";

-- DropTable
DROP TABLE "public"."delivery_documents";

-- DropTable
DROP TABLE "public"."market_survey_items";

-- DropTable
DROP TABLE "public"."market_surveys";

-- DropTable
DROP TABLE "public"."order_items";

-- DropTable
DROP TABLE "public"."orders";

-- DropTable
DROP TABLE "public"."parties";

-- DropTable
DROP TABLE "public"."procurement_items";

-- DropTable
DROP TABLE "public"."procurement_plans";

-- DropTable
DROP TABLE "public"."project_suppliers";

-- DropTable
DROP TABLE "public"."projects";

-- DropTable
DROP TABLE "public"."purchasing_plans";

-- DropTable
DROP TABLE "public"."quote_items";

-- DropTable
DROP TABLE "public"."quotes";

-- DropTable
DROP TABLE "public"."sample_approvals";

-- DropTable
DROP TABLE "public"."suppliers";

-- DropTable
DROP TABLE "public"."tool_usage_logs";

-- DropTable
DROP TABLE "public"."tools";

-- DropEnum
DROP TYPE "public"."ApprovalStatus";

-- DropEnum
DROP TYPE "public"."DeliveryStatus";

-- DropEnum
DROP TYPE "public"."MarketSurveyStatus";

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- DropEnum
DROP TYPE "public"."PartyType";

-- DropEnum
DROP TYPE "public"."ProcurementPlanStatus";

-- DropEnum
DROP TYPE "public"."ProjectStatus";

-- DropEnum
DROP TYPE "public"."PurchasingPlanStatus";

-- DropEnum
DROP TYPE "public"."QuoteStatus";

-- DropEnum
DROP TYPE "public"."ToolCondition";

-- CreateTable
CREATE TABLE "public"."office_documents" (
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
