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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const api_token_entity_1 = require("./entities/api-token.entity");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(jwtService, tokenRepo, usersService) {
        this.jwtService = jwtService;
        this.tokenRepo = tokenRepo;
        this.usersService = usersService;
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (!user || !user.isActive)
            return null;
        const valid = await this.usersService.validatePassword(user, password);
        return valid ? user : null;
    }
    async login(user) {
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, username: user.username, name: user.name },
        };
    }
    async resolveApiKeyUser(token) {
        const staticToken = process.env.API_TOKEN_SECRET;
        if (staticToken && token === staticToken) {
            const admin = await this.usersService.findByUsername(process.env.ADMIN_USER || 'admin');
            if (admin) {
                await this.tokenRepo
                    .createQueryBuilder()
                    .update()
                    .set({ lastUsedAt: new Date() })
                    .where('token = :token', { token })
                    .execute();
            }
            return admin;
        }
        const apiToken = await this.tokenRepo.findOne({
            where: { token, isActive: true },
            relations: ['user'],
        });
        if (!apiToken || !apiToken.user?.isActive)
            return null;
        await this.tokenRepo.update(apiToken.id, { lastUsedAt: new Date() });
        return this.usersService.findById(apiToken.userId);
    }
    async validateApiToken(token) {
        const user = await this.resolveApiKeyUser(token);
        return !!user;
    }
    async createToken(userId, name, description) {
        const token = (0, uuid_1.v4)().replace(/-/g, '');
        const apiToken = await this.tokenRepo.save({ userId, name, description: description ?? null, token });
        return {
            id: apiToken.id,
            name: apiToken.name,
            description: apiToken.description,
            token,
            userId: apiToken.userId,
            createdAt: apiToken.createdAt,
        };
    }
    async listTokens(userId) {
        const where = {};
        if (userId !== undefined)
            where.userId = userId;
        const tokens = await this.tokenRepo.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
        return tokens.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            isActive: t.isActive,
            lastUsedAt: t.lastUsedAt,
            createdAt: t.createdAt,
            userId: t.userId,
            username: t.user?.username,
            tokenPreview: t.token.substring(0, 8) + '...',
        }));
    }
    async revokeToken(id) {
        const token = await this.tokenRepo.findOne({ where: { id } });
        if (!token)
            return { message: 'Token não encontrado' };
        await this.tokenRepo.update(id, { isActive: false });
        return { message: 'Token revogado com sucesso' };
    }
    async deleteToken(id) {
        const token = await this.tokenRepo.findOne({ where: { id } });
        if (!token)
            return { message: 'Token não encontrado' };
        await this.tokenRepo.remove(token);
        return { message: 'Token removido com sucesso' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(api_token_entity_1.ApiToken)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_2.Repository,
        users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map