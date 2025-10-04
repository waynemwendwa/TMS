-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PROCUREMENT', 'PENDING_CHAIRMAN', 'APPROVED', 'REJECTED', 'SOURCING', 'SOURCED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PROCUREMENT',
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
CREATE TABLE "order_items" (
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
CREATE TABLE "suppliers" (
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
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierId" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_documents" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "validUntil" TIMESTAMP(3),
    "totalAmount" DECIMAL(15,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2),
    "totalPrice" DECIMAL(15,2),
    "remarks" TEXT,
    "quoteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryNumber_key" ON "deliveries"("deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_procurementApprovedBy_fkey" FOREIGN KEY ("procurementApprovedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_chairmanApprovedBy_fkey" FOREIGN KEY ("chairmanApprovedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_procurementSourcedBy_fkey" FOREIGN KEY ("procurementSourcedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_documents" ADD CONSTRAINT "delivery_documents_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
