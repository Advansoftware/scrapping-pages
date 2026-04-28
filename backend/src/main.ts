import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5004',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ----------------------------------------------------------------
  // Swagger / OpenAPI Documentation
  // Available at: /api/docs
  // ----------------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('Crawler AI API')
    .setDescription(
      `## Generic AI-powered web scraper — microservice API

### Overview
Crawler AI is a standalone microservice that scrapes product data from **any** website
using AI-generated CSS selectors. It learns per-domain selectors on first use and
automatically regenerates them when a site's layout changes.

### Authentication
Two methods are accepted depending on the caller:

| Method | Header | Use case |
|---|---|---|
| **JWT Bearer** | \`Authorization: Bearer <token>\` | Admin frontend (obtained from \`POST /auth/login\`) |
| **API Key** | \`X-API-Key: <token>\` | Service-to-service (e.g. licita-sync) |

The API key is linked to a **user**, and that user's AI provider configuration determines
which AI is used for selector generation.

### AI Providers
Each user configures their own AI provider in the database via \`PUT /users/me/ai-config\`.
Supported providers:

| Provider | Notes |
|---|---|
| **Anthropic** | Claude models. Best quality for complex pages. |
| **OpenAI** | GPT models. Great balance of speed and quality. |
| **Google** | Gemini models. Fast, competitive pricing. |
| **OpenRouter** | Gateway to 100+ models with a single API key (openrouter.ai). |
| **Ollama** | Run locally or self-hosted — zero API cost, requires GPU/CPU. |

### Quick Start
\`\`\`bash
# 1. Login
curl -X POST /auth/login -d '{"username":"admin","password":"crawler@2024"}'

# 2. Configure your AI provider  
curl -X PUT /users/me/ai-config \\
  -H "Authorization: Bearer <token>" \\
  -d '{"provider":"anthropic","model":"claude-opus-4-5","apiKey":"sk-ant-..."}'

# 3. Create an API token for service integration
curl -X POST /auth/tokens \\
  -H "Authorization: Bearer <token>" \\
  -d '{"name":"licita-sync-prod","description":"Used by the licita-sync backend"}'

# 4. Scrape a product (using JWT or API key)
curl -X POST /crawler/scrape \\
  -H "X-API-Key: <api-token>" \\
  -d '{"url":"https://www.amazon.com.br/dp/B09G9BL5CP"}'
\`\`\`
`,
    )
    .setVersion('1.0')
    .addTag('Auth', 'Login, JWT tokens, and API key management')
    .addTag('Users', 'User management and AI provider configuration')
    .addTag('Crawler', 'Web scraping and domain config management')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Crawler AI — API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[Crawler AI] API running on port ${port}`);
  console.log(`[Crawler AI] Docs at http://localhost:${port}/api/docs`);
}

bootstrap();
