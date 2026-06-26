import { Controller, Get, NotFoundException, Param, Redirect, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { Public } from '../auth/public.decorator';

const RESERVED = new Set(['health', 'api', 'public', 'f']);

@Public()
@Controller()
export class PublicPagesController {
  @Get('f/:slug')
  serveFormPage(@Param('slug') slug: string, @Res() res: Response) {
    if (RESERVED.has(slug) || !slug.trim()) {
      throw new NotFoundException();
    }
    res.sendFile(join(__dirname, '..', '..', 'public-web', 'index.html'));
  }

  /** Compatibilidade com URLs antigas /{slug} → /f/{slug} */
  @Get(':slug')
  @Redirect(undefined, 301)
  legacyFormRedirect(@Param('slug') slug: string) {
    if (RESERVED.has(slug) || !slug.trim()) {
      throw new NotFoundException();
    }
    return { url: `/f/${encodeURIComponent(slug)}` };
  }
}
