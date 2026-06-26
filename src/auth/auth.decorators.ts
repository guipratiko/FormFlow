import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const tenantId = ctx.switchToHttp().getRequest().tenantId?.trim();
  if (!tenantId) {
    throw new BadRequestException('Tenant não identificado');
  }
  return tenantId;
});

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const userId = ctx.switchToHttp().getRequest().user?.id?.trim();
  if (!userId) {
    throw new BadRequestException('Usuário não identificado');
  }
  return userId;
});
