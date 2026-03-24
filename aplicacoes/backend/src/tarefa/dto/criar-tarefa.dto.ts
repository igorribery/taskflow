import { StatusTarefa } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CriarTarefaDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres.' })
  titulo!: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(StatusTarefa, { message: 'Status inválido. Use TODO, DOING ou DONE.' })
  @IsOptional()
  status?: StatusTarefa;
}
