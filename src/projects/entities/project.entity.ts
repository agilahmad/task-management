import { Task } from "../../tasks/entities/task.entity";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable:true })
    description: string | null;

    @ManyToOne(() => User, (user) => user.projects)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by' })
    createdById: number;

    @OneToMany(() => Task, (task) => task.project)
    tasks: Task[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}