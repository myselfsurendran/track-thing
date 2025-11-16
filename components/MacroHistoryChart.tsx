import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroHistoryChartProps {
  data: ChartData[];
}

const MacroHistoryChart: React.FC<MacroHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-center py-10">Log meals to see your macro history.</p>;
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="g" />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}g`]}
          />
          <Legend iconType="circle" />
          <Line type="monotone" dataKey="protein" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="carbs" stroke="#fcd34d" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="fat" stroke="#fda4af" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroHistoryChart;