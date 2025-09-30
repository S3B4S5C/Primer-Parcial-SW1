"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
function parseOrigins(env) {
    return (env ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const allowed = parseOrigins(process.env.CORS_ORIGINS);
    app.enableCors({
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true);
            if (!allowed.length || allowed.includes(origin))
                return cb(null, true);
            return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useWebSocketAdapter(new (class extends platform_socket_io_1.IoAdapter {
        createIOServer(port, options) {
            const server = super.createIOServer(port, {
                cors: {
                    origin: allowed.length ? allowed : true,
                    methods: ['GET', 'POST'],
                    credentials: true,
                },
                ...options,
            });
            return server;
        }
    })(app));
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map