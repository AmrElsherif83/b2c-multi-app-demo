import { ENVIRONMENTS } from '../config/b2cApps';
import type { Environment } from '../config/b2cApps';

interface EnvBadgeProps {
  env:       Environment;
  size?:     'sm' | 'md' | 'lg';
  className?: string;
}

export default function EnvBadge({ env, size = 'md', className = '' }: EnvBadgeProps) {
  const envDef = ENVIRONMENTS.find(e => e.id === env);

  const sizeClass =
    size === 'lg' ? 'px-3 py-1 text-sm font-bold' :
    size === 'sm' ? 'px-1.5 py-0.5 text-xs'       :
                    'px-2 py-0.5 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${envDef?.color ?? ''} ${sizeClass} ${className}`}
    >
      {env.toUpperCase()}
    </span>
  );
}
