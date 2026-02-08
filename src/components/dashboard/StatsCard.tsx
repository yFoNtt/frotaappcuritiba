import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'primary';
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-3xl font-bold tracking-tight truncate">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs sm:text-sm font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}>
                {trend.positive ? '+' : ''}{trend.value}% vs. mês anterior
              </p>
            )}
          </div>
          <div className={cn("rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0", variantStyles[variant])}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
