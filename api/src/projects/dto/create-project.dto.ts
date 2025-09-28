import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsString() @IsNotEmpty()
  workspaceId!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsString() @IsOptional()
  description?: string;
}
