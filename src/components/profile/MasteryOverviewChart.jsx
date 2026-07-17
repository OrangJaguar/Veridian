import { useMemo } from 'react';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useQuery } from '@tanstack/react-query';
import { listAllModules } from '@/api/entities/modules';
import { queryKeys } from '@/api/query-keys';
import { aggregateMasteryByJourney } from '@/utils/stats/aggregateStudyStats';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function MasteryOverviewChart() {
  const { data: journeys = [] } = useJourneys({ archived: false });
  const { data: modules = [] } = useQuery({
    queryKey: queryKeys.catalog.allModules,
    queryFn: listAllModules,
    staleTime: 120_000,
  });

  const data = useMemo(
    () => aggregateMasteryByJourney(journeys, modules),
    [journeys, modules],
  );

  if (!data.length) return null;

  return (
    <div className="profile-chart-wrap">
      <h3 className="profile-chart-title">Mastery by journey</h3>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="journeyTitle"
            width={110}
            tick={{ fontSize: 11, fill: 'var(--text-main)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8rem',
            }}
            formatter={(value) => [`${Math.round(value)}%`, 'Mastery']}
            cursor={{ fill: 'var(--surface-hover)' }}
          />
          <Bar dataKey="mastery" name="Mastery" fill="var(--text-main)" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
