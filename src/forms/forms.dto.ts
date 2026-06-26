import { FormFieldType, FormLayout } from '@prisma/client';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FormLayout)
  layout?: FormLayout;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateFormDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FormLayout)
  layout?: FormLayout;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}

export class UpsertFormFieldDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(FormFieldType)
  type!: FormFieldType;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsInt()
  orderIndex!: number;

  @IsOptional()
  @IsString()
  stepId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  logic?: Record<string, unknown>;
}

export class UpsertFormFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertFormFieldDto)
  fields!: UpsertFormFieldDto[];
}

export class UpsertFormStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  orderIndex!: number;
}

export class UpsertFormStepsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertFormStepDto)
  steps!: UpsertFormStepDto[];
}

export class UpsertFormThemeDto {
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  logoSource?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string | null;

  @IsOptional()
  @IsString()
  bannerSource?: string;

  @IsOptional()
  @IsString()
  headerVideoUrl?: string | null;

  @IsOptional()
  @IsString()
  headerVideoSource?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string | null;

  @IsOptional()
  @IsString()
  secondaryColor?: string | null;

  @IsOptional()
  @IsString()
  backgroundColor?: string | null;

  @IsOptional()
  @IsString()
  fontFamily?: string | null;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  customCss?: string | null;

  @IsOptional()
  @IsObject()
  layoutSettings?: Record<string, unknown>;
}

export class SubmitAnswerDto {
  @IsString()
  fieldId!: string;

  @Allow()
  value!: unknown;
}

export class SubmitFormResponseDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
