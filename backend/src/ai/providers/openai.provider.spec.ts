import { OpenAiProvider } from '../providers/openai.provider';

// Mock the openai SDK
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'h1.title',
                    salePrice: '.price',
                    originalPrice: '.price-old',
                    image: 'img.main',
                    coupon: null,
                    shipping: '.shipping',
                    installments: '.installments',
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe('OpenAiProvider', () => {
  let provider: OpenAiProvider;
  const mockHtml = '<html><body><h1 class="title">Test Product</h1></body></html>';

  beforeEach(() => {
    provider = new OpenAiProvider('sk-test-key', 'gpt-4o');
  });

  describe('generateSelectors', () => {
    it('should return a valid selectors map', async () => {
      const selectors = await provider.generateSelectors(mockHtml);

      expect(selectors).toBeDefined();
      expect(typeof selectors).toBe('object');
      expect(selectors.title).toBe('h1.title');
      expect(selectors.salePrice).toBe('.price');
    });
  });

  describe('updateSelectorsAfterFailure', () => {
    it('should return updated selectors map', async () => {
      const previous = { title: 'h1', salePrice: '.bad-price', image: 'img' };
      const failed = ['salePrice'];

      const selectors = await provider.updateSelectorsAfterFailure(
        mockHtml,
        previous,
        failed,
      );

      expect(selectors).toBeDefined();
      expect(typeof selectors).toBe('object');
    });
  });
});
