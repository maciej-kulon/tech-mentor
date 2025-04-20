import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IUser } from './interfaces/IUser';
import { User } from './user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  public async create(user: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const createdUser = await this.userModel.create(user);
    return {
      id: createdUser._id.toString(),
      name: createdUser.name,
      surname: createdUser.surname,
      email: createdUser.email,
    };
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
}
