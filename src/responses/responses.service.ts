import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const responseInclude = {
  answers: {
    include: {
      field: { select: { id: true, label: true, type: true } },
    },
  },
} as const;

@Injectable()
export class ResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByForm(tenantId: string, formId: string, search?: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!form) throw new NotFoundException('Formulário não encontrado');

    const term = search?.trim();
    if (!term) {
      return this.prisma.formResponse.findMany({
        where: { formId, deletedAt: null },
        orderBy: { submittedAt: 'desc' },
        take: 200,
        include: responseInclude,
      });
    }

    const pattern = `%${term}%`;
    const matching = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT r.id
      FROM form_flow.form_responses r
      INNER JOIN form_flow.forms fo ON fo.id = r.form_id
      INNER JOIN form_flow.form_response_answers a ON a.response_id = r.id
      LEFT JOIN form_flow.form_fields f ON f.id = a.field_id
      WHERE r.form_id = ${formId}
        AND fo.tenant_id = ${tenantId}
        AND fo.deleted_at IS NULL
        AND r.deleted_at IS NULL
        AND (
          COALESCE(f.label, '') ILIKE ${pattern}
          OR a.value::text ILIKE ${pattern}
        )
    `;

    const ids = matching.map((row) => row.id);
    if (ids.length === 0) return [];

    return this.prisma.formResponse.findMany({
      where: { id: { in: ids }, formId, deletedAt: null },
      orderBy: { submittedAt: 'desc' },
      take: 200,
      include: responseInclude,
    });
  }
}
