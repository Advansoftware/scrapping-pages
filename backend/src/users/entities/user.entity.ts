import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserAiConfig } from './user-ai-config.entity';
import { ApiToken } from '../../auth/entities/api-token.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john_doe' })
  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isAdmin: boolean;

  @OneToOne(() => UserAiConfig, (config) => config.user, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  aiConfig: UserAiConfig | null;

  @OneToMany(() => ApiToken, (token) => token.user)
  tokens: ApiToken[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
