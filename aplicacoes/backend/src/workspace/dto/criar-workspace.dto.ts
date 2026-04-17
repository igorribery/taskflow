import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarWorkspaceDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do workspace é obrigatório.' })
  @MaxLength(80, { message: 'O nome deve ter no máximo 80 caracteres.' })
  nome!: string;
}
