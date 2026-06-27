import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, FormStatus, Prisma } from '@prisma/client';
import { buildUniqueSlug, slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFormDto,
  UpdateFormDto,
  UpsertFormFieldDto,
  UpsertFormFieldsDto,
  UpsertFormStepsDto,
  UpsertFormThemeDto,
} from './forms.dto';

@Injectable()
export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  buildPublicUrl(slug: string) {
    const base = this.config.get<string>('publicFormBaseUrl') || 'https://forms.onlyflow.com.br';
    return `${base}/f/${slug}`;
  }

  private async ensureTenantProfile(tenantId: string) {
    await this.prisma.tenantProfile.upsert({
      where: { id: tenantId },
      create: { id: tenantId, name: `Tenant ${tenantId.slice(-6)}` },
      update: {},
    });
  }

  private async writeAudit(
    tenantId: string,
    action: AuditAction,
    actorId: string | undefined,
    formId: string | null,
    payload: Prisma.InputJsonValue = {}
  ) {
    await this.prisma.formAuditLog.create({
      data: {
        tenantId,
        formId,
        actorId,
        action,
        entityType: 'form',
        entityId: formId,
        payload,
      },
    });
  }

  async listByTenant(tenantId: string) {
    const forms = await this.prisma.form.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        layout: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { responses: { where: { deletedAt: null } }, views: true } },
      },
    });
    return forms.map((f) => ({
      ...f,
      publicUrl: this.buildPublicUrl(f.slug),
    }));
  }

  async listTriggerEligible(tenantId: string) {
    const forms = await this.prisma.form.findMany({
      where: {
        tenantId,
        status: FormStatus.published,
        deletedAt: null,
        fields: { some: { type: { in: ['whatsapp', 'phone'] } } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        fields: {
          where: { type: { notIn: ['hidden', 'utm_capture'] } },
          select: { id: true, type: true, label: true, orderIndex: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    });
    return forms;
  }

  async getById(tenantId: string, formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, tenantId, deletedAt: null },
      include: {
        theme: true,
        steps: { orderBy: { orderIndex: 'asc' } },
        fields: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { responses: { where: { deletedAt: null } }, views: true } },
      },
    });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return { ...form, publicUrl: this.buildPublicUrl(form.slug) };
  }

  async create(tenantId: string, dto: CreateFormDto, actorId: string) {
    await this.ensureTenantProfile(tenantId);
    const slug = await buildUniqueSlug(
      async (candidate) => Boolean(await this.prisma.form.findUnique({ where: { slug: candidate } })),
      dto.title,
      dto.slug
    );

    const form = await this.prisma.form.create({
      data: {
        tenantId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        slug,
        layout: dto.layout ?? 'single_page',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });

    await this.writeAudit(tenantId, AuditAction.create, actorId, form.id, { title: form.title });
    return { ...form, publicUrl: this.buildPublicUrl(form.slug) };
  }

  async update(tenantId: string, formId: string, dto: UpdateFormDto, actorId: string) {
    const current = await this.getById(tenantId, formId);
    let nextSlug: string | undefined;

    if (dto.slug != null) {
      const normalized = slugify(dto.slug);
      if (normalized !== current.slug) {
        const taken = await this.prisma.form.findFirst({
          where: { slug: normalized, id: { not: formId } },
          select: { id: true },
        });
        if (taken) {
          throw new BadRequestException('Este slug já está em uso. Escolha outro.');
        }
        nextSlug = normalized;
      }
    }

    const form = await this.prisma.form.update({
      where: { id: formId },
      data: {
        ...(dto.title != null ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.layout != null ? { layout: dto.layout } : {}),
        ...(dto.settings != null ? { settings: dto.settings as Prisma.InputJsonValue } : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        updatedBy: actorId,
      },
    });
    await this.writeAudit(tenantId, AuditAction.update, actorId, form.id);
    return this.getById(tenantId, formId);
  }

  async softDelete(tenantId: string, formId: string, actorId: string) {
    await this.getById(tenantId, formId);
    const form = await this.prisma.form.update({
      where: { id: formId },
      data: { deletedAt: new Date(), status: FormStatus.archived, updatedBy: actorId },
    });
    await this.writeAudit(tenantId, AuditAction.soft_delete, actorId, form.id);
    return { id: form.id, deletedAt: form.deletedAt };
  }

  async duplicate(tenantId: string, formId: string, actorId: string) {
    const source = await this.getById(tenantId, formId);
    const slug = await buildUniqueSlug(
      async (candidate) => Boolean(await this.prisma.form.findUnique({ where: { slug: candidate } })),
      `${source.title} copia`
    );

    const copy = await this.prisma.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: {
          tenantId,
          title: `${source.title} (cópia)`,
          description: source.description,
          slug,
          status: FormStatus.draft,
          layout: source.layout,
          settings: source.settings as Prisma.InputJsonValue,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      if (source.theme) {
        await tx.formTheme.create({
          data: {
            formId: form.id,
            logoUrl: source.theme.logoUrl,
            logoSource: source.theme.logoSource,
            bannerUrl: source.theme.bannerUrl,
            bannerSource: source.theme.bannerSource,
            headerVideoUrl: source.theme.headerVideoUrl,
            headerVideoSource: source.theme.headerVideoSource,
            primaryColor: source.theme.primaryColor,
            secondaryColor: source.theme.secondaryColor,
            backgroundColor: source.theme.backgroundColor,
            fontFamily: source.theme.fontFamily,
            mode: source.theme.mode,
            customCss: source.theme.customCss,
            layoutSettings: source.theme.layoutSettings as Prisma.InputJsonValue,
          },
        });
      }

      if (source.fields.length > 0) {
        await tx.formField.createMany({
          data: source.fields.map((field) => ({
            formId: form.id,
            type: field.type,
            label: field.label,
            description: field.description,
            required: field.required,
            orderIndex: field.orderIndex,
            config: field.config as Prisma.InputJsonValue,
            logic: field.logic as Prisma.InputJsonValue,
          })),
        });
      }

      return form;
    });

    await this.writeAudit(tenantId, AuditAction.duplicate, actorId, copy.id, { sourceId: formId });
    return this.getById(tenantId, copy.id);
  }

  async setStatus(
    tenantId: string,
    formId: string,
    status: FormStatus,
    actorId: string
  ) {
    await this.getById(tenantId, formId);
    if (status === FormStatus.published) {
      const fieldCount = await this.prisma.formField.count({ where: { formId } });
      if (fieldCount === 0) {
        throw new BadRequestException('Adicione pelo menos um campo antes de publicar.');
      }
    }

    const form = await this.prisma.form.update({
      where: { id: formId },
      data: {
        status,
        publishedAt: status === FormStatus.published ? new Date() : undefined,
        updatedBy: actorId,
      },
    });

    const actionMap: Partial<Record<FormStatus, AuditAction>> = {
      [FormStatus.published]: AuditAction.publish,
      [FormStatus.unpublished]: AuditAction.unpublish,
      [FormStatus.archived]: AuditAction.archive,
      [FormStatus.draft]: AuditAction.restore,
    };
    const action = actionMap[status] ?? AuditAction.update;
    await this.writeAudit(tenantId, action, actorId, form.id, { status });

    return this.getById(tenantId, formId);
  }

  async upsertFields(
    tenantId: string,
    formId: string,
    dto: UpsertFormFieldsDto,
    actorId: string
  ) {
    await this.getById(tenantId, formId);

    const existing = await this.prisma.formField.findMany({
      where: { formId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((f) => f.id));
    const keptIds = new Set<string>();

    await this.prisma.$transaction(async (tx) => {
      for (const field of dto.fields) {
        const data = {
          stepId: field.stepId || null,
          type: field.type,
          label: field.label.trim(),
          description: field.description?.trim() || null,
          required: field.required ?? false,
          orderIndex: field.orderIndex,
          config: (field.config ?? {}) as Prisma.InputJsonValue,
          logic: (field.logic ?? {}) as Prisma.InputJsonValue,
        };

        const canUpdate =
          field.id &&
          !field.id.startsWith('temp-') &&
          existingIds.has(field.id);

        if (canUpdate) {
          await tx.formField.update({
            where: { id: field.id },
            data,
          });
          keptIds.add(field.id!);
        } else {
          const created = await tx.formField.create({
            data: { formId, ...data },
          });
          keptIds.add(created.id);
        }
      }

      const removeIds = existing.filter((f) => !keptIds.has(f.id)).map((f) => f.id);
      if (removeIds.length > 0) {
        await tx.formField.deleteMany({ where: { id: { in: removeIds } } });
      }

      await tx.form.update({
        where: { id: formId },
        data: { updatedBy: actorId },
      });
    });

    await this.writeAudit(tenantId, AuditAction.update, actorId, formId, { fields: dto.fields.length });
    return this.getById(tenantId, formId);
  }

  async upsertSteps(
    tenantId: string,
    formId: string,
    dto: UpsertFormStepsDto,
    actorId: string
  ) {
    await this.getById(tenantId, formId);

    const existing = await this.prisma.formStep.findMany({
      where: { formId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((s) => s.id));
    const keptIds = new Set<string>();

    await this.prisma.$transaction(async (tx) => {
      for (const step of dto.steps) {
        const data = {
          title: step.title?.trim() || null,
          description: step.description?.trim() || null,
          orderIndex: step.orderIndex,
        };

        const canUpdate =
          step.id &&
          !step.id.startsWith('temp-') &&
          existingIds.has(step.id);

        if (canUpdate) {
          await tx.formStep.update({
            where: { id: step.id },
            data,
          });
          keptIds.add(step.id!);
        } else {
          const created = await tx.formStep.create({
            data: { formId, ...data },
          });
          keptIds.add(created.id);
        }
      }

      const removeIds = existing.filter((s) => !keptIds.has(s.id)).map((s) => s.id);
      if (removeIds.length > 0) {
        await tx.formField.updateMany({
          where: { stepId: { in: removeIds } },
          data: { stepId: null },
        });
        await tx.formStep.deleteMany({ where: { id: { in: removeIds } } });
      }

      await tx.form.update({
        where: { id: formId },
        data: { updatedBy: actorId },
      });
    });

    await this.writeAudit(tenantId, AuditAction.update, actorId, formId, { steps: dto.steps.length });
    return this.getById(tenantId, formId);
  }

  async upsertTheme(tenantId: string, formId: string, dto: UpsertFormThemeDto, actorId: string) {
    await this.getById(tenantId, formId);

    const data = {
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.logoSource != null ? { logoSource: dto.logoSource } : {}),
      ...(dto.bannerUrl !== undefined ? { bannerUrl: dto.bannerUrl } : {}),
      ...(dto.bannerSource != null ? { bannerSource: dto.bannerSource } : {}),
      ...(dto.headerVideoUrl !== undefined ? { headerVideoUrl: dto.headerVideoUrl } : {}),
      ...(dto.headerVideoSource != null ? { headerVideoSource: dto.headerVideoSource } : {}),
      ...(dto.primaryColor !== undefined ? { primaryColor: dto.primaryColor } : {}),
      ...(dto.secondaryColor !== undefined ? { secondaryColor: dto.secondaryColor } : {}),
      ...(dto.backgroundColor !== undefined ? { backgroundColor: dto.backgroundColor } : {}),
      ...(dto.fontFamily !== undefined ? { fontFamily: dto.fontFamily } : {}),
      ...(dto.mode != null ? { mode: dto.mode } : {}),
      ...(dto.customCss !== undefined ? { customCss: dto.customCss } : {}),
      ...(dto.layoutSettings != null
        ? { layoutSettings: dto.layoutSettings as Prisma.InputJsonValue }
        : {}),
    };

    await this.prisma.formTheme.upsert({
      where: { formId },
      create: { formId, ...data },
      update: data,
    });

    await this.prisma.form.update({
      where: { id: formId },
      data: { updatedBy: actorId },
    });

    await this.writeAudit(tenantId, AuditAction.update, actorId, formId, { theme: true });
    return this.getById(tenantId, formId);
  }
}
