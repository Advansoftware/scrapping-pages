import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('crawler_configs')
@Unique(['domain', 'pageType'])
export class CrawlerConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  domain: string;

  /**
   * Page template type within the domain.
   * Examples: 'product', 'home', 'listing'
   * Multiple page types for the same domain each get their own selectors.
   */
  @Column({ default: 'product' })
  pageType: string;

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
