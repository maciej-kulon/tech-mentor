import { Injectable } from '@nestjs/common';
import { UserRepositoryService } from '../data-model/user-repository.service';
import { ICommonUser } from '../interfaces/common-user.interface';

@Injectable()
export class UserDirectReadService {
  constructor(private readonly userRepositoryService: UserRepositoryService) {}

  public async findByEmail(email: string): Promise<ICommonUser | null> {
    const user = await this.userRepositoryService.findByEmail(email);
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

  public async findById(id: string): Promise<ICommonUser | null> {
    return this.userRepositoryService.findById(id);
  }

  public async findByEmailWithPasswordHash(
    email: string,
  ): Promise<(ICommonUser & { passwordHash: string }) | null> {
    const user = await this.userRepositoryService.findByEmail(email);
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
      passwordHash: user.passwordHash,
    };
  }
}
