/**
 * Simple in-memory metrics service
 * For production: replace with Prometheus/StatsD
 */

interface Metrics {
    [key: string]: number;
}

class MetricsService {
    private metrics: Metrics = {
        webhook_success_total: 0,
        webhook_failure_total: 0,
        pro_users_active: 0,
        offers_ingested_count: 0,
        matches_generated_count: 0,
        applications_created: 0,
        followups_suggested: 0,
        api_requests_total: 0,
    };

    increment(metric: string, value: number = 1) {
        if (!this.metrics[metric]) {
            this.metrics[metric] = 0;
        }
        this.metrics[metric] += value;
    }

    set(metric: string, value: number) {
        this.metrics[metric] = value;
    }

    get(metric: string): number {
        return this.metrics[metric] || 0;
    }

    getAll(): Metrics {
        return { ...this.metrics };
    }

    reset(metric?: string) {
        if (metric) {
            this.metrics[metric] = 0;
        } else {
            Object.keys(this.metrics).forEach(key => {
                this.metrics[key] = 0;
            });
        }
    }
}

export const metrics = new MetricsService();
export default metrics;
