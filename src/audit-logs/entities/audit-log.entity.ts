import { AuditStatus } from "../../common/enums/audit-status.enum";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit-logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User | null;

    @Column({ name: 'user_id', nullable: true, type: 'int' })
    userId: number | null;

    @Column()
    action: string;

    @Column({ type: 'jsonb', name: 'request_payload' })
    requestPayload: Record<string, unknown>;

    @Column({ type: 'jsonb', name: 'response_payload' })
    responsePayload: Record<string, unknown>;

    @Column({ type: 'enum', enum: AuditStatus})
    status: AuditStatus;

    @Column({ type: 'text', name: 'failed_reason', nullable: true })
    failedReason: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}