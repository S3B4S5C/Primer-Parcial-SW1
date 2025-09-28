"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = exports.LocalAuthGuard = void 0;
const passport_1 = require("@nestjs/passport");
class LocalAuthGuard extends (0, passport_1.AuthGuard)('local') {
}
exports.LocalAuthGuard = LocalAuthGuard;
class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
}
exports.JwtAuthGuard = JwtAuthGuard;
//# sourceMappingURL=guards.js.map