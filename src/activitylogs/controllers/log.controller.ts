import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { LogService } from '../service/log.service';

@Controller()
export class LogController {
  constructor(private _logService: LogService) {}

  @Get('/activity/log/:username')
  @UseGuards(RolesUserGuard)
  async getLogsByUser(
    @Req() request: Request,
    @Param('username') username: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._logService.getLogsByUser(hotel, username);
  }

  @Post('/activity/sendlogs')
  @UseGuards(RolesUserGuard)
  async postLogs(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    console.log('posting LogS', body);
    return this._logService.postLogs(hotel, body);
  }
}
