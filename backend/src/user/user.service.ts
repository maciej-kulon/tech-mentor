import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { UserDirectReadService } from './direct-read/user-direct-read.service';
import { UserDirectWriteService } from './direct-write/user-direct-write.service';
import { ICommonUser } from './interfaces/common-user.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly userDirectReadService: UserDirectReadService,
    private readonly userDirectWriteService: UserDirectWriteService,
  ) {}

  public async create(user: CreateUserDto): Promise<ICommonUser> {
    const hashedPassword = await this.hashPassword(user.password);
    try {
      return await this.userDirectWriteService.create({
        passwordHash: hashedPassword,
        email: user.email,
        name: user.name,
        surname: user.surname,
        company: user.company,
      });
    } catch (error) {
      if (error.message.includes('E11000 duplicate key error collection')) {
        throw new ConflictException('Failed to create user');
      }
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  public async findByEmail(email: string): Promise<ICommonUser | null> {
    return this.userDirectReadService.findByEmail(email);
  }

  public async findById(id: string): Promise<ICommonUser | null> {
    return this.userDirectReadService.findById(id);
  }
}
