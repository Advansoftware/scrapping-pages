import { AnthropicProvider } from '../providers/anthropic.provider';
import { AiProviderType } from '../../users/entities/user-ai-config.entity';

// Mock the @anthropic-ai/sdk module
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                title: 'h1.product-title',
                salePrice: 'span.price-sale',
                originalPrice: 'span.price-original',
                image: 'img.product-image',
                coupon: null,
                shipping: 'div.shipping-info',
                installments: 'div.installments',
                notes: 'Use .innerText for prices',
              }),
            },
          ],
        }),
      },
    })),
  };
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  const mockHtml = '<html><body><h1 class="product-title">Test Product</h1></body></html>';

  beforeEach(() => {
    provider = new AnthropicProvider('sk-ant-test-key', 'claude-opus-4-5');
  });

  describe('generateSelectors', () => {
    it('should return a valid selectors map', async () => {
      const selectors = await provider.generateSelectors(mockHtml);

      expect(selectors).toBeDefined();
      expect(typeof selectors).toBe('object');
      expect(selectors.title).toBe('h1.product-title');
      expect(selectors.salePrice).toBe('span.price-sale');
      expect(selectors.image).toBe('img.product-image');
    });

    it('should include all expected fields', async () => {
      const selectors = await provider.generateSelectors(mockHtml);
      const expectedFields = ['title', 'salePrice', 'originalPrice', 'image'];
      expectedFields.forEach((field) => {
        expect(selectors).toHaveProperty(field);
      });
    });
  });

  describe('updateSelectorsAfterFailure', () => {
    it('should call the AI with failed fields context', async () => {
      const previous = { title: 'h1', salePrice: '.old-price', image: 'img' };
      const failed = ['salePrice', 'image'];

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
