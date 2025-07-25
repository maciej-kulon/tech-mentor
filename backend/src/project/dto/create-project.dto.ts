import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';

export class CreateProjectRequestDto {
  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsNotEmpty()
  @IsString()
  public description: string;

  @IsNotEmpty()
  @IsString()
  public ownerId: string;

  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  public status: ProjectStatus;
}
