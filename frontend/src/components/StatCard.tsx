interface StatCardProps {
  title: string;
  value: string | number;
  color?: 'indigo' | 'green' | 'amber' | 'red';
  icon?: string;
}

const colorMap = {
  indigo: 'bg-[#1D4F91]/10 text-[#1D4F91]',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

export default function StatCard({ title, value, color = 'indigo', icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
