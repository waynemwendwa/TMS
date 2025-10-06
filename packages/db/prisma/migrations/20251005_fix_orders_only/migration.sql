-- Minimal production-safe migration to create only missing Orders-related objects
-- Guards against objects that may already exist in production

-- Enums (guarded)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "public"."OrderStatus" AS ENUM (
      'PENDING_PROCUREMENT','PENDING_CHAIRMAN','APPROVED','REJECTED','SOURCING','SOURCED','IN_PROGRESS','COMPLETED','CANCELLED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING','IN_TRANSIT','DELIVERED','RECEIVED','VERIFIED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
    CREATE TYPE "public"."QuoteStatus" AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','ACCEPTED','REJECTED','EXPIRED');
  END IF;
END $$;

-- Tables (IF NOT EXISTS) - core Orders
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

-- Items
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

-- Suppliers
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

-- Deliveries
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

-- Quotes
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

-- Unique index on orders.orderNumber (guarded)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "public"."orders" ("orderNumber");
EXCEPTION WHEN others THEN NULL; END $$;

-- Foreign keys (guarded against duplicates)
DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE NO ACTION;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventory"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_procApprovedBy_fkey" FOREIGN KEY ("procurementApprovedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_chairmanApprovedBy_fkey" FOREIGN KEY ("chairmanApprovedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_procSourcedBy_fkey" FOREIGN KEY ("procurementSourcedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."order_items"
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."deliveries"
    ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."deliveries"
    ADD CONSTRAINT "deliveries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."delivery_documents"
    ADD CONSTRAINT "delivery_documents_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."quotes"
    ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."quote_items"
    ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;


