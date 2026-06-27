-- Novos tipos de campo: texto informativo e bloco com botões
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'statement';
ALTER TYPE "form_flow"."FormFieldType" ADD VALUE IF NOT EXISTS 'content_block';
