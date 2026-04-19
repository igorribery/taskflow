import {
  Injectable,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnviarChatAprendizadoDto } from './dto/enviar-chat-aprendizado.dto';
import { PROMPT_SISTEMA_TASKFLOW } from './prompt-sistema-taskflow';
import { RagServico } from './rag/rag.servico';

const mapaPapelOllama: Record<
  'usuario' | 'assistente' | 'sistema',
  'user' | 'assistant' | 'system'
> = {
  usuario: 'user',
  assistente: 'assistant',
  sistema: 'system',
};

type RespostaOllamaChat = {
  message?: { role?: string; content?: string };
  error?: string;
};

@Injectable()
export class AprendizadoServico {
  constructor(
    private readonly config: ConfigService,
    private readonly rag: RagServico,
  ) {}

  async enviarChat(dto: EnviarChatAprendizadoDto): Promise<{ resposta: string }> {
    const base = (
      this.config.get<string>('OLLAMA_URL') ?? 'http://127.0.0.1:11434'
    ).replace(/\/$/, '');
    const modelo =
      dto.modelo?.trim() ||
      this.config.get<string>('OLLAMA_MODELO') ||
      'llama3.2';

    const usarRag = dto.usarRag !== false;
    let sistema = PROMPT_SISTEMA_TASKFLOW;
    if (usarRag) {
      const ultimaPerguntaUsuario = [...dto.mensagens]
        .reverse()
        .find((m) => m.papel === 'usuario');
      if (ultimaPerguntaUsuario) {
        const ctx = await this.rag.contextoParaPergunta(ultimaPerguntaUsuario.conteudo);
        if (ctx) {
          sistema += `\n\n## Trechos do repositório indexados\n${ctx}`;
        }
      }
    }

    const mensagensOllama: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: sistema },
      ...dto.mensagens.map((m) => ({
        role: mapaPapelOllama[m.papel],
        content: m.conteudo,
      })),
    ];

    const corpo = {
      model: modelo,
      stream: false,
      messages: mensagensOllama,
    };

    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
    } catch (erro: unknown) {
      const mensagem =
        erro instanceof Error ? erro.message : 'Falha de rede ao contatar o Ollama.';
      throw new ServiceUnavailableException(
        `Não foi possível conectar ao Ollama em ${base}. Inicie o Ollama e verifique OLLAMA_URL. Detalhe: ${mensagem}`,
      );
    }

    const texto = await res.text();
    let json: RespostaOllamaChat;
    try {
      json = JSON.parse(texto) as RespostaOllamaChat;
    } catch {
      throw new BadGatewayException(
        'Resposta inválida do Ollama. Verifique se o serviço está atualizado.',
      );
    }

    if (!res.ok) {
      const detalhe = json.error ?? texto.slice(0, 500);
      throw new BadGatewayException(
        `Ollama retornou erro (${res.status}): ${detalhe}`,
      );
    }

    const resposta = json.message?.content?.trim();
    if (!resposta) {
      throw new BadGatewayException(
        'O Ollama não retornou conteúdo na resposta. Tente outro modelo ou mensagem.',
      );
    }

    return { resposta };
  }
}
