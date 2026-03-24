import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  adapter: () => {
    const urlBancoDados = process.env.URL_BANCO_DADOS;
    if (!urlBancoDados) {
      throw new Error(
        'A variavel de ambiente URL_BANCO_DADOS deve estar definida.',
      );
    }
    return Promise.resolve(new PrismaPg({ connectionString: urlBancoDados }));
  },
});
