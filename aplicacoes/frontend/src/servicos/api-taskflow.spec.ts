import { api } from './api-taskflow';

type RespostaFake = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<unknown>;
};

function mockarFetch(resposta: RespostaFake) {
  const fn = jest.fn().mockResolvedValue({
    ok: resposta.ok,
    status: resposta.status ?? (resposta.ok ? 200 : 400),
    statusText: resposta.statusText ?? '',
    json: resposta.json ?? (async () => ({})),
  });
  (globalThis as unknown as { fetch: jest.Mock }).fetch = fn;
  return fn;
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe('api-taskflow', () => {
  it('cadastro: faz POST /auth/cadastro sem expor senha no JSON', async () => {
    const fetchMock = mockarFetch({
      ok: true,
      json: async () => ({ token: 't', usuario: { id: 'u1' } }),
    });

    const resp = await api.cadastro({
      nome: 'Igor',
      email: 'igor@ex.com',
      senha: '123',
    });

    expect(resp).toEqual({ token: 't', usuario: { id: 'u1' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/cadastro');
    expect(init.method).toBe('POST');
    expect(init.headers.get('Content-Type')).toBe('application/json');
    expect(init.headers.get('Authorization')).toBe('Basic aWdvckBleC5jb206MTIz');
    expect(JSON.parse(init.body)).toEqual({
      nome: 'Igor',
      email: 'igor@ex.com',
    });
  });

  it('login: faz POST /auth/login sem expor senha no JSON', async () => {
    const fetchMock = mockarFetch({
      ok: true,
      json: async () => ({ token: 't', usuario: { id: 'u1' } }),
    });

    await api.login({ email: 'a@b.com', senha: 'x' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/login');
    expect(init.method).toBe('POST');
    expect(init.headers.get('Authorization')).toBe('Basic YUBiLmNvbTp4');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com' });
  });

  it('aprendizadoChat: POST /aprendizado/chat sem token e com JSON', async () => {
    const fetchMock = mockarFetch({
      ok: true,
      json: async () => ({ resposta: 'Olá!' }),
    });

    const resp = await api.aprendizadoChat({
      mensagens: [{ papel: 'usuario', conteudo: 'Oi' }],
    });

    expect(resp).toEqual({ resposta: 'Olá!' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/aprendizado/chat');
    expect(init.method).toBe('POST');
    expect(init.headers.get('Authorization')).toBeNull();
    expect(JSON.parse(init.body as string)).toEqual({
      mensagens: [{ papel: 'usuario', conteudo: 'Oi' }],
    });
  });

  it('aprendizadoChat: envia modelo opcional', async () => {
    const fetchMock = mockarFetch({
      ok: true,
      json: async () => ({ resposta: 'ok' }),
    });

    await api.aprendizadoChat({
      mensagens: [{ papel: 'usuario', conteudo: 'x' }],
      modelo: 'llama3.2',
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      mensagens: [{ papel: 'usuario', conteudo: 'x' }],
      modelo: 'llama3.2',
    });
  });

  it('workspacesListar: adiciona Authorization Bearer', async () => {
    const fetchMock = mockarFetch({ ok: true, json: async () => [] });

    await api.workspacesListar('meu-token');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/workspaces');
    expect(init.headers.get('Authorization')).toBe('Bearer meu-token');
  });

  it('tarefaDeletar: usa DELETE e retorna resposta', async () => {
    const fetchMock = mockarFetch({ ok: true, json: async () => ({ mensagem: 'ok' }) });

    const resp = await api.tarefaDeletar('t', 'id1');

    expect(resp).toEqual({ mensagem: 'ok' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('DELETE');
  });

  it('usa NEXT_PUBLIC_API_URL quando definida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.exemplo.com/';
    const fetchMock = mockarFetch({ ok: true, json: async () => [] });

    await api.workspacesListar('t');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.exemplo.com/workspaces');
  });

  it('lança erro com a mensagem do backend quando resposta não é ok', async () => {
    mockarFetch({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({ message: 'E-mail já cadastrado.' }),
    });

    await expect(
      api.cadastro({ nome: 'x', email: 'a@b.com', senha: 'y' }),
    ).rejects.toThrow('E-mail já cadastrado.');
  });

  it('lança erro juntando mensagens array do backend', async () => {
    mockarFetch({
      ok: false,
      status: 400,
      statusText: 'Bad',
      json: async () => ({ message: ['campo a', 'campo b'] }),
    });

    await expect(
      api.cadastro({ nome: 'x', email: 'a@b.com', senha: 'y' }),
    ).rejects.toThrow('campo a, campo b');
  });

  it('traduz erro de credenciais inválidas', async () => {
    mockarFetch({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Credenciais inválidas.' }),
    });

    await expect(api.login({ email: 'a@b.com', senha: 'errada' })).rejects.toThrow(
      'E-mail ou senha inválidos.',
    );
  });

  it('traduz falha de conexão com o backend', async () => {
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.login({ email: 'a@b.com', senha: 'x' })).rejects.toThrow(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
    );
  });

  it('retorna undefined quando status é 204', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: '',
      json: async () => undefined,
    });
    (globalThis as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const resp = await api.tarefaDeletar('t', 'id1');
    expect(resp).toBeUndefined();
  });
});
