import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { SetAiConfigDto, AiConfigResponseDto } from './dto/ai-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { PROVIDER_MODELS } from './entities/user-ai-config.entity';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Username already in use' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.usersService.toResponse(user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => this.usersService.toResponse(u));
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@CurrentUser() currentUser: RequestUser) {
    const user = await this.usersService.findById(currentUser.id);
    return this.usersService.toResponse(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(+id);
    return this.usersService.toResponse(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(+id, dto);
    return this.usersService.toResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);
  }

  // --- AI Config endpoints ---

  @Get('providers/models')
  @ApiOperation({
    summary: 'List suggested models per AI provider',
    description: 'Returns a map of provider → available model suggestions. Users can also type any custom model name.',
  })
  @ApiResponse({
    status: 200,
    description: 'Map of provider to model list',
    schema: {
      example: {
        anthropic: ['claude-opus-4-5', 'claude-3-7-sonnet-20250219'],
        openai: ['gpt-4o', 'gpt-4o-mini'],
        google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest'],
        openrouter: ['openai/gpt-4o', 'anthropic/claude-opus-4-5'],
        ollama: ['llama3.2', 'mistral'],
      },
    },
  })
  getProviderModels() {
    return PROVIDER_MODELS;
  }

  // --- My own AI config shortcuts (must come BEFORE /:id routes) ---

  @Put('me/ai-config')
  @ApiOperation({ summary: 'Set my own AI provider config' })
  @ApiResponse({ status: 200, type: AiConfigResponseDto })
  async setMyAiConfig(
    @CurrentUser() currentUser: RequestUser,
    @Body() dto: SetAiConfigDto,
  ) {
    const config = await this.usersService.setAiConfig(currentUser.id, dto);
    return this.toAiConfigResponse(config);
  }

  @Get('me/ai-config')
  @ApiOperation({ summary: 'Get my own AI provider config (API key is masked)' })
  @ApiResponse({ status: 200, type: AiConfigResponseDto })
  async getMyAiConfig(@CurrentUser() currentUser: RequestUser) {
    const config = await this.usersService.getAiConfig(currentUser.id);
    if (!config) return null;
    return this.toAiConfigResponse(config);
  }

  @Put(':id/ai-config')
  @ApiOperation({
    summary: 'Set or update AI provider config for a user',
    description: `Configures which AI provider and model this user's API tokens will use.
The \`apiKey\` is encrypted with AES-256-CBC before being stored — it is never returned in responses.

**Provider notes:**
| Provider | apiKey | baseUrl |
|---|---|---|
| \`anthropic\` | Anthropic API key (\`sk-ant-...\`) | Not used |
| \`openai\` | OpenAI API key (\`sk-...\`) | Not used |
| \`google\` | Google AI Studio key | Not used |
| \`openrouter\` | OpenRouter API key (\`sk-or-...\`) | Not used |
| \`ollama\` | Leave empty \`""\` | Required (e.g. \`http://localhost:11434\`) |`,
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: AiConfigResponseDto })
  async setAiConfig(@Param('id') id: string, @Body() dto: SetAiConfigDto) {
    const config = await this.usersService.setAiConfig(+id, dto);
    return this.toAiConfigResponse(config);
  }

  @Get(':id/ai-config')
  @ApiOperation({ summary: 'Get AI config for a user (API key is masked)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: AiConfigResponseDto })
  async getAiConfig(@Param('id') id: string) {
    const config = await this.usersService.getAiConfig(+id);
    if (!config) return null;
    return this.toAiConfigResponse(config);
  }

  @Delete(':id/ai-config')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove AI config for a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  async deleteAiConfig(@Param('id') id: string) {
    await this.usersService.deleteAiConfig(+id);
  }

  private toAiConfigResponse(config: import('./entities/user-ai-config.entity').UserAiConfig): AiConfigResponseDto {
    let maskedApiKey: string | null = null;
    if (config.encryptedApiKey) {
      const decrypted = this.usersService.decryptApiKey(config);
      if (decrypted && decrypted.length > 8) {
        maskedApiKey =
          decrypted.substring(0, 4) +
          '***..***' +
          decrypted.substring(decrypted.length - 4);
      } else if (decrypted) {
        maskedApiKey = '***';
      }
    }

    return {
      id: config.id,
      provider: config.provider,
      model: config.model,
      maskedApiKey,
      baseUrl: config.baseUrl,
      isConfigured: config.isConfigured,
      updatedAt: config.updatedAt,
    };
  }
}
