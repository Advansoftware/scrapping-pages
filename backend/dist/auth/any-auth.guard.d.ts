import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
export declare class AnyAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly authService;
    private readonly usersService;
    constructor(jwtService: JwtService, authService: AuthService, usersService: UsersService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
