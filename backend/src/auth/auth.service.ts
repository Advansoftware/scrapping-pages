import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApiToken } from './entities/api-token.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(ApiToken)
    private readonly tokenRepo: Repository<ApiToken>,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.isActive) return null;
    const valid = await this.usersService.validatePassword(user, password);
    return valid ? user : null;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, name: user.name },
    };
  }

  /** Resolves an API key to its owning user (with eager-loaded aiConfig). */
  async resolveApiKeyUser(token: string): Promise<User | null> {
    // Static env-based token (fast path, resolves to the first admin user)
    const staticToken = process.env.API_TOKEN_SECRET;
    if (staticToken && token === staticToken) {
      const admin = await this.usersService.findByUsername(
        process.env.ADMIN_USER || 'admin',
      );
      if (admin) {
        await this.tokenRepo
          .createQueryBuilder()
          .update()
          .set({ lastUsedAt: new Date() })
          .where('token = :token', { token })
          .execute();
      }
      return admin;
    }

    // DB-managed tokens
    const apiToken = await this.tokenRepo.findOne({
      where: { token, isActive: true },
      relations: ['user'],
    });
    if (!apiToken || !apiToken.user?.isActive) return null;

    await this.tokenRepo.update(apiToken.id, { lastUsedAt: new Date() });

    // Reload user with aiConfig relation
    return this.usersService.findById(apiToken.userId);
  }

  async validateApiToken(token: string): Promise<boolean> {
    const user = await this.resolveApiKeyUser(token);
    return !!user;
  }

  async createToken(userId: number, name: string, description?: string) {
    const token = uuidv4().replace(/-/g, '');
    const apiToken = await this.tokenRepo.save({ userId, name, description: description ?? null, token });
    return {
      id: apiToken.id,
      name: apiToken.name,
      description: apiToken.description,
      token,
      userId: apiToken.userId,
      createdAt: apiToken.createdAt,
    };
  }

  async listTokens(userId?: number) {
    const where: any = {};
    if (userId !== undefined) where.userId = userId;

    const tokens = await this.tokenRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return tokens.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      isActive: t.isActive,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
      userId: t.userId,
      username: t.user?.username,
      tokenPreview: t.token.substring(0, 8) + '...',
    }));
  }

  async revokeToken(id: number) {
    const token = await this.tokenRepo.findOne({ where: { id } });
    if (!token) return { message: 'Token não encontrado' };
    await this.tokenRepo.update(id, { isActive: false });
    return { message: 'Token revogado com sucesso' };
  }

  async deleteToken(id: number) {
    const token = await this.tokenRepo.findOne({ where: { id } });
    if (!token) return { message: 'Token não encontrado' };
    await this.tokenRepo.remove(token);
    return { message: 'Token removido com sucesso' };
  }
}
