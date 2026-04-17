import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AtualizarTarefaDto {
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres.' })
  titulo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUUID('4', { message: 'listaId inválido.' })
  @IsOptional()
  listaId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordem?: number;
}
