import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) return false;

    // Check static env token first (fast path)
    const staticToken = process.env.API_TOKEN_SECRET;
    if (staticToken && apiKey === staticToken) return true;

    // Check DB-managed tokens
    return this.authService.validateApiToken(apiKey);
  }
}
