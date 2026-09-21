import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Role } from '../../common/enums/role.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { TaskPriority } from '../../common/enums/task.-priority.enum';


const SEED_PASSWORD = 'password123';

async function seed() {
    const dataSource = await AppDataSource.initialize();

    const userRepo = dataSource.getRepository(User);
    const projectRepo = dataSource.getRepository(Project);
    const taskRepo = dataSource.getRepository(Task);

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const admin = await userRepo.save(
        userRepo.create({
            name: 'Admin',
            email: 'admin@example.com',
            password: passwordHash,
            role: Role.ADMIN,
        }),
    );

    const user = await userRepo.save(
        userRepo.create({
            name: 'User',
            email: 'user@example.com',
            password: passwordHash,
            role: Role.USER,
        }),
    );

    const project = await projectRepo.save(
        projectRepo.create({
            name: 'Website Revamp',
            description: 'Redesign website perusahaan',
            createdById: admin.id
        }),
    );

    await taskRepo.save(
        taskRepo.create({
            projectId: project.id,
            title: 'Setup repository',
            description: 'Inisialisasi repository dan CI/CD',
            status: TaskStatus.DONE,
            priority: TaskPriority.MEDIUM,
            assigneeId: user.id,
        }),
    );

    await taskRepo.save(
        taskRepo.create({
            projectId: project.id,
            title: 'Fix Login Bug',
            description: 'Investigasi bug login yang muncul intermiten',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            assigneeId: user.id,
        }),
    );

    console.log('Seed selesai. Kredensial untuk testing:');
    console.log(`   Admin -> admin@example.com / ${SEED_PASSWORD}`);
    console.log(`   User -> user@example.com / ${SEED_PASSWORD}`);
    console.log(`   Project ID: ${project.id}`);

    await dataSource.destroy();
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Seed gagal:', error);
        process.exit(1);
    });