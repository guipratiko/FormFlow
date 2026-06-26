import { Module } from '@nestjs/common';
import { PublicFormsController } from './public-forms.controller';
import { PublicPagesController } from './public-pages.controller';
import { PublicFormsService } from './public-forms.service';

@Module({
  controllers: [PublicFormsController, PublicPagesController],
  providers: [PublicFormsService],
})
export class PublicFormsModule {}
