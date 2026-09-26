import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Task, TaskPriority } from '../types/crm';
import { formatCurrencyBRL } from '../utils/formatters';

interface PipelineStatsProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPriority: TaskPriority | 'all';
  onPriorityChange: (priority: TaskPriority | 'all') => void;
}

export function PipelineStats({
  tasks,
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
}: PipelineStatsProps) {
  const totalTasks = tasks.length;
  const totalValue = tasks.reduce((sum, t) => sum + (t.deal_value || 0), 0);

  const closedTasks = tasks.filter((t) => t.status === 'Finalizado');
  const closedValue = closedTasks.reduce((sum, t) => sum + (t.deal_value || 0), 0);

  const inProgressTasks = tasks.filter((t) => t.status === 'Em Andamento');
  const inProgressValue = inProgressTasks.reduce((sum, t) => sum + (t.deal_value || 0), 0);

  const notStartedTasks = tasks.filter((t) => t.status === 'Não iniciado');

  return (
    <div className="space-y-4">
      {/* Metrics Row (Single elevation, hairline borders) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500">Total de Tarefas</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-neutral-900 tabular-nums dark:text-white">
              {totalTasks}
            </span>
            <span className="text-[11px] text-neutral-400">
              {notStartedTasks.length} não iniciadas
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500">Pipeline Total</span>
          <div className="mt-1">
            <span className="font-mono text-lg font-bold text-neutral-900 tabular-nums dark:text-white">
              {formatCurrencyBRL(totalValue)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500">Em Andamento</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-blue-700 tabular-nums dark:text-blue-400">
              {formatCurrencyBRL(inProgressValue)}
            </span>
            <span className="font-mono text-xs text-neutral-400 tabular-nums">
              ({inProgressTasks.length})
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500">Finalizado</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
              {formatCurrencyBRL(closedValue)}
            </span>
            <span className="font-mono text-xs text-neutral-400 tabular-nums">
              ({closedTasks.length})
            </span>
          </div>
        </div>
      </div>

      {/* Search and Interactive Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por tarefa, cliente ou notas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300/80 bg-white pl-8 pr-8 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-200/80 bg-neutral-100/70 p-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
          <span className="px-2 text-[11px] font-medium text-neutral-400">Prioridade:</span>
          {(['all', 'urgente', 'alta', 'media', 'baixa'] as const).map((p) => {
            const labelMap: Record<string, string> = {
              all: 'Todas',
              urgente: 'Urgente',
              alta: 'Alta',
              media: 'Média',
              baixa: 'Baixa',
            };
            const isActive = selectedPriority === p;
            return (
              <button
                key={p}
                onClick={() => onPriorityChange(p)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {labelMap[p]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
