import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',')
      : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) => {
        const mapped = errors.flatMap((err) => {
          const messages = err.constraints
            ? Object.values(err.constraints)
            : [];
          const children = err.children ?? [];
          const childMsgs = children
            .filter((c) => c.constraints)
            .flatMap((c) => Object.values(c.constraints!));
          const allMsgs = [...messages, ...childMsgs];
          if (allMsgs.length === 0) return [];
          return [
            {
              field: err.property,
              message: allMsgs[0],
            },
          ];
        });
        return new BadRequestException({
          statusCode: 400,
          message: '유효성 검증 실패',
          errors: mapped,
        });
      },
    }),
  );

  // Custom global exception filter can be added later when needed.

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
