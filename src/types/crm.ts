export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Task {
  id: string;
  title: string;
  description?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  deal_value: number;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null; // YYYY-MM-DD
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
