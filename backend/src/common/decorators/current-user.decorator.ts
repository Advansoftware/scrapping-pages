import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user (or API-key resolved user) from the request.
 *
 * Usage in a controller method:
 * ```ts
 * @Get('me')
 * getMe(@CurrentUser() user: RequestUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);

export interface RequestUser {
  id: number;
  username: string;
  name: string;
}
