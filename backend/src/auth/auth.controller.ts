import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  /** @example admin */
  username: string;
  /** @example crawler@2024 */
  password: string;
}

class CreateTokenDto {
  /** @example Production scraper */
  name: string;
  description?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login and obtain a JWT access token',
    description: `Authenticates a user and returns a short-lived JWT (24 h).
Use the returned \`access_token\` as a \`Bearer\` header for all admin endpoints.`,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: { id: 1, username: 'admin', name: 'Administrador' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    return this.authService.login(user);
  }

  // --- Token management ---

  @Post('tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new API token',
    description: `Generates a new API token linked to a user.
The token can be used in the \`X-API-Key\` header for service-to-service calls.
**The full token value is only returned once at creation time — store it securely.**`,
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Token created',
    schema: {
      example: {
        id: 1,
        name: 'Production scraper',
        token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        userId: 1,
        createdAt: '2026-04-28T00:00:00.000Z',
      },
    },
  })
  async createToken(
    @CurrentUser() user: RequestUser,
    @Body() body: { name: string; description?: string },
  ) {
    return this.authService.createToken(user.id, body.name, body.description);
  }

  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List API tokens',
    description: 'Returns all tokens. Admins see all; regular users see only their own.',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'Token list (actual token value is never included)' })
  async listTokens(
    @CurrentUser() user: RequestUser,
    @Query('userId') userId?: string,
  ) {
    // If a specific userId filter is requested, use it; otherwise show user's own
    const filterUserId = userId ? +userId : user.id;
    return this.authService.listTokens(filterUserId);
  }

  @Delete('tokens/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a token (keeps the record, sets isActive=false)' })
  @ApiParam({ name: 'id', type: Number })
  async revokeToken(@Param('id') id: string) {
    return this.authService.revokeToken(+id);
  }

  @Delete('tokens/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Permanently delete a token' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  async deleteToken(@Param('id') id: string) {
    await this.authService.deleteToken(+id);
  }
}
