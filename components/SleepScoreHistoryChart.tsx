import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Label, Cell } from 'recharts';

interface ChartData {
  date: string;
  score: number;
}

interface SleepScoreHistoryChartProps {
  data: ChartData[];
}

const SleepScoreHistoryChart: React.FC<SleepScoreHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-center py-10">Log your sleep to see your score history.</p>;
  }

  const getBarColor = (score: number) => {
    if (score >= 85) return '#34d399'; // emerald-400
    if (score >= 70) return '#fBBF24'; // amber-400
    return '#f87171'; // red-400
  };

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
            formatter={(value: number) => [`${value}/100`, 'Score']}
          />
          <ReferenceLine y={85} stroke="#34d399" strokeDasharray="3 3">
            <Label value="Excellent" position="insideTopLeft" fill="#34d399" fontSize={10} />
          </ReferenceLine>
           <ReferenceLine y={70} stroke="#fBBF24" strokeDasharray="3 3">
             <Label value="Good" position="insideTopLeft" fill="#fBBF24" fontSize={10} />
          </ReferenceLine>
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepScoreHistoryChart;