import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ModuloPrincipal } from './modulos/modulo-principal';

async function inicializar() {
  const aplicacao = await NestFactory.create(ModuloPrincipal);

  aplicacao.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  aplicacao.enableCors({
    origin: process.env.URL_FRONTEND ?? 'http://localhost:3000',
    credentials: true,
  });

  const porta = process.env.PORTA ?? 3001;
  await aplicacao.listen(porta);
  console.log(`🚀 Backend rodando em http://localhost:${porta}`);
}

void inicializar();
