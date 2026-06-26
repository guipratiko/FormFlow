import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DashboardModule } from './dashboard/dashboard.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicFormsModule } from './public/public-forms.module';
import { ResponsesModule } from './responses/responses.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    FormsModule,
    DashboardModule,
    ResponsesModule,
    PublicFormsModule,
    InternalModule,
  ],
})
export class AppModule {}
