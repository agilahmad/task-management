import { TaskStatus } from '../../common/enums/task-status.enum'
import { TaskPriority } from '../../common/enums/task.-priority.enum'
import { z } from 'zod'

const createTaskActionSchema = z.object({
    action: z.literal('create_task'),
    data: z.object({
        project_id: z.number().int().positive(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        assignee_id: z.number().int().positive().optional(),
    }),
});

const updateTaskActionSchema = z.object ({
    action: z.literal('update_task'),
    task_id: z.number().int().positive(),
    data: z
        .object({
            title: z.string().trim().min(1).optional(),
            description: z.string().trim().optional(),
            status: z.nativeEnum(TaskStatus).optional(),
            priority: z.nativeEnum(TaskPriority).optional(),
            assignee_id: z.number().int().positive().nullable().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'data pada update_task tidak boleh kosong',
        }),
});

export const aiActionSchema = z.discriminatedUnion('action', [
    createTaskActionSchema,
    updateTaskActionSchema,
]);

export const aiResponseSchema = z.object({
    actions: z.array(aiActionSchema),
});

export type AiAction = z.infer<typeof aiActionSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;

