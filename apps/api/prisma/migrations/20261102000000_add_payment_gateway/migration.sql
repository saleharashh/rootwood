-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentGateway" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentRefId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentTrackId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentCardPan" TEXT;
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trackId" TEXT,
    "refId" TEXT,
    "cardPan" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_trackId_idx" ON "PaymentTransaction"("trackId");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
