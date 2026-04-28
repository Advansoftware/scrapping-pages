import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('crawler_configs')
export class CrawlerConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  domain: string;

  @Column({ type: 'jsonb' })
  selectors: Record<string, string>;

  @Column({ default: 1 })
  version: number;

  @Column({ default: 0 })
  failCount: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastTestedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
