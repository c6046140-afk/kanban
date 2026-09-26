/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Database, Plus, AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from './types/crm';
import { STATUS_COLUMNS } from './utils/formatters';
import {
  fetchAllTasks,
  insertTask,
  updateTask,
  deleteTask,
  getSupabaseClient,
  getSavedConfig,
} from './lib/supabase';
import { Header } from './components/Header';
import { PipelineStats } from './components/PipelineStats';
import { KanbanColumn } from './components/KanbanColumn';
import { TaskModal } from './components/TaskModal';
import { SupabaseModal } from './components/SupabaseModal';

export default function App() {
  // Tasks state initialized to empty array (NO dummy/mock items as requested)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('Não iniciado');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');

  // Supabase Connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Load tasks on startup
  const loadTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    setSyncError(null);

    try {
      const client = getSupabaseClient();
      setIsSupabaseConnected(!!client);

      const result = await fetchAllTasks();
      setTasks(result.tasks);
      setDataSource(result.source);
      if (result.error) {
        setSyncError(result.error);
      }
    } catch (err: any) {
      console.error('Falha ao carregar tarefas:', err);
      setSyncError('Não foi possível sincronizar com o banco.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Set up Supabase Realtime Subscription if client is available
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const channel = client
        .channel('tasks-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => {
            // Reload tasks on remote change
            loadTasks(false);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription not active:', err);
    }
  }, [isSupabaseConnected, loadTasks]);

  // Handlers for Task Actions
  const handleOpenAddTask = (status: TaskStatus = 'Não iniciado') => {
    setEditingTask(null);
    setTargetColumnStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTargetColumnStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (editingTask) {
      // Update existing
      const previousTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData } : t))
      );

      const result = await updateTask(editingTask.id, taskData);
      if (!result.success && result.error) {
        setSyncError(result.error);
      }
    } else {
      // Create new manual task
      const { task: newTask, error } = await insertTask(taskData);
      setTasks((prev) => [newTask, ...prev]);
      if (error) {
        setSyncError(error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirm = window.confirm('Deseja realmente remover esta tarefa?');
    if (!confirm) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteTask(taskId);
    if (!result.success && result.error) {
      setSyncError(result.error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await updateTask(taskId, { status: newStatus });
  };

  const handleDropTask = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    await updateTask(taskId, { status: targetStatus });
  };

  const handleConnectedChange = (connected: boolean) => {
    setIsSupabaseConnected(connected);
    loadTasks(true);
  };

  // Filter tasks based on search & priority
  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchClient = t.client_name?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchClient && !matchDesc && !matchTags) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Contract Compliant Header */}
      <Header
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNewTaskModal={() => handleOpenAddTask('Não iniciado')}
        onRefresh={() => loadTasks(false)}
        isSyncing={isSyncing}
        totalTasks={tasks.length}
      />

      {/* Supabase Status Banner if not connected or error */}
      {!isSupabaseConnected ? (
        <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <span>
                <strong>Pronto para Supabase:</strong> As tarefas criadas estão salvas localmente no navegador. Conecte sua URL e Chave do Supabase para persistir em nuvem.
              </span>
            </div>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="ml-3 shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-200"
            >
              Configurar Supabase
            </button>
          </div>
        </div>
      ) : syncError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Aviso de sincronização: {syncError}. As alterações continuam salvas localmente.
              </span>
            </div>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="ml-3 underline hover:no-underline font-medium"
            >
              Verificar Conexão
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Content Area */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* CRM Pipeline Stats & Filters */}
        <PipelineStats
          tasks={tasks}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
        />

        {/* Kanban Board Container */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {STATUS_COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter((t) => t.status === col.status);
              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  dotColor={col.dotColor}
                  tasks={columnTasks}
                  onAddTask={handleOpenAddTask}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onDropTask={handleDropTask}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-4 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span>CRM Kanban</span>
            <span>·</span>
            <span>Não iniciado / Em Andamento / Finalizado</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:underline flex items-center gap-1"
            >
              <Database className="h-3 w-3" />
              Status do Supabase
            </button>
            <span>·</span>
            <span>Pronto para produção</span>
          </div>
        </div>
      </footer>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialStatus={targetColumnStatus}
        taskToEdit={editingTask}
      />

      {/* Supabase Settings & SQL Migration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectedChange={handleConnectedChange}
      />
    </div>
  );
}
