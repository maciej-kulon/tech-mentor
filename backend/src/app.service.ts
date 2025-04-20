import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  public getPing(): string {
    return 'Pong';
  }
}
