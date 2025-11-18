import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  date: string;
  calories?: number | null;
}

interface CalorieHistoryChartProps {
  data: ChartData[];
}

const CalorieHistoryChart: React.FC<CalorieHistoryChartProps> = ({ data }) => {
  const safeData = Array.isArray(data)
    ? data.map(d => ({ date: d.date ?? '', calories: Number(d.calories ?? 0) }))
    : [];

  if (!safeData.length || safeData.every(d => !d.calories)) {
    return <p className="text-slate-500 text-center py-10">Log meals to see your calorie history.</p>;
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={safeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
            formatter={(value: number) => [`${value.toFixed(0)} kcal`, 'Calories']}
          />
          <Bar dataKey="calories" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalorieHistoryChart;
