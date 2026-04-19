import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class MensagemChatAprendizadoDto {
  @IsIn(['usuario', 'assistente', 'sistema'], {
    message: 'O papel deve ser usuario, assistente ou sistema.',
  })
  papel!: 'usuario' | 'assistente' | 'sistema';

  @IsString()
  @IsNotEmpty({ message: 'O conteúdo da mensagem não pode ser vazio.' })
  @MaxLength(32000, { message: 'O conteúdo excede o tamanho máximo permitido.' })
  conteudo!: string;
}

export class EnviarChatAprendizadoDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Envie ao menos uma mensagem.' })
  @ValidateNested({ each: true })
  @Type(() => MensagemChatAprendizadoDto)
  mensagens!: MensagemChatAprendizadoDto[];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  modelo?: string;

  /** Quando true (padrão), injeta trechos do repositório (RAG) no prompt. */
  @IsOptional()
  @IsBoolean()
  usarRag?: boolean;
}
