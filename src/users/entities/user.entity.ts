import { Role } from "../../common/enums/role.enum";
import { Project } from "../../projects/entities/project.entity";
import { Task } from "../../tasks/entities/task.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(() => Project, (project) => project.createdBy)
    projects: Project[];

    @OneToMany(() => Task, (task) => task.assignee)
    tasks: Task[];
}