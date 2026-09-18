'use client';
import { useLang } from '@/lib/i18nContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Car as CarIcon, PieChart as PieIcon } from 'lucide-react';

// Theme-consistent palette (amber = brand, stone = neutral, used only where meaning is clear)
const DONUT_COLORS_LIGHT = ['#f59e0b', '#10b981', '#d6d3d1']; // active, sold, other
const DONUT_COLORS_DARK  = ['#fbbf24', '#34d399', '#57534e'];

function truncate(str, n = 14) {
  if (!str) return str;
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

// ─── Custom tooltip (theme aware — recharts default tooltip doesn't adapt on its own) ──
function ChartTooltip({ active, payload, label, isDark, suffix = '' }) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  return (
    <div
      className={[
        'rounded-lg px-3 py-2 text-xs shadow-lg border',
        isDark ? 'bg-[#1c1914] border-stone-700 text-stone-100' : 'bg-white border-stone-200 text-stone-800',
      ].join(' ')}
    >
      {label && <p className="font-semibold mb-0.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString?.() ?? p.value}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message, isDark }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className={['w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-stone-800/60' : 'bg-stone-100'].join(' ')}>
        <Icon size={18} className={isDark ? 'text-stone-600' : 'text-stone-300'} />
      </div>
      <p className={['text-xs', isDark ? 'text-stone-600' : 'text-stone-400'].join(' ')}>{message}</p>
    </div>
  );
}

export default function AnalyticsChart({ data, isDark = false }) {
  const { t } = useLang();
  if (!data) {
    return <EmptyState icon={PieIcon} message={t('dashboard.ui.analyticsLoading')} isDark={isDark} />;
  }

  const overview = data.overview ?? {};
  const totalCars       = data.totalCars ?? overview.totalListings ?? 0;
  const activeListings  = data.activeListings ?? overview.activeListings ?? 0;
  const soldListings    = data.soldListings ?? overview.soldListings ?? 0;
  const otherListings   = Math.max(0, totalCars - activeListings - soldListings);

  const topCarsData = (data.topCars ?? [])
    .filter(c => (c.views ?? 0) > 0)
    .map(c => ({
      name: truncate(`${c.brand ?? ''} ${c.model ?? ''}`.trim()),
      fullName: `${c.brand ?? ''} ${c.model ?? ''}`.trim(),
      views: c.views ?? 0,
    }));

  const donutColors = isDark ? DONUT_COLORS_DARK : DONUT_COLORS_LIGHT;
  const donutData = [
    { name: t('dashboard.ui.active'), value: activeListings },
    { name: t('dashboard.ui.sold'),   value: soldListings },
    { name: t('dashboard.ui.other'),  value: otherListings },
  ].filter(d => d.value > 0);

  const axisColor = isDark ? '#78716c' : '#a8a29e';
  const gridColor = isDark ? '#292524' : '#f0ede6';
  const barColor  = isDark ? '#fbbf24' : '#f59e0b';

  const sectionTitle = 'text-sm font-semibold mb-4 flex items-center gap-2';
  const titleColor = isDark ? 'text-stone-200' : 'text-stone-700';

  return (
    <div className="space-y-6">

      {/* ── Top Cars by Views ── */}
      <div>
        <p className={[sectionTitle, titleColor].join(' ')}>
          <CarIcon size={15} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          {t('dashboard.ui.topCarsByViews')}
        </p>
        {topCarsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topCarsData} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: axisColor }}
                interval={0}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(245,158,11,0.06)' }}
                content={<ChartTooltip isDark={isDark} suffix={t('dashboard.ui.viewsSuffix')} />}
              />
              <Bar dataKey="views" name={t('dashboard.ui.views')} fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={CarIcon} message={t('dashboard.ui.noCarViews')} isDark={isDark} />
        )}
      </div>

      <div className={['h-px', isDark ? 'bg-stone-800' : 'bg-stone-100'].join(' ')} />

      {/* ── Listings Composition ── */}
      <div>
        <p className={[sectionTitle, titleColor].join(' ')}>
          <PieIcon size={15} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          {t('dashboard.ui.listingsComposition')}
        </p>
        {donutData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={190} className="sm:!w-1/2">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex sm:flex-col gap-3 sm:gap-2 flex-wrap justify-center">
              {donutData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: donutColors[i % donutColors.length] }} />
                  <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>{d.name}</span>
                  <span className={['font-semibold', isDark ? 'text-stone-200' : 'text-stone-800'].join(' ')}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={PieIcon} message={t('dashboard.ui.noListings')} isDark={isDark} />
        )}
      </div>

    </div>
  );
}