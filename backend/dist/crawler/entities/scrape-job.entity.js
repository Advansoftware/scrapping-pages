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
exports.ScrapeJob = exports.ScrapeJobStatus = void 0;
const typeorm_1 = require("typeorm");
var ScrapeJobStatus;
(function (ScrapeJobStatus) {
    ScrapeJobStatus["PENDING"] = "pending";
    ScrapeJobStatus["RUNNING"] = "running";
    ScrapeJobStatus["SUCCESS"] = "success";
    ScrapeJobStatus["FAILED"] = "failed";
})(ScrapeJobStatus || (exports.ScrapeJobStatus = ScrapeJobStatus = {}));
let ScrapeJob = class ScrapeJob {
};
exports.ScrapeJob = ScrapeJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScrapeJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScrapeJob.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScrapeJob.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScrapeJobStatus,
        default: ScrapeJobStatus.PENDING,
    }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ScrapeJob.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ScrapeJob.prototype, "selectorsUpdated", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ScrapeJob.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScrapeJob.prototype, "createdAt", void 0);
exports.ScrapeJob = ScrapeJob = __decorate([
    (0, typeorm_1.Entity)('scrape_jobs')
], ScrapeJob);
//# sourceMappingURL=scrape-job.entity.js.map