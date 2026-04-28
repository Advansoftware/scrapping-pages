import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  username: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Plain-text password (hashed before storage)' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  name: string;

  @ApiPropertyOptional({ example: false, description: 'Grant admin privileges' })
  isAdmin?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Updated' })
  name?: string;

  @ApiPropertyOptional({ example: 'NewPass456!' })
  password?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  isAdmin?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    description: 'Whether an AI provider has been configured for this user',
    example: false,
  })
  hasAiConfig: boolean;
}
