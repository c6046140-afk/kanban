import React, { useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { Task, TaskStatus } from '../types/crm';
import { TaskCard } from './TaskCard';
import { formatCurrencyBRL } from '../utils/formatters';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  dotColor: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

export function KanbanColumn({
  status,
  label,
  dotColor,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onDropTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const columnTotalValue = tasks.reduce((sum, t) => sum + (t.deal_value || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl border bg-neutral-100/60 p-3 transition-colors dark:bg-neutral-900/40 ${
        isDragOver
          ? 'border-neutral-900 bg-neutral-100 ring-2 ring-neutral-400 dark:border-white dark:bg-neutral-800'
          : 'border-neutral-200/80 dark:border-neutral-800'
      }`}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {label}
          </h2>
          <span className="font-mono text-xs text-neutral-500 tabular-nums">
            ({tasks.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {columnTotalValue > 0 && (
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 tabular-nums" title="Valor total da coluna">
              {formatCurrencyBRL(columnTotalValue)}
            </span>
          )}
          <button
            onClick={() => onAddTask(status)}
            title={`Adicionar tarefa em ${label}`}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cards List or Empty State */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-[300px] max-h-[calc(100vh-280px)] pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300/80 p-6 text-center dark:border-neutral-800">
            <div className="rounded-full bg-neutral-200/50 p-2.5 text-neutral-400 dark:bg-neutral-800">
              <FolderPlus className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Nenhuma tarefa em {label}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Crie manualmente ou arraste um card para cá
            </p>
            <button
              onClick={() => onAddTask(status)}
              className="mt-3 inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Plus className="h-3 w-3" />
              Adicionar tarefa
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
