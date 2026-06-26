import { Module } from '@nestjs/common';
import { PublicStatusController } from './public-status.controller';
import { RootController } from './root.controller';

@Module({
  controllers: [RootController, PublicStatusController],
})
export class HealthModule {}
