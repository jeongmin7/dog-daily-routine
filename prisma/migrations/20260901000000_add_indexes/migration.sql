-- 외래키는 Postgres가 자동 인덱싱하지 않는다. 조회 경로(where/orderBy)에 맞춰 직접 생성.
-- DogDisease([dogId, diseaseKey])와 MedicationDose([medicationId, date, time])는
-- 기존 @@unique 제약이 만든 인덱스가 같은 선두 컬럼을 커버하므로 추가하지 않는다.

-- CreateIndex
CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");

-- CreateIndex
CREATE INDEX "Dog_userId_idx" ON "Dog"("userId");

-- CreateIndex
CREATE INDEX "DiseaseMetric_diseaseKey_idx" ON "DiseaseMetric"("diseaseKey");

-- CreateIndex
CREATE INDEX "MeasurementSession_dogId_metricKey_measuredAt_idx" ON "MeasurementSession"("dogId", "metricKey", "measuredAt");

-- CreateIndex
CREATE INDEX "Medication_dogId_createdAt_idx" ON "Medication"("dogId", "createdAt");

-- CreateIndex
CREATE INDEX "Photo_dogId_createdAt_idx" ON "Photo"("dogId", "createdAt");

-- CreateIndex
CREATE INDEX "DogRecord_dogId_date_idx" ON "DogRecord"("dogId", "date");

-- CreateIndex
CREATE INDEX "FeedAnalysis_dogId_createdAt_idx" ON "FeedAnalysis"("dogId", "createdAt");
