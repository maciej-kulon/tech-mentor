import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IProject } from '@/project/interfaces/project.interface';
import { ProjectRepositoryService } from '@/project/data-model/project-repository.service';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

@Injectable()
export class ProjectDirectWriteService {
  constructor(private readonly projectRepository: ProjectRepositoryService) {}

  public async create(project: Omit<IProject, 'id'>): Promise<IProject & ITimestamps> {
    const createdProject = await this.projectRepository.create(project);
    if (!createdProject) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return createdProject;
  }

  public async update(id: string, project: Partial<IProject>): Promise<IProject & ITimestamps> {
    const updatedProject = await this.projectRepository.update(id, project);
    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }
    return updatedProject;
  }

  public async delete(id: string): Promise<IProject & ITimestamps> {
    const deletedProject = await this.projectRepository.delete(id);
    if (!deletedProject) {
      throw new NotFoundException('Project not found');
    }
    return deletedProject;
  }
}
