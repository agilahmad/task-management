import { 
    ArgumentsHost, 
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsfilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsfilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        const status =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const payload =
            exception instanceof HttpException
                ? exception.getResponse()
                : { statusCode: status, message: 'Internal server error'};

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(exception instanceof Error ? exception.stack : exception);
        }

        response
            .status(status)
            .json(typeof payload === 'string' ? { statusCode: status, message: payload } : payload);
    }
}