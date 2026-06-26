-- Novos tipos de campo
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'currency';
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'cpf';
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'cnpj';
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'cpf_cnpj';
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'video';

-- Tema: layout, fontes de mídia, vídeo de capa
ALTER TABLE "form_flow"."form_themes"
  ADD COLUMN IF NOT EXISTS "logo_source" TEXT NOT NULL DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS "banner_source" TEXT NOT NULL DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS "header_video_url" TEXT,
  ADD COLUMN IF NOT EXISTS "header_video_source" TEXT NOT NULL DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS "layout_settings" JSONB NOT NULL DEFAULT '{}';
