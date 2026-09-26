import { TaskPriority, TaskStatus } from '../types/crm';

export function formatCurrencyBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    // If it's YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString?: string | null): boolean {
  if (!dateString) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    return target.getTime() < today.getTime();
  } catch {
    return false;
  }
}

export function isDueToday(dateString?: string | null): boolean {
  if (!dateString) return false;
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return dateString === todayStr;
  } catch {
    return false;
  }
}

export const STATUS_COLUMNS: {
  status: TaskStatus;
  label: string;
  description: string;
  dotColor: string;
  borderColor: string;
}[] = [
  {
    status: 'Não iniciado',
    label: 'Não iniciado',
    description: 'Tarefas planejadas e novos contatos no funil',
    dotColor: 'bg-neutral-400',
    borderColor: 'border-neutral-200',
  },
  {
    status: 'Em Andamento',
    label: 'Em Andamento',
    description: 'Atividades e negociações em execução ativa',
    dotColor: 'bg-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    status: 'Finalizado',
    label: 'Finalizado',
    description: 'Tarefas concluídas e negócios fechados',
    dotColor: 'bg-emerald-600',
    borderColor: 'border-emerald-200',
  },
];

export const PRIORITY_LABELS: Record<TaskPriority, { label: string; textClass: string }> = {
  baixa: { label: 'Baixa', textClass: 'text-neutral-500' },
  media: { label: 'Média', textClass: 'text-neutral-700' },
  alta: { label: 'Alta', textClass: 'text-amber-700' },
  urgente: { label: 'Urgente', textClass: 'text-rose-700' },
};
