-- CreateTable
CREATE TABLE "FeedAnalysis" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "nutrients" JSONB NOT NULL,
    "cautions" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedAnalysis" ADD CONSTRAINT "FeedAnalysis_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
