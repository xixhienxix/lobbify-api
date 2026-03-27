import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { jwtDecode } from 'jwt-decode';
import { UserService } from '../service/user.service';

@Controller()
export class LoginController {
  constructor(private readonly userService: UserService) {}

  @Get('/getUserByToken')
  async getUserByToken(@Req() request: Request): Promise<any> {
    const token = request.headers.authorization;
    return jwtDecode(token);
  }

  @Post('/login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ): Promise<any> {
    return this.userService.loginFromAdmin(username, password);
  }
}
