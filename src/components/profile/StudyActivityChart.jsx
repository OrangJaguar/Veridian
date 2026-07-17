import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAllSessions } from '@/api/entities/sessions';
import { queryKeys } from '@/api/query-keys';
import { aggregateSessionsByDay } from '@/utils/stats/aggregateStudyStats';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function StudyActivityChart() {
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.catalog.allSessions,
    queryFn: listAllSessions,
    staleTime: 60_000,
  });

  const data = useMemo(() => aggregateSessionsByDay(sessions, 30), [sessions]);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (!sessions.length) return null;

  return (
    <div className="profile-chart-wrap">
      <h3 className="profile-chart-title">Study activity (last 30 days)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxCount + 1]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
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
            labelStyle={{ color: 'var(--text-main)' }}
            cursor={{ fill: 'var(--surface-hover)' }}
          />
          <Bar dataKey="count" name="Sessions" fill="var(--text-main)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
