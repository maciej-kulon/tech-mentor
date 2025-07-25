import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IProject } from '@/project/interfaces/project.interface';
import { ProjectDirectReadService } from './direct-read/project-direct-read.service';
import { ProjectDirectWriteService } from './direct-write/project-direct-write.service';
import { CreateProjectRequestDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { LoggerService } from '@/logger/logger.service';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectDirectWriteService: ProjectDirectWriteService,
    private readonly projectDirectReadService: ProjectDirectReadService,
    private readonly logger: LoggerService,
  ) {}

  public async create(project: CreateProjectRequestDto): Promise<ProjectResponseDto> {
    const createdProject = await this.projectDirectWriteService.create(project);
    this.logger.log('Project created', createdProject);
    if (!createdProject) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return new ProjectResponseDto(createdProject);
  }

  public async findById(id: string): Promise<IProject | null> {
    try {
      return await this.projectDirectReadService.findById(id);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  public async update(
    id: string,
    project: Partial<IProject>,
  ): Promise<(IProject & ITimestamps) | null> {
    try {
      return await this.projectDirectWriteService.update(id, project);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  public async delete(id: string): Promise<IProject | null> {
    try {
      return await this.projectDirectWriteService.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  public async findByOwnerId(ownerId: string): Promise<IProject[]> {
    try {
      return await this.projectDirectReadService.findByOwnerId(ownerId);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  public async findByCustomerId(customerId: string): Promise<IProject[]> {
    try {
      return await this.projectDirectReadService.findByCustomerId(customerId);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }
}
