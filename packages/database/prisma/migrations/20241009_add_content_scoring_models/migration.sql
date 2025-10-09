-- CreateTable
CREATE TABLE "content_scores" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "timeliness_score" DOUBLE PRECISION NOT NULL,
    "authority_score" DOUBLE PRECISION NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "ai_importance_score" DOUBLE PRECISION NOT NULL,
    "engagement_score" DOUBLE PRECISION NOT NULL,
    "weight_config_id" TEXT,
    "explanation" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_weights" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "timeliness" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "authority" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "ai_importance" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "engagement" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_configs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "weight_config_a_id" TEXT NOT NULL,
    "weight_config_b_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "winner_config_id" TEXT,
    "metrics_a" JSONB,
    "metrics_b" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_scores_content_id_key" ON "content_scores"("content_id");

-- CreateIndex
CREATE INDEX "content_scores_content_id_idx" ON "content_scores"("content_id");

-- CreateIndex
CREATE INDEX "content_scores_total_score_idx" ON "content_scores"("total_score");

-- CreateIndex
CREATE INDEX "content_scores_calculated_at_idx" ON "content_scores"("calculated_at");

-- CreateIndex
CREATE INDEX "ab_test_configs_status_idx" ON "ab_test_configs"("status");

-- AddForeignKey
ALTER TABLE "content_scores" ADD CONSTRAINT "content_scores_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

