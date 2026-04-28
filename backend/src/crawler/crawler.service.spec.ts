import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CrawlerConfig } from './entities/crawler-config.entity';
import { ScrapeJob, ScrapeJobStatus } from './entities/scrape-job.entity';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { AiProviderType } from '../users/entities/user-ai-config.entity';
import { BadRequestException } from '@nestjs/common';

// Mock puppeteer-extra and stealth plugin
jest.mock('puppeteer-extra', () => ({
  default: {
    use: jest.fn().mockReturnThis(),
    launch: jest.fn(),
  },
}));
jest.mock('puppeteer-extra-plugin-stealth', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({}),
}));

const mockConfigRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
};

const mockJobRepo = {
  save: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
};

const mockAiService = {
  generateSelectors: jest.fn(),
  updateSelectorsAfterFailure: jest.fn(),
};

const mockUsersService = {
  getAiConfig: jest.fn(),
};

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        { provide: getRepositoryToken(CrawlerConfig), useValue: mockConfigRepo },
        { provide: getRepositoryToken(ScrapeJob), useValue: mockJobRepo },
        { provide: AiService, useValue: mockAiService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
    jest.clearAllMocks();
  });

  describe('scrapeProduct', () => {
    it('should throw BadRequestException if AI config is not set', async () => {
      mockUsersService.getAiConfig.mockResolvedValue(null);
      mockJobRepo.save.mockResolvedValue({ id: 1 });

      await expect(service.scrapeProduct('https://amazon.com.br/dp/test', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if AI config is not configured', async () => {
      mockUsersService.getAiConfig.mockResolvedValue({ isConfigured: false });
      mockJobRepo.save.mockResolvedValue({ id: 1 });

      await expect(service.scrapeProduct('https://amazon.com.br/dp/test', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listConfigs', () => {
    it('should return paginated configs', async () => {
      mockConfigRepo.findAndCount.mockResolvedValue([[{ domain: 'amazon.com.br' }], 1]);
      const result = await service.listConfigs(1, 10);
      expect(result.total).toBe(1);
      expect(result.configs).toHaveLength(1);
    });
  });

  describe('getJobStats', () => {
    it('should return stats object', async () => {
      mockJobRepo.count.mockResolvedValueOnce(100); // total
      mockJobRepo.count.mockResolvedValueOnce(90);  // success
      mockJobRepo.count.mockResolvedValueOnce(10);  // failed
      mockJobRepo.count.mockResolvedValueOnce(5);   // updated
      mockConfigRepo.count.mockResolvedValue(15);   // domains

      const stats = await service.getJobStats();
      expect(stats.total).toBe(100);
      expect(stats.success).toBe(90);
      expect(stats.failed).toBe(10);
      expect(stats.domains).toBe(15);
    });
  });

  describe('deleteConfig', () => {
    it('should remove config when found', async () => {
      const config = { domain: 'test.com' };
      mockConfigRepo.findOne.mockResolvedValue(config);
      mockConfigRepo.remove.mockResolvedValue(config);

      const result = await service.deleteConfig('test.com');
      expect(mockConfigRepo.remove).toHaveBeenCalledWith(config);
      expect(result.message).toContain('test.com');
    });

    it('should return not-found message when config does not exist', async () => {
      mockConfigRepo.findOne.mockResolvedValue(null);

      const result = await service.deleteConfig('unknown.com');
      expect(result.message).toContain('unknown.com');
      expect(mockConfigRepo.remove).not.toHaveBeenCalled();
    });
  });
});
