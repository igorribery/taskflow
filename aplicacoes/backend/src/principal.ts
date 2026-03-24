import { NestFactory } from '@nestjs/core';
import { ModuloPrincipal } from './modulos/modulo-principal';

async function inicializar() {
  const aplicacao = await NestFactory.create(ModuloPrincipal);
  await aplicacao.listen(process.env.PORTA ?? 3001);
}

void inicializar();
