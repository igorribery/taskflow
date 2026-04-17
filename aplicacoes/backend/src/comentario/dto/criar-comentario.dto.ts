import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarComentarioDto {
  @IsString()
  @IsNotEmpty({ message: 'O texto do comentário é obrigatório.' })
  @MaxLength(4000, { message: 'O comentário deve ter no máximo 4000 caracteres.' })
  texto!: string;
}
