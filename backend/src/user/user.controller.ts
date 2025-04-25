import { Controller, Post, Body, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { GetUserResponseDto } from './dto/get-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('v1')
  public async create(@Body() user: CreateUserDto): Promise<CreateUserResponseDto> {
    const createdUser = await this.userService.create(user);
    return {
      id: createdUser.id,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':userId/v1')
  public async getUser(@Param('userId') userId: string): Promise<GetUserResponseDto> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
