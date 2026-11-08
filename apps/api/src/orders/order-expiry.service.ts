import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';

const DEFAULT_EXPIRY_HOURS = 24;
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Releases stock reserved by abandoned unpaid orders.
 *
 * Orders decrement stock when they are created. Without this sweep, a customer
 * who opens a gateway and never returns would keep that stock reserved forever.
 * The job is enabled in production by default and can be disabled with
 * `ORDER_EXPIRY_ENABLED=false`; tests and local development stay off so seeded
 * PENDING orders remain visible.
 */
@Injectable()
export class OrderExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly orders: OrdersService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (!this.isEnabled()) return;

    const hours = this.numberFromConfig(
      'ORDER_EXPIRY_HOURS',
      DEFAULT_EXPIRY_HOURS,
    );
    const intervalMs = this.numberFromConfig(
      'ORDER_EXPIRY_INTERVAL_MS',
      DEFAULT_INTERVAL_MS,
    );

    this.timer = setInterval(() => {
      void this.sweep(hours);
    }, intervalMs);
    // Do not keep the process alive just for this timer.
    this.timer.unref?.();
    this.logger.log(
      `Order expiry sweep enabled (older than ${hours}h, every ${Math.round(intervalMs / 60000)}m)`,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Runs one sweep. Public so it can be exercised by tests. */
  async sweep(expiryHours = DEFAULT_EXPIRY_HOURS): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000);
      const ids = await this.orders.findExpiredPendingIds(cutoff);
      let cancelled = 0;

      for (const id of ids) {
        try {
          if (await this.orders.cancelExpiredPendingOrder(id)) cancelled += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to expire order ${id}: ${message}`);
        }
      }

      if (cancelled > 0) {
        this.logger.log(`Released stock for ${cancelled} expired order(s)`);
      }
      return cancelled;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Order expiry sweep failed: ${message}`);
      return 0;
    } finally {
      this.running = false;
    }
  }

  private isEnabled(): boolean {
    const explicit = this.config.get<string>('ORDER_EXPIRY_ENABLED');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private numberFromConfig(key: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(key));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
