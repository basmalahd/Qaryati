CREATE TYPE "HeritageType" AS ENUM ('CRAFT', 'FOOD', 'AGRICULTURAL_PRACTICE', 'TRADITION', 'OTHER');

-- CreateEnum
CREATE TYPE "EconomicActivityType" AS ENUM ('CRAFT', 'INDUSTRY', 'TRADE', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicFacilityType" AS ENUM ('SCHOOL', 'CLINIC', 'LIBRARY', 'COMMUNITY_CENTER', 'PARK', 'SPORTS_FACILITY');

-- CreateEnum
CREATE TYPE "LandmarkType" AS ENUM (
    'ARCHAEOLOGICAL_SITE',
    'TRADITIONAL_BUILDING',
    'SPRING',
    'RELIGIOUS_SITE',
    'VIEWPOINT',
    'OTHER'
);

-- CreateTable
CREATE TABLE "Governorate" (
    "id" BIGSERIAL NOT NULL,
    "name_ar" VARCHAR(150) NOT NULL,
    "name_en" VARCHAR(150),

    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Village" (
    "id" BIGSERIAL NOT NULL,
    "current_name_ar" VARCHAR(150) NOT NULL,
    "current_name_en" VARCHAR(150),
    "name_origin" TEXT,
    "location_description" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "elevation" DECIMAL(8,2),
    "land_area" DECIMAL(12,2),
    "historical_overview" TEXT,
    "governorate_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillageName" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "name_type" VARCHAR(50) NOT NULL,
    "village_id" BIGINT NOT NULL,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "VillageName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillageRelation" (
    "village_id" BIGINT NOT NULL,
    "nearby_village_id" BIGINT NOT NULL,

    CONSTRAINT "VillageRelation_pkey" PRIMARY KEY ("village_id","nearby_village_id")
);

-- CreateTable
CREATE TABLE "PopulationRecord" (
    "id" BIGSERIAL NOT NULL,
    "population_value" BIGINT NOT NULL,
    "reference_date" DATE NOT NULL,
    "reference_precision" VARCHAR(10) NOT NULL DEFAULT 'YEAR',
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT NOT NULL,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "PopulationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalEvent" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "event_date" DATE,
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT NOT NULL,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "HistoricalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Landmark" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "LandmarkType" NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "Landmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeritageItem" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "HeritageType" NOT NULL,
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "HeritageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgricultureItem" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "AgricultureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicActivity" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "EconomicActivityType" NOT NULL,
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "EconomicActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "publisher" VARCHAR(200),
    "url" VARCHAR(1000),
    "publication_date" DATE,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaced_by_token_id" BIGINT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" BIGINT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "data_snapshot" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "submitted_by" BIGINT NOT NULL,
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMP(6),
    "rejection_reason" TEXT,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicFacility" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "PublicFacilityType" NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "village_id" BIGINT NOT NULL,
    "source_id" BIGINT,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" BIGINT,

    CONSTRAINT "PublicFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_name_ar_key" ON "Governorate"("name_ar");

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_name_en_key" ON "Governorate"("name_en");

-- CreateIndex
CREATE UNIQUE INDEX "VillageName_village_id_name_language_key" ON "VillageName"("village_id", "name", "language");

-- CreateIndex
CREATE UNIQUE INDEX "PopulationRecord_village_id_reference_date_source_id_key" ON "PopulationRecord"("village_id", "reference_date", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_entity_type_entity_id_version_number_key" ON "ContentVersion"("entity_type", "entity_id", "version_number");

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillageName" ADD CONSTRAINT "VillageName_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillageName" ADD CONSTRAINT "VillageName_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillageRelation" ADD CONSTRAINT "VillageRelation_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillageRelation" ADD CONSTRAINT "VillageRelation_nearby_village_id_fkey" FOREIGN KEY ("nearby_village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeritageItem" ADD CONSTRAINT "HeritageItem_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeritageItem" ADD CONSTRAINT "HeritageItem_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeritageItem" ADD CONSTRAINT "HeritageItem_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgricultureItem" ADD CONSTRAINT "AgricultureItem_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgricultureItem" ADD CONSTRAINT "AgricultureItem_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgricultureItem" ADD CONSTRAINT "AgricultureItem_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicActivity" ADD CONSTRAINT "EconomicActivity_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicActivity" ADD CONSTRAINT "EconomicActivity_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicActivity" ADD CONSTRAINT "EconomicActivity_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==============================================
-- Additional constraints from audited Qaryati decisions
-- Landmark.type is enforced by the LandmarkType enum defined above.
-- For YEAR/MONTH reference_precision, canonical date normalization remains
-- a service/validation rule per the decision register.
-- ==============================================
ALTER TABLE "Village" ADD CONSTRAINT "Village_latitude_range_check" CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "Village" ADD CONSTRAINT "Village_longitude_range_check" CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_latitude_range_check" CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_longitude_range_check" CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_latitude_range_check" CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_longitude_range_check" CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "Village" ADD CONSTRAINT "Village_land_area_nonnegative_check" CHECK ("land_area" >= 0);
ALTER TABLE "Village" ADD CONSTRAINT "Village_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "HeritageItem" ADD CONSTRAINT "HeritageItem_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "AgricultureItem" ADD CONSTRAINT "AgricultureItem_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "EconomicActivity" ADD CONSTRAINT "EconomicActivity_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "PublicFacility" ADD CONSTRAINT "PublicFacility_verification_status_check" CHECK ("verification_status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "VillageName" ADD CONSTRAINT "VillageName_language_check" CHECK ("language" IN ('ar', 'en'));
ALTER TABLE "VillageName" ADD CONSTRAINT "VillageName_name_type_check" CHECK ("name_type" IN ('ALTERNATIVE', 'TRANSLITERATION', 'FORMER', 'HISTORICAL'));
ALTER TABLE "VillageRelation" ADD CONSTRAINT "VillageRelation_canonical_order_check" CHECK ("village_id" < "nearby_village_id");
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_positive_value_check" CHECK ("population_value" > 0);
ALTER TABLE "PopulationRecord" ADD CONSTRAINT "PopulationRecord_precision_check" CHECK ("reference_precision" IN ('YEAR', 'MONTH', 'DAY'));
ALTER TABLE "Source" ADD CONSTRAINT "Source_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));
ALTER TABLE "Role" ADD CONSTRAINT "Role_name_check" CHECK ("name" IN ('ADMIN', 'EDITOR', 'VERIFIER'));
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_action_check" CHECK ("action" IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'VERIFY', 'REJECT', 'ARCHIVE', 'REACTIVATE', 'DEACTIVATE'));
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_entity_type_check" CHECK ("entity_type" IN ('Village', 'PopulationRecord', 'HistoricalEvent', 'Landmark', 'HeritageItem', 'AgricultureItem', 'EconomicActivity', 'PublicFacility'));
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_version_positive_check" CHECK ("version_number" > 0);
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_snapshot_object_check" CHECK (jsonb_typeof("data_snapshot") = 'object');
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_status_check" CHECK ("status" IN ('PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_distinct_reviewer_check" CHECK ("reviewed_by" IS NULL OR "reviewed_by" <> "submitted_by");
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_review_fields_check" CHECK (("status" = 'PENDING' AND "reviewed_by" IS NULL AND "reviewed_at" IS NULL) OR ("status" IN ('VERIFIED', 'REJECTED') AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL));
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_rejection_reason_check" CHECK ("status" <> 'REJECTED' OR ("rejection_reason" IS NOT NULL AND btrim("rejection_reason") <> ''));
CREATE UNIQUE INDEX "ContentVersion_one_pending_per_entity_key" ON "ContentVersion" ("entity_type", "entity_id") WHERE "status" = 'PENDING';