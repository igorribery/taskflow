import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolverRaizProjeto } from './resolver-raiz-projeto';

/** Arquivos relativos à raiz do monorepo — documentação e superfície da API. */
const ARQUIVOS_RELATIVOS = [
  'README.md',
  '.cursorrules',
  'aplicacoes/backend/prisma/schema.prisma',
  'aplicacoes/backend/src/modulos/modulo-principal.ts',
  'aplicacoes/backend/src/principal.ts',
  'aplicacoes/frontend/src/servicos/api-taskflow.ts',
] as const;

const TAMANHO_TRECHO = 900;
const SOBREPOSICAO = 120;
const TOP_K = 5;
const MAX_CONTEXT_CHARS = 6000;

type TrechoIndexado = {
  caminhoRelativo: string;
  ordem: number;
  texto: string;
  embedding: number[];
};

function fatiarTexto(conteudo: string): string[] {
  const limpo = conteudo.replace(/\r\n/g, '\n').trim();
  if (!limpo) return [];
  const partes: string[] = [];
  let inicio = 0;
  while (inicio < limpo.length) {
    const fim = Math.min(inicio + TAMANHO_TRECHO, limpo.length);
    partes.push(limpo.slice(inicio, fim));
    if (fim >= limpo.length) break;
    inicio = fim - SOBREPOSICAO;
    if (inicio < 0) inicio = 0;
  }
  return partes;
}

function similaridadeCosseno(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let p = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    p += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : p / d;
}

@Injectable()
export class RagServico {
  private trechos: TrechoIndexado[] = [];

  constructor(private readonly config: ConfigService) {}

  status(): { trechosIndexados: number; raiz: string } {
    return {
      trechosIndexados: this.trechos.length,
      raiz: this.obterRaiz(),
    };
  }

  private obterRaiz(): string {
    return resolverRaizProjeto(
      process.cwd(),
      this.config.get<string>('RAG_CAMINHO_RAIZ'),
    );
  }

  private urlOllama(): string {
    return (this.config.get<string>('OLLAMA_URL') ?? 'http://127.0.0.1:11434').replace(
      /\/$/,
      '',
    );
  }

  private modeloEmbeddings(): string {
    return (
      this.config.get<string>('OLLAMA_MODELO_EMBEDDINGS') ?? 'nomic-embed-text'
    );
  }

  private async gerarEmbedding(texto: string): Promise<number[]> {
    const base = this.urlOllama();
    const modelo = this.modeloEmbeddings();
    let res: Response;
    try {
      res = await fetch(`${base}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelo, prompt: texto }),
      });
    } catch (erro: unknown) {
      const m = erro instanceof Error ? erro.message : String(erro);
      throw new ServiceUnavailableException(
        `Falha ao chamar embeddings no Ollama (${base}). Instale o modelo: ollama pull ${this.modeloEmbeddings()}. Detalhe: ${m}`,
      );
    }

    const raw = await res.text();
    let json: { embedding?: number[]; error?: string };
    try {
      json = JSON.parse(raw) as { embedding?: number[]; error?: string };
    } catch {
      throw new BadGatewayException('Resposta inválida de /api/embeddings.');
    }
    if (!res.ok) {
      throw new BadGatewayException(
        json.error ??
          `Ollama embeddings erro ${res.status}. Rode: ollama pull ${this.modeloEmbeddings()}`,
      );
    }
    const emb = json.embedding;
    if (!emb?.length) {
      throw new BadGatewayException(
        `Embedding vazio. Confirme o modelo ${modelo} com: ollama pull ${modelo}`,
      );
    }
    return emb;
  }

  /**
   * Releitura dos arquivos + embeddings. Pode levar alguns segundos.
   */
  async reindexar(): Promise<{ trechosIndexados: number; arquivosLidos: number }> {
    const raiz = this.obterRaiz();
    const novos: TrechoIndexado[] = [];
    let arquivosLidos = 0;

    for (const rel of ARQUIVOS_RELATIVOS) {
      const abs = path.join(raiz, rel);
      let conteudo: string;
      try {
        conteudo = await fs.readFile(abs, 'utf-8');
      } catch {
        continue;
      }
      arquivosLidos++;
      const fatias = fatiarTexto(conteudo);
      let ordem = 0;
      for (const texto of fatias) {
        const embedding = await this.gerarEmbedding(texto);
        novos.push({ caminhoRelativo: rel, ordem, texto, embedding });
        ordem++;
      }
    }

    this.trechos = novos;
    return { trechosIndexados: this.trechos.length, arquivosLidos };
  }

  /**
   * Monta texto de contexto para injetar no system prompt (top-K trechos mais similares à pergunta).
   */
  async contextoParaPergunta(pergunta: string): Promise<string> {
    const q = pergunta.trim();
    if (!q || this.trechos.length === 0) return '';

    let embPergunta: number[];
    try {
      embPergunta = await this.gerarEmbedding(q);
    } catch {
      return '';
    }

    const ranqueados = this.trechos
      .map((t) => ({
        t,
        score: similaridadeCosseno(embPergunta, t.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const blocos: string[] = [];
    let total = 0;
    for (const { t, score } of ranqueados) {
      const cabecalho = `[${t.caminhoRelativo} #${t.ordem} | relevância ${score.toFixed(3)}]`;
      const pedaco = `${cabecalho}\n${t.texto}`;
      if (total + pedaco.length > MAX_CONTEXT_CHARS) break;
      blocos.push(pedaco);
      total += pedaco.length;
    }

    return blocos.join('\n\n---\n\n');
  }
}
