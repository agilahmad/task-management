import { Injectable, NotFoundException } from "@nestjs/common";
import { Project } from "./entities/project.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    ) {}

    findAll(): Promise<Project[]> {
        return this.projectRepository.find({ order: { id: 'ASC' } });
    }

    async findOneOrFail(id: number): Promise<Project> {
        const project = await this.projectRepository.findOne({ where: { id } });
        if (!project) {
            throw new NotFoundException(`Project dengan ID ${id} tidak ditemukan`);
        }
        return project;
    }

    create(dto: CreateProjectDto, createdById: number): Promise<Project> {
        const project = this.projectRepository.create({ ...dto, createdById });
        return this.projectRepository.save(project);
    }

    async update(id: number, dto: UpdateProjectDto): Promise<Project> {
        const project = await this.findOneOrFail(id);
        Object.assign(project, dto);
        return this.projectRepository.save(project);
    }

    async remove(id: number): Promise<void> {
        const project = await this.findOneOrFail(id);
        await this.projectRepository.remove(project);
    }
}