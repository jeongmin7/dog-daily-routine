-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "times" TEXT[],
    "remainingCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDose" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationDose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicationDose_medicationId_date_time_key" ON "MedicationDose"("medicationId", "date", "time");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDose" ADD CONSTRAINT "MedicationDose_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
