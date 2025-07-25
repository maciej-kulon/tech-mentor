import { Controller, Post, Body, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { GetUserResponseDto } from './dto/get-user.dto';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ICommonUser } from './interfaces/common-user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('v1')
  public async create(@Body() user: CreateUserDto): Promise<CreateUserResponseDto> {
    const createdUser = await this.userService.create(user);
    return {
      id: createdUser.id,
      company: createdUser.company,
      name: createdUser.name,
      surname: createdUser.surname,
      email: createdUser.email,
    };
  }

  /**
   * Get the current authenticated user's information
   * The user ID is extracted from the JWT token, ensuring users can only access their own data
   * Uses the user object directly from JWT strategy to avoid unnecessary database calls
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me/v1')
  public async getCurrentUser(@CurrentUser() user: ICommonUser): Promise<GetUserResponseDto> {
    const userData = await this.userService.findById(user?.id);
    if (!userData) {
      throw new NotFoundException(`User with id: ${user?.id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      company: user.company,
    };
  }
}
