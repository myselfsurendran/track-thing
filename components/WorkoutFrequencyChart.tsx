import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface ChartData {
  date: string;
  Strength?: number;
  Cardio?: number;
  Mixed?: number;
  Other?: number;
}

interface WorkoutFrequencyChartProps {
  data: ChartData[];
}

const COLORS = {
  Strength: '#f87171', // red-400
  Cardio: '#60a5fa', // blue-400
  Mixed: '#c084fc', // purple-400
  Other: '#9ca3af', // gray-400
};

const WorkoutFrequencyChart: React.FC<WorkoutFrequencyChartProps> = ({ data }) => {
  const workoutTypes = ['Strength', 'Cardio', 'Mixed', 'Other'];
  const hasData = data && data.some(d => workoutTypes.some(type => d[type as keyof typeof d]));

  if (!hasData) {
    return <p className="text-slate-500 text-center py-10">Log workouts to see your frequency.</p>;
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
            formatter={(value: number, name) => [`${value} workout${value > 1 ? 's' : ''}`, name]}
          />
          <Legend iconType="circle" />
          {workoutTypes.map(type => (
            <Bar key={type} dataKey={type} stackId="a" fill={COLORS[type as keyof typeof COLORS]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkoutFrequencyChart;