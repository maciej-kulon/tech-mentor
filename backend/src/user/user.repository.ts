import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  public async findById(id: string): Promise<IUser | null> {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(id) }).exec();
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      name: user.name,
      surname: user.surname,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
