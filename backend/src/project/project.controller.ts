import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { IProject } from './interfaces/project.interface';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectRequestDto } from './dto/create-project.dto';
import { LoggerService } from '@/logger/logger.service';
import { UpdateProjectRequestDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly logger: LoggerService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/v1')
  public async create(@Body() project: CreateProjectRequestDto): Promise<IProject> {
    this.logger.log('Creating project', project);
    return await this.projectService.create(project);
  }

  @Put('/:id/v1')
  public async update(
    @Param('id') id: string,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log('Updating project', project);
    const updatedProject = await this.projectService.update(id, project);
    if (!updatedProject) {
      throw new NotFoundException(`Project with id: ${id} not found`);
    }
    return new ProjectResponseDto(updatedProject);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id/v1')
  public async findById(@Param('id') id: string): Promise<IProject | null> {
    const project = await this.projectService.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with id: ${id} not found`);
    }
    return project;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/owners/:ownerId/v1')
  public async findByOwnerId(@Param('ownerId') ownerId: string): Promise<IProject[]> {
    return await this.projectService.findByOwnerId(ownerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/customers/:customerId/v1')
  public async findByCustomerId(@Param('customerId') customerId: string): Promise<IProject[]> {
    return await this.projectService.findByCustomerId(customerId);
  }
}
