import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectEntity } from './project.schema';
import { IProject } from '@/project/interfaces/project.interface';
import { LoggerService } from '@/logger/logger.service';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

@Injectable()
export class ProjectRepositoryService {
  constructor(
    @InjectModel(ProjectEntity.name) private projectModel: Model<ProjectEntity>,
    private readonly logger: LoggerService,
  ) {}

  public async create(project: Omit<IProject, 'id'>): Promise<(IProject & ITimestamps) | null> {
    const createdProject = await this.projectModel.create(project);
    this.logger.log('Project created', createdProject);
    return this.toProjectInterface(createdProject);
  }

  public async findById(id: string): Promise<(IProject & ITimestamps) | null> {
    const project = await this.projectModel.findById(id);
    if (!project) {
      return null;
    }
    return this.toProjectInterface(project);
  }

  public async update(
    id: string,
    project: Partial<IProject>,
  ): Promise<(IProject & ITimestamps) | null> {
    const updatedProject = await this.projectModel.findByIdAndUpdate(id, project, {
      new: true,
    });
    if (!updatedProject) {
      return null;
    }
    return this.toProjectInterface(updatedProject);
  }

  public async delete(id: string): Promise<(IProject & ITimestamps) | null> {
    const deletedProject = await this.projectModel.findByIdAndDelete(id);
    if (!deletedProject) {
      return null;
    }
    return this.toProjectInterface(deletedProject);
  }

  public async findByOwnerId(ownerId: string): Promise<(IProject & ITimestamps)[]> {
    const projects = await this.projectModel.find({ ownerId });
    return projects.map((project) => this.toProjectInterface(project));
  }

  public async findByCustomerId(customerId: string): Promise<(IProject & ITimestamps)[]> {
    const projects = await this.projectModel.find({ customerId });
    return projects.map((project) => this.toProjectInterface(project));
  }

  private toProjectInterface(project: ProjectEntity): IProject & ITimestamps {
    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ownerId: project.ownerId,
      status: project.status,
    };
  }
}
