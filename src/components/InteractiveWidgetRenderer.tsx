import React from 'react';
import { BarChart2, PieChart, Activity, Cpu } from 'lucide-react';

export interface ChartWidgetData {
  type: 'bar' | 'pie' | 'line' | 'metric';
  title: string;
  labels: string[];
  values: number[];
  metricLabel?: string;
  metricValue?: string;
}

interface InteractiveWidgetRendererProps {
  data: ChartWidgetData;
}

export const InteractiveWidgetRenderer: React.FC<InteractiveWidgetRendererProps> = ({ data }) => {
  const values = data.values || [];
  const labels = data.labels || [];
  const maxValue = Math.max(...values, 1);

  return (
    <div className="w-full border border-[#2b2b2b] rounded-xl bg-[#080808] p-4 my-3 space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          {data.type === 'bar' && <BarChart2 className="w-4 h-4 text-white" />}
          {data.type === 'pie' && <PieChart className="w-4 h-4 text-white" />}
          {data.type === 'line' && <Activity className="w-4 h-4 text-white" />}
          {data.type === 'metric' && <Cpu className="w-4 h-4 text-white" />}
          <h4 className="font-semibold text-white text-xs">{data.title}</h4>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">Live Widget</span>
      </div>

      {data.type === 'bar' && (
        <div className="space-y-2 pt-1">
          {labels.map((lbl, idx) => {
            const val = values[idx] || 0;
            const pct = Math.round((val / maxValue) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-300">
                  <span>{lbl}</span>
                  <span className="font-mono text-white">{val}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.type === 'metric' && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center space-y-1">
          <span className="text-xs text-gray-400 block">{data.metricLabel || data.title}</span>
          <span className="text-2xl font-bold text-white tracking-tight font-mono">{data.metricValue || data.values[0]}</span>
        </div>
      )}
    </div>
  );
};
