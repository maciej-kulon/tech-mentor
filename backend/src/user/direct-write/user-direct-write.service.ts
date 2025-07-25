import { Injectable } from '@nestjs/common';
import { UserRepositoryService } from '../data-model/user-repository.service';
import { ICommonUser } from '../interfaces/common-user.interface';
import { CreateUserInternalDto } from '../dto/create-user-internal.dto';

@Injectable()
export class UserDirectWriteService {
  constructor(private readonly userRepositoryService: UserRepositoryService) {}

  public async create(userData: CreateUserInternalDto): Promise<ICommonUser> {
    return this.userRepositoryService.create(userData);
  }
}
