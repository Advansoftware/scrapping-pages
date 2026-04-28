"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
let AnyAuthGuard = class AnyAuthGuard {
    constructor(jwtService, authService, usersService) {
        this.jwtService = jwtService;
        this.authService = authService;
        this.usersService = usersService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] || '';
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'crawler-ai-secret-key' });
                const user = await this.usersService.findById(payload.sub);
                if (!user?.isActive)
                    return false;
                request.user = { id: user.id, username: user.username, name: user.name };
                return true;
            }
            catch {
            }
        }
        const apiKey = request.headers['x-api-key'] || '';
        if (apiKey) {
            const resolvedUser = await this.authService.resolveApiKeyUser(apiKey);
            if (!resolvedUser)
                return false;
            request.user = { id: resolvedUser.id, username: resolvedUser.username, name: resolvedUser.name };
            return true;
        }
        return false;
    }
};
exports.AnyAuthGuard = AnyAuthGuard;
exports.AnyAuthGuard = AnyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        auth_service_1.AuthService,
        users_service_1.UsersService])
], AnyAuthGuard);
//# sourceMappingURL=any-auth.guard.js.map