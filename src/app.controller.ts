// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/version')
  getVersion(): string {
    return this.appService.getVersion();
  }
  @Get()
  getHello(): string {
    return 'Apps Running Correctly';
  }
}
