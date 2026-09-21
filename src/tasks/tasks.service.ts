import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Task } from "./entities/task.entity";
import { Repository } from "typeorm";

@Injectable()
export class TasksService {
    constructor(@InjectRepository(Task) private readonly tasksRepository: Repository<Task>) {}

    findByProject(projectId: number): Promise<Task[]> {
        return this.tasksRepository.find({
            where: { projectId },
            order: { id: 'ASC' },
        });
    }
}