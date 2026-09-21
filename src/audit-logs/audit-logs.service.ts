import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuditStatus } from "../common/enums/audit-status.enum";
import { AuditLog } from "./entities/audit-log.entity";
import { Repository } from "typeorm";

interface RecordAuditLogInput {
    userId: number | null;
    action: string;
    requestPayload: Record<string, unknown>;
    responsePayload: Record<string, unknown>;
    status: AuditStatus;
    failedReason?: string | null;
}

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog) private readonly auditLogsRepository: Repository<AuditLog>,
    ) {}

    record(input: RecordAuditLogInput): Promise<AuditLog> {
        const log = this.auditLogsRepository.create({
            userId: input.userId,
            action: input.action,
            requestPayload: input.requestPayload,
            responsePayload: input.responsePayload,
            status: input.status,
            failedReason: input.failedReason ?? null,
        });
        return this.auditLogsRepository.save(log);
    }
}