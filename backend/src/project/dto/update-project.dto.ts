import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';

export class UpdateProjectRequestDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public description?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  public status?: ProjectStatus;
}
