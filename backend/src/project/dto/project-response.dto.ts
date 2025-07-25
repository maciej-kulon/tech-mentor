import { ITimestamps } from '@/common-interfaces/timestamps.interface';
import { IProject } from '../interfaces/project.interface';
import { ProjectStatus } from '../enums/project-status.enum';

export class ProjectResponseDto implements IProject, ITimestamps {
  public id: string;
  public name: string;
  public description: string;
  public ownerId: string;
  public status: ProjectStatus;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(project: IProject & ITimestamps) {
    this.id = project.id;
    this.name = project.name;
    this.description = project.description;
    this.ownerId = project.ownerId;
    this.status = project.status;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }
}
