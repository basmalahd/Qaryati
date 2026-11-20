-- ContentVersion.id had no default, so every createPending() insert failed.
CREATE SEQUENCE "ContentVersion_id_seq" AS BIGINT OWNED BY "ContentVersion"."id";
ALTER TABLE "ContentVersion" ALTER COLUMN "id" SET DEFAULT nextval('"ContentVersion_id_seq"');

-- Performance indexes (foreign keys, filters, ordering).
CREATE INDEX "Village_governorate_id_idx" ON "Village"("governorate_id");
CREATE INDEX "Village_verification_status_deleted_at_idx" ON "Village"("verification_status", "deleted_at");
CREATE INDEX "Village_current_name_ar_idx" ON "Village"("current_name_ar");
CREATE INDEX "VillageName_village_id_idx" ON "VillageName"("village_id");
CREATE INDEX "VillageName_name_idx" ON "VillageName"("name");
CREATE INDEX "VillageRelation_nearby_village_id_idx" ON "VillageRelation"("nearby_village_id");
CREATE INDEX "PopulationRecord_village_id_reference_date_idx" ON "PopulationRecord"("village_id", "reference_date");
CREATE INDEX "PopulationRecord_source_id_idx" ON "PopulationRecord"("source_id");
CREATE INDEX "HistoricalEvent_village_id_idx" ON "HistoricalEvent"("village_id");
CREATE INDEX "Landmark_village_id_idx" ON "Landmark"("village_id");
CREATE INDEX "HeritageItem_village_id_idx" ON "HeritageItem"("village_id");
CREATE INDEX "AgricultureItem_village_id_idx" ON "AgricultureItem"("village_id");
CREATE INDEX "EconomicActivity_village_id_idx" ON "EconomicActivity"("village_id");
CREATE INDEX "PublicFacility_village_id_idx" ON "PublicFacility"("village_id");
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");
CREATE INDEX "ContentVersion_status_entity_type_idx" ON "ContentVersion"("status", "entity_type");
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
