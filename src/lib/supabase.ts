import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task, TaskStatus } from '../types/crm';

const CONFIG_STORAGE_KEY = 'crm_supabase_config';
const LOCAL_TASKS_STORAGE_KEY = 'crm_kanban_tasks';

export const SUPABASE_SETUP_SQL = `-- ==============================================================================
-- CRM KANBAN - SCRIPT COMPLETO COM POLÍTICAS DE ARMAZENAMENTO E SEGURANÇA (RLS)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE TAREFAS / OPORTUNIDADES
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    deal_value NUMERIC(14, 2) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('Não iniciado', 'Em Andamento', 'Finalizado')),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    due_date DATE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- Índices para otimizar busca e ordenação no Kanban
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date);

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 2. POLÍTICAS DE SEGURANÇA (RLS) DA TABELA 'tasks'
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Acesso anônimo total CRM" ON public.tasks;
DROP POLICY IF EXISTS "CRM Permitir Leitura de Tarefas" ON public.tasks;
DROP POLICY IF EXISTS "CRM Permitir Inserção de Tarefas" ON public.tasks;
DROP POLICY IF EXISTS "CRM Permitir Atualização de Tarefas" ON public.tasks;
DROP POLICY IF EXISTS "CRM Permitir Exclusão de Tarefas" ON public.tasks;

-- Políticas granulares salvas:
-- 2.1 Permissão de Leitura (SELECT)
CREATE POLICY "CRM Permitir Leitura de Tarefas"
ON public.tasks
FOR SELECT
USING (true);

-- 2.2 Permissão de Inserção (INSERT)
CREATE POLICY "CRM Permitir Inserção de Tarefas"
ON public.tasks
FOR INSERT
WITH CHECK (true);

-- 2.3 Permissão de Atualização (UPDATE)
CREATE POLICY "CRM Permitir Atualização de Tarefas"
ON public.tasks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 2.4 Permissão de Exclusão (DELETE)
CREATE POLICY "CRM Permitir Exclusão de Tarefas"
ON public.tasks
FOR DELETE
USING (true);

-- 3. CRIAÇÃO DO BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE)
-- Cria o bucket 'crm-files' para anexos, documentos e propostas do CRM
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'crm-files',
    'crm-files',
    true,
    52428800, -- Limite de 50MB por arquivo
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- 4. POLÍTICAS DE ARMAZENAMENTO (RLS NO STORAGE.OBJECTS)
-- Habilita segurança de armazenamento no bucket 'crm-files'
DROP POLICY IF EXISTS "CRM Storage Permitir Download Publico" ON storage.objects;
DROP POLICY IF EXISTS "CRM Storage Permitir Upload" ON storage.objects;
DROP POLICY IF EXISTS "CRM Storage Permitir Atualizacao" ON storage.objects;
DROP POLICY IF EXISTS "CRM Storage Permitir Exclusao" ON storage.objects;

-- 4.1 Permitir que qualquer usuário visualize/baixe arquivos do bucket crm-files
CREATE POLICY "CRM Storage Permitir Download Publico"
ON storage.objects
FOR SELECT
USING (bucket_id = 'crm-files');

-- 4.2 Permitir upload de novos arquivos no bucket crm-files
CREATE POLICY "CRM Storage Permitir Upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'crm-files');

-- 4.3 Permitir atualização de arquivos existentes no bucket crm-files
CREATE POLICY "CRM Storage Permitir Atualizacao"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'crm-files')
WITH CHECK (bucket_id = 'crm-files');

-- 4.4 Permitir remoção de arquivos no bucket crm-files
CREATE POLICY "CRM Storage Permitir Exclusao"
ON storage.objects
FOR DELETE
USING (bucket_id = 'crm-files');

-- 5. HABILITAR SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
`;

export interface StoredConfig {
  url: string;
  anonKey: string;
}

export function getSavedConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase do localStorage', e);
  }

  // Fallback to Vite env variables if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveConfig(url: string, anonKey: string): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  supabaseClientInstance = null; // reset client instance
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  supabaseClientInstance = null;
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (
    config.url === 'https://your-project-id.supabase.co' ||
    config.anonKey === 'your-anon-public-key'
  ) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (err) {
      console.error('Falha ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  return supabaseClientInstance;
}

export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; tableReady?: boolean }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Anon Key são obrigatórias.' };
  }

  try {
    const client = createClient(url.trim(), anonKey.trim(), {
      auth: { persistSession: false },
    });

    // Test query on tasks table
    const { data, error } = await client.from('tasks').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, connection to Supabase worked, but SQL needs to run
      if (error.code === '42P01' || error.message?.includes('relation "public.tasks" does not exist') || error.message?.includes('tasks')) {
        return {
          success: true,
          tableReady: false,
          message: 'Conectado ao Supabase com sucesso! Atenção: a tabela "tasks" ainda não existe. Execute o script SQL no painel do Supabase.',
        };
      }
      return {
        success: false,
        message: `Erro na autenticação com o Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      tableReady: true,
      message: 'Conectado com sucesso ao Supabase e tabela "tasks" pronta!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na conexão: ${err.message || 'Verifique se a URL e a Chave estão corretas.'}`,
    };
  }
}

// Local storage fallback handlers (no dummy data, starts empty)
export function getLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler tarefas locais:', e);
    return [];
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas locais:', e);
  }
}

// Unified task operations that automatically choose Supabase or Local Storage
export async function fetchAllTasks(): Promise<{ tasks: Task[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase query error, falling back to local:', error);
        return {
          tasks: getLocalTasks(),
          source: 'local',
          error: error.message,
        };
      }

      const mapped: Task[] = (data || []).map((row: any) => ({
        id: String(row.id),
        title: row.title,
        description: row.description || '',
        client_name: row.client_name || '',
        client_email: row.client_email || '',
        client_phone: row.client_phone || '',
        deal_value: Number(row.deal_value || 0),
        status: row.status as TaskStatus,
        priority: row.priority || 'media',
        due_date: row.due_date || null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || undefined,
      }));

      // Keep local copy synced in case offline later
      saveLocalTasks(mapped);

      return { tasks: mapped, source: 'supabase' };
    } catch (err: any) {
      console.error('Erro ao buscar do Supabase:', err);
      return {
        tasks: getLocalTasks(),
        source: 'local',
        error: err.message,
      };
    }
  }

  return { tasks: getLocalTasks(), source: 'local' };
}

export async function insertTask(taskData: Omit<Task, 'id' | 'created_at'>): Promise<{ task: Task; error?: string }> {
  const client = getSupabaseClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newTask: Task = {
    ...taskData,
    id,
    created_at: now,
    updated_at: now,
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('tasks')
        .insert([
          {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description || null,
            client_name: newTask.client_name || null,
            client_email: newTask.client_email || null,
            client_phone: newTask.client_phone || null,
            deal_value: newTask.deal_value || 0,
            status: newTask.status,
            priority: newTask.priority,
            due_date: newTask.due_date || null,
            tags: newTask.tags || [],
            created_at: newTask.created_at,
            updated_at: newTask.updated_at,
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('Erro ao inserir no Supabase, salvando localmente:', error);
        // Fallback local
        const local = getLocalTasks();
        saveLocalTasks([newTask, ...local]);
        return { task: newTask, error: error.message };
      }

      // Sync local cache
      const local = getLocalTasks();
      saveLocalTasks([newTask, ...local]);
      return { task: newTask };
    } catch (err: any) {
      const local = getLocalTasks();
      saveLocalTasks([newTask, ...local]);
      return { task: newTask, error: err.message };
    }
  }

  // Local storage save
  const local = getLocalTasks();
  const updated = [newTask, ...local];
  saveLocalTasks(updated);
  return { task: newTask };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      const payload: any = { ...updates, updated_at: now };
      delete payload.id;
      delete payload.created_at;

      const { error } = await client
        .from('tasks')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('Erro ao atualizar no Supabase, atualizando localmente:', error);
        updateLocalTask(id, updates);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      updateLocalTask(id, updates);
      return { success: false, error: err.message };
    }
  }

  updateLocalTask(id, updates);
  return { success: true };
}

function updateLocalTask(id: string, updates: Partial<Task>): void {
  const tasks = getLocalTasks();
  const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
  saveLocalTasks(updated);
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('tasks').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar no Supabase:', error);
        deleteLocalTask(id);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      deleteLocalTask(id);
      return { success: false, error: err.message };
    }
  }

  deleteLocalTask(id);
  return { success: true };
}

function deleteLocalTask(id: string): void {
  const tasks = getLocalTasks();
  const updated = tasks.filter((t) => t.id !== id);
  saveLocalTasks(updated);
}
