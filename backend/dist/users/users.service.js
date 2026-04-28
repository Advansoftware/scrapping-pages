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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("./entities/user.entity");
const user_ai_config_entity_1 = require("./entities/user-ai-config.entity");
const crypto_util_1 = require("../common/crypto.util");
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepo, aiConfigRepo) {
        this.userRepo = userRepo;
        this.aiConfigRepo = aiConfigRepo;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async onModuleInit() {
        const count = await this.userRepo.count();
        if (count === 0) {
            const username = process.env.ADMIN_USER || 'admin';
            const password = process.env.ADMIN_PASSWORD || 'crawler@2024';
            await this.create({ username, password, name: 'Administrador', isAdmin: true });
            this.logger.log(`Default admin user "${username}" created.`);
        }
    }
    async create(dto) {
        const existing = await this.userRepo.findOne({
            where: { username: dto.username },
        });
        if (existing)
            throw new common_1.ConflictException('Username já em uso');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepo.create({
            username: dto.username,
            passwordHash,
            name: dto.name,
            isAdmin: dto.isAdmin ?? false,
        });
        return this.userRepo.save(user);
    }
    async findAll() {
        return this.userRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findById(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return user;
    }
    async findByUsername(username) {
        return this.userRepo.findOne({ where: { username } });
    }
    async validatePassword(user, password) {
        return bcrypt.compare(password, user.passwordHash);
    }
    async update(id, dto) {
        const user = await this.findById(id);
        if (dto.name !== undefined)
            user.name = dto.name;
        if (dto.isActive !== undefined)
            user.isActive = dto.isActive;
        if (dto.isAdmin !== undefined)
            user.isAdmin = dto.isAdmin;
        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 12);
        }
        return this.userRepo.save(user);
    }
    async remove(id) {
        const user = await this.findById(id);
        await this.userRepo.remove(user);
    }
    async setAiConfig(userId, dto) {
        await this.findById(userId);
        let config = await this.aiConfigRepo.findOne({ where: { userId } });
        const encryptedApiKey = (0, crypto_util_1.encrypt)(dto.apiKey);
        if (config) {
            config.provider = dto.provider;
            config.model = dto.model;
            config.encryptedApiKey = encryptedApiKey;
            config.baseUrl = dto.baseUrl ?? null;
            config.isConfigured = true;
        }
        else {
            config = this.aiConfigRepo.create({
                userId,
                provider: dto.provider,
                model: dto.model,
                encryptedApiKey,
                baseUrl: dto.baseUrl ?? null,
                isConfigured: true,
            });
        }
        return this.aiConfigRepo.save(config);
    }
    async getAiConfig(userId) {
        return this.aiConfigRepo.findOne({ where: { userId } });
    }
    decryptApiKey(config) {
        if (!config.encryptedApiKey)
            return null;
        return (0, crypto_util_1.decrypt)(config.encryptedApiKey);
    }
    async deleteAiConfig(userId) {
        const config = await this.aiConfigRepo.findOne({ where: { userId } });
        if (config)
            await this.aiConfigRepo.remove(config);
    }
    toResponse(user) {
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            isActive: user.isActive,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            hasAiConfig: !!user.aiConfig?.isConfigured,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_ai_config_entity_1.UserAiConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map