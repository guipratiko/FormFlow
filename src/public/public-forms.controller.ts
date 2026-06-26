import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { SubmitFormResponseDto } from '../forms/forms.dto';
import { PublicFormsService } from './public-forms.service';

function extractMeta(req: Request, body: Record<string, unknown> = {}) {
  const q = req.query as Record<string, string | undefined>;
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer || req.headers.referrer,
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    utmSource: q.utm_source,
    utmMedium: q.utm_medium,
    utmCampaign: q.utm_campaign,
    utmContent: q.utm_content,
    utmTerm: q.utm_term,
  };
}

@Public()
@Controller('api/public/forms')
export class PublicFormsController {
  constructor(private readonly publicFormsService: PublicFormsService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.publicFormsService.getPublishedFormBySlug(slug);
  }

  @Post(':slug/view')
  recordView(@Param('slug') slug: string, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.publicFormsService.recordView(slug, extractMeta(req, body));
  }

  @Post(':slug/responses')
  submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitFormResponseDto,
    @Req() req: Request
  ) {
    return this.publicFormsService.submitResponse(slug, dto, extractMeta(req, dto as unknown as Record<string, unknown>));
  }
}
