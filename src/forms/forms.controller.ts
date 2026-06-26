import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { FormStatus } from '@prisma/client';
import { CurrentUserId, TenantId } from '../auth/auth.decorators';
import {
  CreateFormDto,
  UpdateFormDto,
  UpsertFormFieldsDto,
  UpsertFormStepsDto,
  UpsertFormThemeDto,
} from './forms.dto';
import { FormsService } from './forms.service';

@Controller('api/form-flow/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.formsService.listByTenant(tenantId);
  }

  @Get('meta/trigger-eligible')
  listTriggerEligible(@TenantId() tenantId: string) {
    return this.formsService.listTriggerEligible(tenantId);
  }

  @Get(':id')
  getOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.formsService.getById(tenantId, id);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CreateFormDto
  ) {
    return this.formsService.create(tenantId, dto, userId);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto
  ) {
    return this.formsService.update(tenantId, id, dto, userId);
  }

  @Delete(':id')
  remove(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.formsService.softDelete(tenantId, id, userId);
  }

  @Post(':id/duplicate')
  duplicate(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.formsService.duplicate(tenantId, id, userId);
  }

  @Post(':id/publish')
  publish(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.formsService.setStatus(tenantId, id, FormStatus.published, userId);
  }

  @Post(':id/unpublish')
  unpublish(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.formsService.setStatus(tenantId, id, FormStatus.unpublished, userId);
  }

  @Post(':id/archive')
  archive(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.formsService.setStatus(tenantId, id, FormStatus.archived, userId);
  }

  @Put(':id/fields')
  upsertFields(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertFormFieldsDto
  ) {
    return this.formsService.upsertFields(tenantId, id, dto, userId);
  }

  @Put(':id/steps')
  upsertSteps(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertFormStepsDto
  ) {
    return this.formsService.upsertSteps(tenantId, id, dto, userId);
  }

  @Put(':id/theme')
  upsertTheme(
    @TenantId() tenantId: string,
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertFormThemeDto
  ) {
    return this.formsService.upsertTheme(tenantId, id, dto, userId);
  }
}
