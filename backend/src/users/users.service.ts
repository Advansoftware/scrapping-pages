import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserAiConfig } from './entities/user-ai-config.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SetAiConfigDto } from './dto/ai-config.dto';
import { encrypt, decrypt } from '../common/crypto.util';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserAiConfig)
    private readonly aiConfigRepo: Repository<UserAiConfig>,
  ) { }

  /** Seeds the default admin user on first startup. */
  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const username = process.env.ADMIN_USER || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'crawler@2024';
      await this.create({ username, password, name: 'Administrador', isAdmin: true });
      this.logger.log(`Default admin user "${username}" created.`);
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username já em uso');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      passwordHash,
      name: dto.name,
      isAdmin: dto.isAdmin ?? false,
    });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.isAdmin !== undefined) user.isAdmin = dto.isAdmin;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepo.remove(user);
  }

  // --- AI Config ---

  async setAiConfig(userId: number, dto: SetAiConfigDto): Promise<UserAiConfig> {
    await this.findById(userId); // ensure user exists

    let config = await this.aiConfigRepo.findOne({ where: { userId } });

    const encryptedApiKey = dto.apiKey ? encrypt(dto.apiKey) : null;
    const isConfigured = !!(dto.apiKey || dto.baseUrl);

    if (config) {
      config.provider = dto.provider;
      config.model = dto.model;
      config.encryptedApiKey = encryptedApiKey;
      config.baseUrl = dto.baseUrl ?? null;
      config.isConfigured = isConfigured;
    } else {
      config = this.aiConfigRepo.create({
        userId,
        provider: dto.provider,
        model: dto.model,
        encryptedApiKey,
        baseUrl: dto.baseUrl ?? null,
        isConfigured,
      });
    }

    return this.aiConfigRepo.save(config);
  }

  async getAiConfig(userId: number): Promise<UserAiConfig | null> {
    return this.aiConfigRepo.findOne({ where: { userId } });
  }

  /** Returns the decrypted API key for internal use (never sent to clients). */
  decryptApiKey(config: UserAiConfig): string | null {
    if (!config.encryptedApiKey) return null;
    return decrypt(config.encryptedApiKey);
  }

  async deleteAiConfig(userId: number): Promise<void> {
    const config = await this.aiConfigRepo.findOne({ where: { userId } });
    if (config) await this.aiConfigRepo.remove(config);
  }

  toResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      hasAiConfig: !!user.aiConfig?.isConfigured,
    };
  }
}
