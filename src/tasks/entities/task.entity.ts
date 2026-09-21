import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "../../projects/entities/project.entity";
import { TaskPriority } from "../../common/enums/task.-priority.enum";
import { User } from "../../users/entities/user.entity";
import { TaskStatus } from "../../common/enums/task-status.enum";

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({ name: 'project_id' })
    projectId: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
    status: TaskStatus;
    
    @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
    priority: TaskPriority;

    @ManyToOne(() => User, (user) => user.tasks, {nullable: true})
    @JoinColumn({ name: 'assignee_id'})
    assignee: User | null;

    @Column({ name: 'assignee_id', nullable: true, type: 'int'})
    assigneeId: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}