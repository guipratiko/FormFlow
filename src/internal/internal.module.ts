import { Module } from '@nestjs/common';
import { InternalFormsController } from './internal-forms.controller';

@Module({
  controllers: [InternalFormsController],
})
export class InternalModule {}
