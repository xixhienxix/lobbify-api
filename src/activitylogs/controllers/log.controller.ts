import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { LogService } from '../service/log.service';

@Controller()
export class LogController {
  constructor(private _logService: LogService) {}

  @Get('/activity/log/:username')
  @UseGuards(RolesUserGuard)
  async getLogsByUser(@Param('username') username: string): Promise<any> {
    return this._logService.getLogsByUser(username);
  }

  @Post('/activity/sendlogs')
  @UseGuards(RolesUserGuard)
  async postLogs(@Body() body) {
    return this._logService.postLogs(body);
  }
}
