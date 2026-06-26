import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormStatus, Prisma } from '@prisma/client';
import { dispatchFormFlowAutomations } from '../automation/automation.runner';
import { validateFieldAnswer } from '../common/field-validators';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitFormResponseDto } from '../forms/forms.dto';

@Injectable()
export class PublicFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private isEmptyAnswer(type: string, value: unknown): boolean {
    if (value == null || value === '') return true;
    if (type === 'checkbox' || type === 'terms_acceptance') return value !== true;
    if (type === 'address') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return true;
      const addr = value as Record<string, unknown>;
      const required = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
      return required.some((key) => !String(addr[key] ?? '').trim());
    }
    return false;
  }

  async getPublishedFormBySlug(slug: string) {
    const form = await this.prisma.form.findFirst({
      where: {
        slug,
        status: FormStatus.published,
        deletedAt: null,
      },
      include: {
        theme: true,
        steps: { orderBy: { orderIndex: 'asc' } },
        fields: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado ou não publicado.');
    }

    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      description: form.description,
      layout: form.layout,
      settings: form.settings,
      theme: form.theme,
      steps: form.steps,
      fields: form.fields.map((field) => ({
        id: field.id,
        stepId: field.stepId,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        orderIndex: field.orderIndex,
        config: field.config,
        logic: field.logic,
      })),
    };
  }

  async recordView(slug: string, meta: Record<string, unknown> = {}) {
    const form = await this.prisma.form.findFirst({
      where: { slug, status: FormStatus.published, deletedAt: null },
      select: { id: true },
    });
    if (!form) return { recorded: false };

    await this.prisma.formView.create({
      data: {
        formId: form.id,
        sessionId: typeof meta.sessionId === 'string' ? meta.sessionId : null,
        ipAddress: typeof meta.ipAddress === 'string' ? meta.ipAddress : null,
        referrer: typeof meta.referrer === 'string' ? meta.referrer : null,
        utmSource: typeof meta.utmSource === 'string' ? meta.utmSource : null,
        utmMedium: typeof meta.utmMedium === 'string' ? meta.utmMedium : null,
        utmCampaign: typeof meta.utmCampaign === 'string' ? meta.utmCampaign : null,
      },
    });

    return { recorded: true };
  }

  async submitResponse(slug: string, dto: SubmitFormResponseDto, meta: Record<string, unknown>) {
    const form = await this.prisma.form.findFirst({
      where: { slug, status: FormStatus.published, deletedAt: null },
      include: { fields: true },
    });
    if (!form) throw new NotFoundException('Formulário não encontrado ou não publicado.');

    const fieldMap = new Map(form.fields.map((f) => [f.id, f]));

    for (const field of form.fields) {
      if (field.type === 'hidden' || field.type === 'utm_capture') continue;
      if (!field.required) continue;
      const answer = dto.answers.find((a) => a.fieldId === field.id);
      if (!answer || this.isEmptyAnswer(field.type, answer.value)) {
        throw new BadRequestException(`Campo obrigatório: ${field.label}`);
      }
    }

    for (const answer of dto.answers) {
      const field = fieldMap.get(answer.fieldId);
      if (!field) {
        throw new BadRequestException(
          `Campo inválido ou desatualizado (${answer.fieldId}). Recarregue a página e tente novamente.`
        );
      }
      if (answer.value != null && answer.value !== '' && answer.value !== false) {
        const config = (field.config as Record<string, unknown>) || {};
        const validationError = validateFieldAnswer(field.type, answer.value, config);
        if (validationError) {
          throw new BadRequestException(`${field.label}: ${validationError}`);
        }
      }
    }

    const response = await this.prisma.formResponse.create({
      data: {
        formId: form.id,
        sessionId: dto.sessionId || (typeof meta.sessionId === 'string' ? meta.sessionId : null),
        ipAddress: typeof meta.ipAddress === 'string' ? meta.ipAddress : null,
        userAgent: typeof meta.userAgent === 'string' ? meta.userAgent : null,
        browser: typeof meta.browser === 'string' ? meta.browser : null,
        os: typeof meta.os === 'string' ? meta.os : null,
        device: typeof meta.device === 'string' ? meta.device : null,
        referrer: typeof meta.referrer === 'string' ? meta.referrer : null,
        utmSource: typeof meta.utmSource === 'string' ? meta.utmSource : null,
        utmMedium: typeof meta.utmMedium === 'string' ? meta.utmMedium : null,
        utmCampaign: typeof meta.utmCampaign === 'string' ? meta.utmCampaign : null,
        utmContent: typeof meta.utmContent === 'string' ? meta.utmContent : null,
        utmTerm: typeof meta.utmTerm === 'string' ? meta.utmTerm : null,
        metadata: (dto.metadata ?? meta) as Prisma.InputJsonValue,
        answers: {
          create: dto.answers.map((a) => ({
            fieldId: a.fieldId,
            value: a.value as Prisma.InputJsonValue,
          })),
        },
      },
      select: { id: true, submittedAt: true },
    });

    const settings = (form.settings as Record<string, unknown>) || {};
    const automation = settings.automation as Record<string, unknown> | undefined;

    void dispatchFormFlowAutomations(this.config, {
      tenantId: form.tenantId,
      formId: form.id,
      formTitle: form.title,
      responseId: response.id,
      fields: form.fields.map((f) => ({ id: f.id, type: f.type, label: f.label })),
      answers: dto.answers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
      automation,
    });

    return { success: true, responseId: response.id, submittedAt: response.submittedAt };
  }
}
