import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('api_tokens')
export class ApiToken {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Production scraper token' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Token for the licita-sync microservice' })
  @Column({ nullable: true })
  description: string | null;

  /** Raw token value — stored in plain text (UUID-based hex, treated as a secret). */
  @Column({ unique: true })
  token: string;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.tokens, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
