import { LucideIcon } from 'lucide-react';

interface OnboardingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: LucideIcon;
}

export default function OnboardingCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
}: OnboardingCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950 dark:to-lime-950 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 p-8 text-center transition-colors">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-lime-600 rounded-2xl mb-4 shadow-lg">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-lime-600 text-white rounded-lg hover:from-emerald-700 hover:to-lime-700 transition-all shadow-md hover:shadow-lg font-medium"
      >
        {ActionIcon && <ActionIcon className="w-5 h-5" />}
        {actionLabel}
      </button>
    </div>
  );
}
