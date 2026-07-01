import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Globe, Users, CalendarDays, Smartphone, Monitor, MapPin, Link2 } from 'lucide-react';
import { useSiteVisits } from '@/hooks/useSiteVisits';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function sourceLabel(referrer: string | null, utmSource: string | null): string {
  if (utmSource) return utmSource;
  if (!referrer) return 'Direto';
  try {
    const host = new URL(referrer).hostname.replace('www.', '');
    if (host.includes('google')) return 'Google';
    if (host.includes('whatsapp')) return 'WhatsApp';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook')) return 'Facebook';
    return host;
  } catch {
    return 'Direto';
  }
}

export default function AdminVisits() {
  const { data: visits = [], isLoading } = useSiteVisits();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);
    const uniqueIps = new Set(visits.map((v) => v.ip_address));
    const todayCount = visits.filter((v) => isAfter(new Date(v.created_at), today)).length;
    const last7Count = visits.filter((v) => isAfter(new Date(v.created_at), sevenDaysAgo)).length;
    return {
      total: visits.length,
      uniqueVisitors: uniqueIps.size,
      today: todayCount,
      last7: last7Count,
    };
  }, [visits]);

  const dailySeries = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => startOfDay(subDays(new Date(), 29 - i)));
    return days.map((day) => {
      const dayEnd = subDays(day, -1);
      const count = visits.filter((v) => {
        const d = new Date(v.created_at);
        return d >= day && d < dayEnd;
      }).length;
      return { date: format(day, 'dd/MM'), visitas: count };
    });
  }, [visits]);

  const deviceSplit = useMemo(() => {
    const mobile = visits.filter((v) => v.is_mobile).length;
    const desktop = visits.length - mobile;
    return { mobile, desktop };
  }, [visits]);

  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((v) => {
      const label = v.city ? `${v.city}${v.region ? ` - ${v.region}` : ''}` : null;
      if (!label) return;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [visits]);

  const topSources = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((v) => {
      const label = sourceLabel(v.referrer, v.utm_source);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [visits]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitas ao Site</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acessos às páginas públicas do FrotaApp (visível apenas para administradores).
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total de visitas" value={stats.total} icon={<Globe className="h-8 w-8" />} />
          <StatCard title="IPs únicos" value={stats.uniqueVisitors} icon={<Users className="h-8 w-8" />} />
          <StatCard title="Hoje" value={stats.today} icon={<CalendarDays className="h-8 w-8" />} />
          <StatCard title="Últimos 7 dias" value={stats.last7} icon={<CalendarDays className="h-8 w-8" />} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Visitas por dia (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#visitsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4" /> Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="h-4 w-4" /> Mobile
                </span>
                <Badge variant="secondary">{deviceSplit.mobile}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="h-4 w-4" /> Desktop
                </span>
                <Badge variant="secondary">{deviceSplit.desktop}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" /> Top cidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topCities.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados de localização ainda.</p>
              )}
              {topCities.map(([city, count]) => (
                <div key={city} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{city}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" /> Origem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topSources.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem visitas registradas ainda.</p>
              )}
              {topSources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{source}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Visitas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Dispositivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.slice(0, 50).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(v.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.ip_address}</TableCell>
                      <TableCell>
                        {v.city ? `${v.city}${v.region ? ` - ${v.region}` : ''}` : '—'}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">{v.path}</TableCell>
                      <TableCell>{sourceLabel(v.referrer, v.utm_source)}</TableCell>
                      <TableCell>{v.is_mobile ? 'Mobile' : 'Desktop'}</TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma visita registrada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
