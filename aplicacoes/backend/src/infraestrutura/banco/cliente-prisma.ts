import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ClientePrisma
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const urlBancoDados = process.env.URL_BANCO_DADOS;

    if (!urlBancoDados) {
      throw new Error(
        'A variavel de ambiente URL_BANCO_DADOS deve estar definida.',
      );
    }

    const adapter = new PrismaPg({ connectionString: urlBancoDados });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
