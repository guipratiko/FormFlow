import { Controller, Get } from '@nestjs/common';
import { TenantId } from '../auth/auth.decorators';
import { DashboardService } from './dashboard.service';

@Controller('api/form-flow/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  stats(@TenantId() tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }
}
