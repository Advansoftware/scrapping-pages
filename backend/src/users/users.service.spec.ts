import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserAiConfig, AiProviderType } from './entities/user-ai-config.entity';

const mockUserRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
};

const mockAiConfigRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(UserAiConfig), useValue: mockAiConfigRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const user = { id: 1, username: 'admin', isActive: true };
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('admin');
      expect(result).toEqual(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { username: 'admin' } });
    });

    it('should return null when not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.findByUsername('ghost');
      expect(result).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should return false for wrong password', async () => {
      const user = { id: 1, username: 'admin', passwordHash: 'bad-hash' } as any;
      const result = await service.validatePassword(user, 'wrong-pass');
      expect(result).toBe(false);
    });
  });

  describe('setAiConfig', () => {
    it('should create AI config for a user', async () => {
      const user = { id: 1, username: 'admin', aiConfig: null };
      mockUserRepo.findOne.mockResolvedValue(user);
      mockAiConfigRepo.findOne.mockResolvedValue(null);
      mockAiConfigRepo.create.mockImplementation((data) => data);
      mockAiConfigRepo.save.mockImplementation((data) => ({ id: 1, ...data, isConfigured: true }));

      const result = await service.setAiConfig(1, {
        provider: AiProviderType.ANTHROPIC,
        model: 'claude-opus-4-5',
        apiKey: 'sk-ant-test',
      });

      expect(mockAiConfigRepo.save).toHaveBeenCalled();
      expect(result.provider).toBe(AiProviderType.ANTHROPIC);
    });
  });

  describe('getAiConfig', () => {
    it('should return null when no config exists', async () => {
      mockAiConfigRepo.findOne.mockResolvedValue(null);
      const result = await service.getAiConfig(999);
      expect(result).toBeNull();
    });

    it('should return the config when it exists', async () => {
      const config = { id: 1, userId: 1, provider: AiProviderType.OPENAI, isConfigured: true };
      mockAiConfigRepo.findOne.mockResolvedValue(config);

      const result = await service.getAiConfig(1);
      expect(result?.provider).toBe(AiProviderType.OPENAI);
    });
  });

  describe('decryptApiKey', () => {
    it('should decrypt an encrypted key', () => {
      const { encrypt } = require('../common/crypto.util');
      const plainText = 'my-secret-key';
      const encrypted = encrypt(plainText);
      const fakeConfig = { encryptedApiKey: encrypted } as any;

      const decrypted = service.decryptApiKey(fakeConfig);
      expect(decrypted).toBe(plainText);
    });
  });
});
