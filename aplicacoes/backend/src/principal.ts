import 'reflect-metadata';
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
    origin: process.env.URL_FRONTEND?.split(',').map((url) => url.trim()) ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
  });

  const porta = process.env.PORTA ?? 3001;
  await aplicacao.listen(porta);
  console.log(`🚀 Backend rodando em http://localhost:${porta}`);
}

void inicializar();
