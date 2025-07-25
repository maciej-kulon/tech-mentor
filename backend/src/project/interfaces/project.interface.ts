import { ProjectStatus } from '../enums/project-status.enum';

export interface IProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
}
