import 'dotenv/config'
import { AuditLog } from '../audit-logs/entities/audit-log.entity'
import { Project } from '../projects/entities/project.entity'
import { Task } from '../tasks/entities/task.entity'
import { User } from '../users/entities/user.entity'
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, Project, Task, AuditLog],
    synchronize: true,
})