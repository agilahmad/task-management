import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ProjectsService } from "./projects.service";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";
import { CreateProjectDto } from "./dto/create-project.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { TasksService } from "../tasks/tasks.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly tasksService: TasksService,
    ) {}

    @Roles(Role.ADMIN)
    @Post()
    create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
        return this.projectsService.create(dto, user.id);
    }

    @Get()
    findAll() {
        return this.projectsService.findAll();
    }

    @Roles(Role.ADMIN)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.findOneOrFail(id);
    }

    @Roles(Role.ADMIN)
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
        return this.projectsService.update(id, dto);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.projectsService.remove(id);
        return { message: 'Project berhasil dihapus' };
    }

    @Get(':id/tasks')
    async findTasks(@Param('id', ParseIntPipe) id: number) {
        await this.projectsService.findOneOrFail(id);
        return this.tasksService.findByProject(id);
    }
}