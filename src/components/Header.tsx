import { Database, Plus, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
  onOpenNewTaskModal: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  totalTasks: number;
}

export function Header({
  isSupabaseConnected,
  onOpenSupabaseModal,
  onOpenNewTaskModal,
  onRefresh,
  isSyncing,
  totalTasks,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a href="/" className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
            Kanban CRM
          </a>
          {/* Subtle storage indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
            />
            <span className="text-xs">
              {isSupabaseConnected ? 'Supabase Conectado' : 'Armazenamento Local'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 text-neutral-900 hover:text-black dark:text-white"
          >
            <Layers className="h-3.5 w-3.5" />
            Quadro Kanban
          </button>
          <button
            onClick={onOpenSupabaseModal}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Banco de Dados
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh / Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            title="Sincronizar tarefas"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Supabase connection button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isSupabaseConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isSupabaseConnected ? 'Supabase Ativo' : 'Conectar Supabase'}
            </span>
          </button>

          {/* New Task Button */}
          <button
            onClick={onOpenNewTaskModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
    </header>
  );
}
