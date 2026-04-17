import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarListaDto {
  @IsString()
  @IsNotEmpty({ message: 'O título da lista é obrigatório.' })
  @MaxLength(80, { message: 'O título deve ter no máximo 80 caracteres.' })
  titulo!: string;
}
