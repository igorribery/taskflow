import { Body, Controller, Get, Post } from '@nestjs/common';
import { AprendizadoServico } from './aprendizado.servico';
import { EnviarChatAprendizadoDto } from './dto/enviar-chat-aprendizado.dto';
import { RagServico } from './rag/rag.servico';

/**
 * Chat local via Ollama — apenas para aprendizado / desenvolvimento.
 * Não exige JWT; não altera dados do TaskFlow.
 */
@Controller('aprendizado')
export class AprendizadoControlador {
  constructor(
    private readonly servico: AprendizadoServico,
    private readonly rag: RagServico,
  ) {}

  @Post('chat')
  chat(@Body() dto: EnviarChatAprendizadoDto) {
    return this.servico.enviarChat(dto);
  }

  /** Estado do índice RAG (em memória). */
  @Get('rag/status')
  ragStatus() {
    return this.rag.status();
  }

  /** Lê README, .cursorrules e arquivos-chave; gera embeddings via Ollama. Rode após `ollama pull nomic-embed-text`. */
  @Post('rag/reindex')
  async ragReindex() {
    return this.rag.reindexar();
  }
}
