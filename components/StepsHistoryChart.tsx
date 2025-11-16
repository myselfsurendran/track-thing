import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Label } from 'recharts';

interface ChartData {
  date: string;
  steps: number;
}

interface StepsHistoryChartProps {
  data: ChartData[];
}

const StepsHistoryChart: React.FC<StepsHistoryChartProps> = ({ data }) => {
  const hasData = data && data.some(d => d.steps > 0);

  if (!hasData) {
    return <p className="text-slate-500 text-center py-10">Log your steps to see your history.</p>;
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
            formatter={(value: number) => [value, 'Steps']}
          />
           <ReferenceLine y={10000} stroke="#34d399" strokeDasharray="3 3">
            <Label value="10k Goal" position="insideTopLeft" fill="#34d399" fontSize={10} />
          </ReferenceLine>
          <Bar dataKey="steps" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StepsHistoryChart;