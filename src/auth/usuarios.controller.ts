import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './service/user.service';
import { usuario } from './models/user.model';
import { AdminVerifiedGuard } from 'src/guards/admin-verified.guard';

@Controller('usuarios')
@UseGuards(AdminVerifiedGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<usuario[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<usuario> {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() body: Partial<usuario>): Promise<usuario> {
    return this.userService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<usuario>,
  ): Promise<usuario> {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.userService.remove(id);
  }
}
