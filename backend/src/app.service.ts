import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      status: 'ok',
      service: 'Crawler AI',
      timestamp: new Date().toISOString(),
    };
  }
}
