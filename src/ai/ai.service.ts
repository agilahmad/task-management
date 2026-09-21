import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { AI_PROVIDER } from "./providers/ai-provider";
import type { AiProvider } from "./providers/ai-provider";
import { DataSource } from "typeorm";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AiAction, aiResponseSchema } from "./schemas/ai-action.schema";
import { AuditStatus } from "../common/enums/audit-status.enum";
import { Project } from "../projects/entities/project.entity";
import { User } from "../users/entities/user.entity";
import { Task } from "../tasks/entities/task.entity";

const SYSTEM_PROMPT = `Kamu adalah asisten yang mengubah instruksi bahasa natural menjadi daftar operasi CRUD pada tabel Task.

Balas HANYA dengan JSON valid tanpa teks tambahan apapun, mengikuti struktur ini persis:
{
    "actions": [
        { "action": "create_task", "data": { "project_id": number, "title": string, "description"?: string, "status"?: "todo"|"in_progress"|"done", "priority"?: "low"|"medium"|"high", "assignee_id"?: number } },
         { "action": "update_task", "task_id": number, "data": { "title"?: string, "description"?: string, "status"?: "todo"|"in_progress"|"done", "priority"?: "low"|"medium"|"high", "assignee_id"?: number } },
    ]
}

Aturan wajib:
 - Hanya boleh menghasilkan action "create_task" atau "update_task".
 - Tidak pernah menghasilkan operasi apa pun terhadap tabel User (misalnya menghapus atau mengubah user).
 - Jangan menyertakan field selain yang didefinisikan di atas.
 - Jika instruksi tidak berkaitan dengan Task, kembalikan { "action": []}.`;

export interface ExecutedAction {
   action: 'create_task' | 'update_task';
   taskId: number;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
        private readonly dataSource: DataSource,
        private readonly auditLogsService: AuditLogsService,
    ) {}

    async runCommand(prompt: string, userId: number){
        let responsePayload: Record<string, unknown> = {};

        try {
            const rawContent = await this.aiProvider.generateActions(prompt, SYSTEM_PROMPT);
            const parsedJson = this.safeParseJson(rawContent);

            const validated = aiResponseSchema.safeParse(parsedJson);
            if (!validated.success) {
                throw new BadRequestException('Invalid AI command response');
            }
            responsePayload = validated.data;

            if (validated.data.actions.length === 0) {
                await this.auditLogsService.record({
                    userId,
                    action: 'AI_COMMAND',
                    requestPayload: { prompt},
                    responsePayload,
                    status: AuditStatus.SUCCESS,
                });
                return { message: 'Tidak ada operasi Task yang relevan dari prompt ini', executed: [] };
            }

            const executed = await this.executeActions(validated.data.actions);

            await this.auditLogsService.record({
                userId,
                action: 'AI_COMMAND',
                requestPayload: { prompt },
                responsePayload,
                status: AuditStatus.SUCCESS
            });

            return { message: 'AI command berhasil dijalankan', executed};
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Unknown error';

            await this.auditLogsService.record({
                userId,
                action: 'AI_COMMAND',
                requestPayload: { prompt },
                responsePayload,
                status: AuditStatus.FAILED,
                failedReason: reason,
            });

            if (error instanceof BadRequestException) {
                throw error
            }

            this.logger.error(`AI command gagal: ${reason}`);
            throw new BadRequestException('Invalid AI command response');
        }
    }

    private safeParseJson(raw: string): unknown {
        try {
            return JSON.parse(raw);
        } catch {
            throw new BadRequestException('Invalid AI command response');
        }
    }

    private async executeActions(actions: AiAction[]): Promise<ExecutedAction[]> {
        return this.dataSource.transaction(async (manager) => {
            const executed: ExecutedAction[] = [];

            for (const action of actions) {
                if (action.action === 'create_task') {
                    const project = await manager.findOne(Project, { where: { id: action.data.project_id } });
                    if (!project) {
                        throw new BadRequestException(`Project ID ${action.data.project_id} tidak ditemukan`);
                    }

                    if (action.data.assignee_id) {
                        const assigneeExists = await manager.exists(User, { where: { id: action.data.assignee_id } });
                        if (!assigneeExists) {
                            throw new BadRequestException(`User ID ${action.data.assignee_id} tidak ditemukan`);
                        }
                    }

                    const task = manager.create(Task, {
                        projectId: action.data.project_id,
                        title: action.data.title,
                        description: action.data.description,
                        status: action.data.status,
                        priority: action.data.priority,
                        assigneeId: action.data.assignee_id ?? null,
                    });
                    const saved =await manager.save(Task, task);
                    executed.push({ action:'create_task', taskId: saved.id });
                    continue;
                }

                const task = await manager.findOne(Task, { where: { id: action.task_id } });
                if (!task) {
                    throw new BadRequestException(`Task ID ${action.task_id} tidak ditemukan`);
                }

                if (action.data.assignee_id) {
                    const assigneeExists = await manager.exists(User, { where: { id: action.data.assignee_id } });
                    if (!assigneeExists) {
                        throw new BadRequestException(`User ID ${action.data.assignee_id} tidak ditemukan`);
                    }
                }

                Object.assign(task, action.data);
                const saved = await manager.save(Task, task);
                executed.push({ action: 'update_task', taskId: saved.id });
            }

            return executed;
        });
    }
}