import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  comoPrisma,
  criarPrismaMock,
  PrismaMock,
} from '../../test/utilitarios/mock-prisma';
import { AutenticacaoServico } from './autenticacao.servico';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcryptMock = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('AutenticacaoServico', () => {
  let prisma: PrismaMock;
  let jwt: { sign: jest.Mock };
  let servico: AutenticacaoServico;

  beforeEach(() => {
    prisma = criarPrismaMock();
    jwt = { sign: jest.fn().mockReturnValue('token-fake') };
    servico = new AutenticacaoServico(comoPrisma(prisma), jwt as unknown as JwtService);
    bcryptMock.hash.mockResolvedValue('hash-fake');
    bcryptMock.compare.mockResolvedValue(true);
  });

  describe('cadastrar', () => {
    it('deve criar usuário e retornar token', async () => {
      const usuarioCriado = {
        id: 'u1',
        nome: 'Igor',
        email: 'igor@example.com',
        criadoEm: new Date(),
      };
      prisma.usuario.create.mockResolvedValue(usuarioCriado);

      const resultado = await servico.cadastrar({
        nome: 'Igor',
        email: 'igor@example.com',
        senha: 'senha123',
      });

      expect(bcryptMock.hash).toHaveBeenCalledWith('senha123', 10);
      expect(prisma.usuario.create).toHaveBeenCalledTimes(1);
      const argumentos = prisma.usuario.create.mock.calls[0][0];
      expect(argumentos.data.nome).toBe('Igor');
      expect(argumentos.data.email).toBe('igor@example.com');
      expect(argumentos.data.senha).toBe('hash-fake');
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'igor@example.com' });
      expect(resultado).toEqual({ usuario: usuarioCriado, token: 'token-fake' });
    });

    it('deve lançar ConflictException quando e-mail já existe (P2002)', async () => {
      const erro = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      });
      prisma.usuario.create.mockRejectedValue(erro);

      await expect(
        servico.cadastrar({ nome: 'Igor', email: 'igor@example.com', senha: '123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('deve repassar erros não tratados', async () => {
      prisma.usuario.create.mockRejectedValue(new Error('falha inesperada'));

      await expect(
        servico.cadastrar({ nome: 'Igor', email: 'igor@example.com', senha: '123456' }),
      ).rejects.toThrow('falha inesperada');
    });
  });

  describe('login', () => {
    it('deve retornar token quando credenciais são válidas', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        nome: 'Igor',
        email: 'igor@example.com',
        senha: 'hash-armazenado',
        criadoEm: new Date(),
      });
      bcryptMock.compare.mockResolvedValue(true);

      const resultado = await servico.login({
        email: 'igor@example.com',
        senha: 'minhaSenha',
      });

      expect(bcryptMock.compare).toHaveBeenCalledWith('minhaSenha', 'hash-armazenado');
      expect(resultado.token).toBe('token-fake');
      expect(resultado.usuario.email).toBe('igor@example.com');
      expect(resultado.usuario).not.toHaveProperty('senha');
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        servico.login({ email: 'n@ex.com', senha: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        nome: 'Igor',
        email: 'igor@example.com',
        senha: 'hash-armazenado',
        criadoEm: new Date(),
      });
      bcryptMock.compare.mockResolvedValue(false);

      await expect(
        servico.login({ email: 'igor@example.com', senha: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
