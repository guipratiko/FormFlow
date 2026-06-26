-- FormFlow initial schema
CREATE SCHEMA IF NOT EXISTS "form_flow";

CREATE TYPE "form_flow"."MemberRole" AS ENUM ('admin', 'manager', 'operator', 'viewer');
CREATE TYPE "form_flow"."FormStatus" AS ENUM ('draft', 'published', 'unpublished', 'archived');
CREATE TYPE "form_flow"."FormLayout" AS ENUM ('single_page', 'wizard', 'multi_step');
CREATE TYPE "form_flow"."FormFieldType" AS ENUM (
  'short_text', 'long_text', 'email', 'phone', 'number', 'url', 'password',
  'radio', 'checkbox', 'select', 'multi_select',
  'date', 'time', 'datetime',
  'file', 'image', 'document',
  'nps', 'stars', 'scale', 'signature', 'terms_acceptance'
);
CREATE TYPE "form_flow"."AuditAction" AS ENUM (
  'create', 'update', 'publish', 'unpublish', 'archive', 'restore', 'soft_delete', 'duplicate'
);

CREATE TABLE "form_flow"."tenant_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."tenant_members" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "form_flow"."MemberRole" NOT NULL DEFAULT 'viewer',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."forms" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "form_flow"."FormStatus" NOT NULL DEFAULT 'draft',
  "layout" "form_flow"."FormLayout" NOT NULL DEFAULT 'single_page',
  "settings" JSONB NOT NULL DEFAULT '{}',
  "published_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_steps" (
  "id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "order_index" INTEGER NOT NULL,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "form_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_fields" (
  "id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "step_id" TEXT,
  "type" "form_flow"."FormFieldType" NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "order_index" INTEGER NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "logic" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_themes" (
  "id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "logo_url" TEXT,
  "banner_url" TEXT,
  "primary_color" TEXT,
  "secondary_color" TEXT,
  "background_color" TEXT,
  "font_family" TEXT,
  "mode" TEXT NOT NULL DEFAULT 'light',
  "custom_css" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "form_themes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_responses" (
  "id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "session_id" TEXT,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "device" TEXT,
  "referrer" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_content" TEXT,
  "utm_term" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_response_answers" (
  "id" TEXT NOT NULL,
  "response_id" TEXT NOT NULL,
  "field_id" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_response_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_views" (
  "id" TEXT NOT NULL,
  "form_id" TEXT NOT NULL,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "session_id" TEXT,
  "ip_address" TEXT,
  "referrer" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  CONSTRAINT "form_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_flow"."form_audit_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "form_id" TEXT,
  "actor_id" TEXT,
  "action" "form_flow"."AuditAction" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_members_tenant_id_user_id_key" ON "form_flow"."tenant_members"("tenant_id", "user_id");
CREATE INDEX "tenant_members_tenant_id_idx" ON "form_flow"."tenant_members"("tenant_id");
CREATE INDEX "tenant_members_user_id_idx" ON "form_flow"."tenant_members"("user_id");

CREATE UNIQUE INDEX "forms_slug_key" ON "form_flow"."forms"("slug");
CREATE INDEX "forms_tenant_id_idx" ON "form_flow"."forms"("tenant_id");
CREATE INDEX "forms_tenant_id_status_idx" ON "form_flow"."forms"("tenant_id", "status");
CREATE INDEX "forms_tenant_id_deleted_at_idx" ON "form_flow"."forms"("tenant_id", "deleted_at");

CREATE UNIQUE INDEX "form_steps_form_id_order_index_key" ON "form_flow"."form_steps"("form_id", "order_index");
CREATE INDEX "form_steps_form_id_idx" ON "form_flow"."form_steps"("form_id");

CREATE INDEX "form_fields_form_id_idx" ON "form_flow"."form_fields"("form_id");
CREATE INDEX "form_fields_form_id_order_index_idx" ON "form_flow"."form_fields"("form_id", "order_index");
CREATE INDEX "form_fields_step_id_idx" ON "form_flow"."form_fields"("step_id");

CREATE UNIQUE INDEX "form_themes_form_id_key" ON "form_flow"."form_themes"("form_id");

CREATE INDEX "form_responses_form_id_idx" ON "form_flow"."form_responses"("form_id");
CREATE INDEX "form_responses_form_id_submitted_at_idx" ON "form_flow"."form_responses"("form_id", "submitted_at");
CREATE INDEX "form_responses_session_id_idx" ON "form_flow"."form_responses"("session_id");

CREATE UNIQUE INDEX "form_response_answers_response_id_field_id_key" ON "form_flow"."form_response_answers"("response_id", "field_id");
CREATE INDEX "form_response_answers_response_id_idx" ON "form_flow"."form_response_answers"("response_id");
CREATE INDEX "form_response_answers_field_id_idx" ON "form_flow"."form_response_answers"("field_id");

CREATE INDEX "form_views_form_id_idx" ON "form_flow"."form_views"("form_id");
CREATE INDEX "form_views_form_id_viewed_at_idx" ON "form_flow"."form_views"("form_id", "viewed_at");

CREATE INDEX "form_audit_logs_tenant_id_idx" ON "form_flow"."form_audit_logs"("tenant_id");
CREATE INDEX "form_audit_logs_form_id_idx" ON "form_flow"."form_audit_logs"("form_id");
CREATE INDEX "form_audit_logs_tenant_id_created_at_idx" ON "form_flow"."form_audit_logs"("tenant_id", "created_at");

ALTER TABLE "form_flow"."tenant_members"
  ADD CONSTRAINT "tenant_members_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "form_flow"."tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."forms"
  ADD CONSTRAINT "forms_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "form_flow"."tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_steps"
  ADD CONSTRAINT "form_steps_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_fields"
  ADD CONSTRAINT "form_fields_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_fields"
  ADD CONSTRAINT "form_fields_step_id_fkey"
  FOREIGN KEY ("step_id") REFERENCES "form_flow"."form_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_themes"
  ADD CONSTRAINT "form_themes_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_responses"
  ADD CONSTRAINT "form_responses_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_response_answers"
  ADD CONSTRAINT "form_response_answers_response_id_fkey"
  FOREIGN KEY ("response_id") REFERENCES "form_flow"."form_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_response_answers"
  ADD CONSTRAINT "form_response_answers_field_id_fkey"
  FOREIGN KEY ("field_id") REFERENCES "form_flow"."form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_views"
  ADD CONSTRAINT "form_views_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_audit_logs"
  ADD CONSTRAINT "form_audit_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "form_flow"."tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_flow"."form_audit_logs"
  ADD CONSTRAINT "form_audit_logs_form_id_fkey"
  FOREIGN KEY ("form_id") REFERENCES "form_flow"."forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
