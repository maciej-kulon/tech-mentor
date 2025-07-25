import { Injectable } from '@nestjs/common';
import { ProjectRepositoryService } from '@/project/data-model/project-repository.service';
import { IProject } from '@/project/interfaces/project.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

@Injectable()
export class ProjectDirectReadService {
  constructor(private readonly projectRepository: ProjectRepositoryService) {}

  public async findById(id: string): Promise<(IProject & ITimestamps) | null> {
    return this.projectRepository.findById(id);
  }

  public findByOwnerId(ownerId: string): Promise<(IProject & ITimestamps)[]> {
    return this.projectRepository.findByOwnerId(ownerId);
  }

  public findByCustomerId(customerId: string): Promise<(IProject & ITimestamps)[]> {
    return this.projectRepository.findByCustomerId(customerId);
  }
}
