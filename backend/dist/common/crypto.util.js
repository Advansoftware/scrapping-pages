"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
function getKey() {
    const secret = process.env.ENCRYPTION_KEY ||
        'crawler-ai-default-encryption-key-32bytes!';
    return (0, crypto_1.scryptSync)(secret, 'crawler-ai-salt', 32);
}
function encrypt(text) {
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}
function decrypt(text) {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, getKey(), iv);
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString();
}
//# sourceMappingURL=crypto.util.js.map