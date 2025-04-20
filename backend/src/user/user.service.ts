import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';
import { User } from './user.schema';
import { IUser } from './interfaces/IUser';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async create(user: CreateUserDto): Promise<IUser> {
    const hashedPassword = await this.hashPassword(user.password);
    return this.userRepository.create({
      passwordHash: hashedPassword,
      email: user.email,
      name: user.name,
      surname: user.surname,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
