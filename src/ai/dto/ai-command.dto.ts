import { IsString, MinLength } from "class-validator";

export class AiCommandDto {
    @IsString()
    @MinLength(3)
    prompt: string;
}