import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Public()
@Controller()
export class RootController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return {
      status: 'ok',
      service: 'FormFlow',
      api: '/api/form-flow',
      publicForms: '/f/:slug',
      publicFormsApi: '/api/public/forms/:slug',
    };
  }

  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'FormFlow', database: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao conectar ao Postgres';
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'FormFlow',
        database: false,
        message,
      });
    }
  }
}
