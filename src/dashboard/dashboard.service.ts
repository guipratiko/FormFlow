import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function stringifyAnswerValue(value: unknown): string {
  if (value == null || value === false) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

function extractRespondentName(
  answers: Array<{ value: unknown; field: { type: string; label: string } }>,
): string | null {
  const match = answers.find(
    (a) =>
      a.field.type === 'full_name' || /nome\s*completo/i.test((a.field.label || '').trim()),
  );
  if (!match) return null;
  const text = stringifyAnswerValue(match.value);
  return text || null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const whereTenant = { tenantId, deletedAt: null };

    return this.prisma.$transaction(async (tx) => {
      const formCount = await tx.form.count({ where: whereTenant });
      const publishedForms = await tx.form.count({
        where: { ...whereTenant, status: 'published' },
      });
      const responseCount = await tx.formResponse.count({
        where: { form: whereTenant, deletedAt: null },
      });
      const viewCount = await tx.formView.count({
        where: { form: whereTenant },
      });
      const recentResponsesRaw = await tx.formResponse.findMany({
        where: { form: whereTenant, deletedAt: null },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          submittedAt: true,
          form: { select: { id: true, title: true, slug: true } },
          answers: {
            where: {
              OR: [
                { field: { type: 'full_name' } },
                { field: { label: { contains: 'nome completo', mode: 'insensitive' } } },
              ],
            },
            take: 1,
            select: {
              value: true,
              field: { select: { type: true, label: true } },
            },
          },
        },
      });
      const recentResponses = recentResponsesRaw.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt,
        form: r.form,
        respondentName: extractRespondentName(r.answers),
      }));
      const topForms = (
        await tx.form.findMany({
          where: whereTenant,
          take: 20,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            _count: { select: { responses: true, views: true } },
          },
        })
      )
        .sort((a, b) => b._count.responses - a._count.responses)
        .slice(0, 5);

      const conversionRate =
        viewCount > 0 ? Math.round((responseCount / viewCount) * 1000) / 10 : 0;

      return {
        totals: {
          forms: formCount,
          publishedForms,
          responses: responseCount,
          views: viewCount,
          conversionRate,
        },
        recentResponses,
        topForms,
      };
    });
  }
}
