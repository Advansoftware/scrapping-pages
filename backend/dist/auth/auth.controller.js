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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class LoginDto {
}
class CreateTokenDto {
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(body) {
        const user = await this.authService.validateUser(body.username, body.password);
        if (!user)
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        return this.authService.login(user);
    }
    async createToken(user, body) {
        return this.authService.createToken(user.id, body.name, body.description);
    }
    async listTokens(user, userId) {
        const filterUserId = userId ? +userId : user.id;
        return this.authService.listTokens(filterUserId);
    }
    async revokeToken(id) {
        return this.authService.revokeToken(+id);
    }
    async deleteToken(id) {
        await this.authService.deleteToken(+id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Login and obtain a JWT access token',
        description: `Authenticates a user and returns a short-lived JWT (24 h).
Use the returned \`access_token\` as a \`Bearer\` header for all admin endpoints.`,
    }),
    (0, swagger_1.ApiBody)({ type: LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIs...',
                user: { id: 1, username: 'admin', name: 'Administrador' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new API token',
        description: `Generates a new API token linked to a user.
The token can be used in the \`X-API-Key\` header for service-to-service calls.
**The full token value is only returned once at creation time — store it securely.**`,
    }),
    (0, swagger_1.ApiBody)({ type: CreateTokenDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token created',
        schema: {
            example: {
                id: 1,
                name: 'Production scraper',
                token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
                userId: 1,
                createdAt: '2026-04-28T00:00:00.000Z',
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createToken", null);
__decorate([
    (0, common_1.Get)('tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'List API tokens',
        description: 'Returns all tokens. Admins see all; regular users see only their own.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token list (actual token value is never included)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listTokens", null);
__decorate([
    (0, common_1.Delete)('tokens/:id/revoke'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a token (keeps the record, sets isActive=false)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeToken", null);
__decorate([
    (0, common_1.Delete)('tokens/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete a token' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteToken", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map