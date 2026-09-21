import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

    findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: { id: true, name: true, email: true, password: true, role: true },
        });
    }

    create(data: Pick<User, 'name' | 'email' | 'password' | 'role'>): Promise<User> {
        const user = this.usersRepository.create(data);
        return this.usersRepository.save(user);
    }
}