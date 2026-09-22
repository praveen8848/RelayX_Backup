import { ElementType } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ElementType;
  colorClass: string;
}

export default function MetricCard({ title, value, icon: Icon, colorClass }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border p-5 rounded-xl flex flex-col gap-3 transition-colors hover:border-gray-600">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{title}</span>
        <div className={`p-2 rounded-lg bg-surfaceHover ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <span className="text-3xl font-bold text-white">{value !== undefined ? value : '-'}</span>
    </div>
  );
}