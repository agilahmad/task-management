import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entities/project.entity";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { TasksModule } from "../tasks/tasks.module";
import { PassportModule } from "@nestjs/passport";

@Module({
    imports: [TypeOrmModule.forFeature([Project]), TasksModule, PassportModule],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule {}