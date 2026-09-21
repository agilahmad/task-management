import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import { Role } from "../common/enums/role.enum";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";


const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email ini sudah terdaftar');
        }

        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const user =await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            role: dto.role ?? Role.USER,
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const payload = { sub: user.id, email: user.email, role: user.role};

        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, name: user.name, email: user.email, role: user.role},
        };
    }
}