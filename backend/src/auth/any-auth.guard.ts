import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

/**
 * Guard that accepts EITHER a valid JWT Bearer token OR a valid X-API-Key.
 * Attaches the resolved user (with id, username, name) to request.user.
 */
@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try JWT Bearer
    const authHeader: string = request.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify<{ sub: number; username: string }>(
          token,
          { secret: process.env.JWT_SECRET || 'crawler-ai-secret-key' },
        );
        const user = await this.usersService.findById(payload.sub);
        if (!user?.isActive) return false;
        request.user = { id: user.id, username: user.username, name: user.name };
        return true;
      } catch {
        // fall through to API key check
      }
    }

    // 2. Try X-API-Key header
    const apiKey: string = request.headers['x-api-key'] || '';
    if (apiKey) {
      const resolvedUser = await this.authService.resolveApiKeyUser(apiKey);
      if (!resolvedUser) return false;
      request.user = { id: resolvedUser.id, username: resolvedUser.username, name: resolvedUser.name };
      return true;
    }

    return false;
  }
}
