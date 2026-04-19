import { z } from 'zod';

/** Validação do texto digitado antes de enviar ao backend / Ollama. */
export const conteudoUsuarioChatAprendizadoSchema = z
  .string()
  .min(1, 'Digite uma mensagem.')
  .max(8000, 'Mensagem muito longa (máx. 8000 caracteres).');
