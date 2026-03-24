import { StatusTarefa } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AtualizarTarefaDto {
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres.' })
  titulo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(StatusTarefa, { message: 'Status inválido. Use TODO, DOING ou DONE.' })
  @IsOptional()
  status?: StatusTarefa;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordem?: number;
}
