import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../enums';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('RolesGuard');

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest<{
      user?: { role?: Role; approved?: boolean };
    }>();
    const user = req.user;
    if (!user || !user.role || user.approved === false) {
      throw new ForbiddenException('권한 없음');
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException('권한 없음');
    }
    return true;
  }
}
