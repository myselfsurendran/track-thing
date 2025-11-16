import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Label } from 'recharts';

interface ChartData {
  date: string;
  water: number;
}

interface WaterHistoryChartProps {
  data: ChartData[];
  goal: number;
}

const WaterHistoryChart: React.FC<WaterHistoryChartProps> = ({ data, goal }) => {
  const hasData = data && data.some(d => d.water > 0);

  if (!hasData) {
    return <p className="text-slate-500 text-center py-10">Log your water intake to see your history.</p>;
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="ml" />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
            formatter={(value: number) => [`${value} ml`, 'Water']}
          />
           <ReferenceLine y={goal} stroke="#0ea5e9" strokeDasharray="3 3">
            <Label value="Goal" position="insideTopLeft" fill="#0ea5e9" fontSize={10} />
          </ReferenceLine>
          <Bar dataKey="water" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaterHistoryChart;
