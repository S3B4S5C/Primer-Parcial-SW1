import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

function parseOrigins(env?: string): string[] {
  return (env ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo de tu API
  app.setGlobalPrefix('api');

  // CORS HTTP
  const allowed = parseOrigins(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: (origin, cb) => {
      // Permite curl/healthchecks sin Origin
      if (!origin) return cb(null, true);
      if (!allowed.length || allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,              // ok aunque uses JWT por header
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS para Socket.IO (WS)
  app.useWebSocketAdapter(new (class extends IoAdapter {
    createIOServer(port: number, options?: any) {
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
