import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ScrapeJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('scrape_jobs')
export class ScrapeJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  domain: string;

  @Column({
    type: 'enum',
    enum: ScrapeJobStatus,
    default: ScrapeJobStatus.PENDING,
  })
  status: ScrapeJobStatus;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @Column({ default: false })
  selectorsUpdated: boolean;

  @Column({ nullable: true })
  error: string;

  @Column({ nullable: true })
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
