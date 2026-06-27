import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { CurrentUserId, TenantId } from '../auth/auth.decorators';
import { ResponsesService } from './responses.service';

@Controller('api/form-flow/forms/:formId/responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get()
  list(
    @TenantId() tenantId: string,
    @Param('formId') formId: string,
    @Query('search') search?: string
  ) {
    return this.responsesService.listByForm(tenantId, formId, search);
  }

  @Delete()
  clearAll(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('formId') formId: string
  ) {
    return this.responsesService.clearAllByForm(tenantId, formId, userId);
  }
}
