import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  date: string;
  weight: number;
}

interface WeightHistoryChartProps {
  data: ChartData[];
}

const WeightHistoryChart: React.FC<WeightHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-center py-10">Log your weight to see your history chart.</p>;
  }

  // Sort data chronologically for the line chart
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find min and max to set domain dynamically
  const weights = sortedData.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const yDomain = [
    Math.max(0, Math.floor(minWeight - 2)),
    Math.ceil(maxWeight + 2),
  ];

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={sortedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={yDomain}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} 
            activeDot={{ r: 7 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightHistoryChart;
