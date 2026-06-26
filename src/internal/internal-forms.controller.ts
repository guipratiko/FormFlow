import { Controller, Get, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@Controller('internal/forms')
export class InternalFormsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private assertInternalKey(headers: Record<string, string | string[] | undefined>) {
    const expected = this.config.get<string>('onlyflowInternalKey') || '';
    const provided = String(headers['x-onlyflow-internal-key'] || '').trim();
    if (!expected || provided !== expected) {
      throw new UnauthorizedException('Chave interna inválida');
    }
  }

  /** Formulários publicados com campo WhatsApp ou telefone (elegíveis para gatilho ManyFlow). */
  @Public()
  @Get(':tenantId/trigger-eligible')
  async listTriggerEligible(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('tenantId') tenantId: string
  ) {
    this.assertInternalKey(headers);
    const forms = await this.prisma.form.findMany({
      where: {
        tenantId,
        status: FormStatus.published,
        deletedAt: null,
        fields: {
          some: { type: { in: ['whatsapp', 'phone'] } },
        },
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
    return { status: 'success', data: forms };
  }

  @Public()
  @Get(':formId/fields')
  async getFormFields(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('formId') formId: string
  ) {
    this.assertInternalKey(headers);
    const form = await this.prisma.form.findFirst({
      where: { id: formId, status: FormStatus.published, deletedAt: null },
      select: {
        id: true,
        title: true,
        tenantId: true,
        fields: {
          where: { type: { notIn: ['hidden', 'utm_capture'] } },
          select: { id: true, type: true, label: true, orderIndex: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!form) {
      return { status: 'error', message: 'Formulário não encontrado' };
    }
    return { status: 'success', data: form };
  }
}
