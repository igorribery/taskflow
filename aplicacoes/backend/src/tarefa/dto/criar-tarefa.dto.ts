import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CriarTarefaDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres.' })
  titulo!: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUUID('4', { message: 'listaId inválido.' })
  @IsOptional()
  listaId?: string;
}
