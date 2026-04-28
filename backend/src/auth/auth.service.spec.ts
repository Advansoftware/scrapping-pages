import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiToken } from './entities/api-token.entity';

const mockUser = {
  id: 1,
  username: 'admin',
  name: 'Admin',
  isActive: true,
  isAdmin: true,
  passwordHash: '$2a$10$abcdefghijklmnopqrstuuNpuZF1.XzlPqv.3aLkIHIMfLe1Mg7Aq', // 'crawler@2024'
  aiConfig: null,
};

const mockUsersService = {
  findByUsername: jest.fn(),
  validatePassword: jest.fn(),
  findById: jest.fn(),
};

const mockTokenRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(ApiToken), useValue: mockTokenRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('admin', 'crawler@2024');
      expect(result).toBeDefined();
      expect(result.username).toBe('admin');
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('unknown', 'pass');
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser('admin', 'wrong');
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      mockUsersService.findByUsername.mockResolvedValue({ ...mockUser, isActive: false });
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('admin', 'crawler@2024');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access_token', async () => {
      const user = { id: 1, username: 'admin', name: 'Admin', passwordHash: 'x', isActive: true, isAdmin: true, aiConfig: null, tokens: [], createdAt: new Date(), updatedAt: new Date() } as any;
      const result = await service.login(user);
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('signed-jwt-token');
    });
  });

  describe('createToken', () => {
    it('should create and return an api token', async () => {
      const token = { id: 1, name: 'test', token: 'raw-token', userId: 1 };
      mockTokenRepo.create.mockReturnValue(token);
      mockTokenRepo.save.mockResolvedValue(token);

      const result = await service.createToken(1, 'test', 'for tests');
      expect(mockTokenRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
    });
  });

  describe('resolveApiKeyUser', () => {
    it('should return admin user when static env token matches', async () => {
      const originalEnv = process.env.API_TOKEN_SECRET;
      process.env.API_TOKEN_SECRET = 'static-key';
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      // tokenRepo.createQueryBuilder needed for lastUsedAt update
      (mockTokenRepo as any).createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      });

      const result = await service.resolveApiKeyUser('static-key');
      expect(result).toBeDefined();
      expect(result?.username).toBe('admin');

      process.env.API_TOKEN_SECRET = originalEnv;
    });

    it('should return null for an unknown token', async () => {
      process.env.API_KEY = 'something-else';
      mockTokenRepo.findOne.mockResolvedValue(null);

      const result = await service.resolveApiKeyUser('unknown-key');
      expect(result).toBeNull();
    });
  });
});
