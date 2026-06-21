-- CreateTable
CREATE TABLE "Disease" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DiseaseMetric" (
    "key" TEXT NOT NULL,
    "diseaseKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "durationSec" INTEGER,
    "multiplier" INTEGER,
    "alertMin" INTEGER,
    "alertMax" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiseaseMetric_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DogDisease" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "diseaseKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DogDisease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementSession" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasurementSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DogDisease_dogId_diseaseKey_key" ON "DogDisease"("dogId", "diseaseKey");

-- AddForeignKey
ALTER TABLE "DiseaseMetric" ADD CONSTRAINT "DiseaseMetric_diseaseKey_fkey" FOREIGN KEY ("diseaseKey") REFERENCES "Disease"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DogDisease" ADD CONSTRAINT "DogDisease_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DogDisease" ADD CONSTRAINT "DogDisease_diseaseKey_fkey" FOREIGN KEY ("diseaseKey") REFERENCES "Disease"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementSession" ADD CONSTRAINT "MeasurementSession_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
