import { Controller, Post, Body } from '@nestjs/common';

import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
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
}
