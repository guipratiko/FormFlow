import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface AuthUser {
  id: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const secret = this.config.get<string>('jwtSecret');
    if (!secret) {
      throw new UnauthorizedException('JWT não configurado no serviço');
    }

    try {
      const decoded = jwt.verify(header.slice(7), secret) as { id: string };
      if (!decoded?.id) {
        throw new UnauthorizedException('Token inválido');
      }
      req.user = { id: decoded.id } satisfies AuthUser;

      const tenantHeader = req.headers['x-onlyflow-tenant-id'];
      req.tenantId =
        typeof tenantHeader === 'string' && tenantHeader.trim()
          ? tenantHeader.trim()
          : decoded.id;

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expirado');
      }
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido');
    }
  }
}
