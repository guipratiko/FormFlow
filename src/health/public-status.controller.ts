import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import packageJson from '../../package.json';

@Public()
@Controller('api/public')
export class PublicStatusController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /api/public/status
   * Health público alinhado ao padrão OnlyFlow (consumido pelo GET /api/public/status do backend principal).
   */
  @Get('status')
  async status(@Res() res: Response) {
    const timestamp = new Date().toISOString();
    const packageVersion = packageJson.version || '1.0.0';
    const dbUrl = (process.env.POSTGRES_URI || process.env.DATABASE_URL || '').trim();

    if (!dbUrl) {
      return res.status(500).json({
        status: 'error',
        service: 'form-flow',
        version: packageVersion,
        message: 'FormFlow indisponível: POSTGRES_URI não configurado.',
        timestamp,
        details: { postgresql: false },
      });
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return res.status(200).json({
        status: 'ok',
        service: 'form-flow',
        version: packageVersion,
        message: 'FormFlow API está funcionando',
        timestamp,
        environment: this.config.get<string>('nodeEnv') || process.env.NODE_ENV || 'development',
        details: { postgresql: true },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao consultar Postgres';
      return res.status(500).json({
        status: 'error',
        service: 'form-flow',
        version: packageVersion,
        message: `FormFlow com problemas: ${msg}`,
        timestamp,
        details: { postgresql: false, error: msg },
      });
    }
  }
}
