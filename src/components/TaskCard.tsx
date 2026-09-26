import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Edit3,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Circle,
  MoreHorizontal
} from 'lucide-react';
import { Task, TaskStatus } from '../types/crm';
import { formatCurrencyBRL, formatDateBR, isOverdue, isDueToday, PRIORITY_LABELS } from '../utils/formatters';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
}: TaskCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.media;
  const overdue = isOverdue(task.due_date);
  const dueToday = isDueToday(task.due_date);

  const availableStatuses: TaskStatus[] = ['Não iniciado', 'Em Andamento', 'Finalizado'];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative cursor-grab rounded-lg border border-neutral-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      {/* Top row: Priority & Status quick-actions */}
      <div className="mb-2 flex items-center justify-between text-xs">
        {/* Zero-Pill Priority metadata */}
        <div className="flex items-center gap-1.5">
          <span className={`font-medium ${priorityInfo.textClass}`}>
            {priorityInfo.label}
          </span>
          {task.deal_value > 0 && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200 tabular-nums">
                {formatCurrencyBRL(task.deal_value)}
              </span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            title="Editar tarefa"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Excluir tarefa"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600 dark:hover:bg-neutral-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        onClick={() => onEdit(task)}
        className="cursor-pointer text-sm font-semibold text-neutral-900 hover:underline dark:text-white"
      >
        {task.title}
      </h3>

      {/* Description Preview (if present) */}
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
          {task.description}
        </p>
      )}

      {/* Client Information */}
      {(task.client_name || task.client_phone || task.client_email) && (
        <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          {task.client_name ? (
            <span className="truncate font-medium text-neutral-700 dark:text-neutral-300 max-w-[180px]">
              {task.client_name}
            </span>
          ) : (
            <span className="text-neutral-400">Sem cliente</span>
          )}

          <div className="flex items-center gap-2">
            {task.client_phone && (
              <a
                href={`tel:${task.client_phone}`}
                title={`Ligar / WhatsApp: ${task.client_phone}`}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {task.client_email && (
              <a
                href={`mailto:${task.client_email}`}
                title={`E-mail: ${task.client_email}`}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Metadata Footer: Due Date & Status Mover */}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-xs text-neutral-500 dark:border-neutral-800">
        {/* Due date */}
        {task.due_date ? (
          <div className="flex items-center gap-1 font-mono text-xs tabular-nums">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <span
              className={
                overdue
                  ? 'font-medium text-rose-600 dark:text-rose-400'
                  : dueToday
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'text-neutral-600 dark:text-neutral-400'
              }
            >
              {formatDateBR(task.due_date)}
              {overdue && ' (Atrasado)'}
              {dueToday && ' (Hoje)'}
            </span>
          </div>
        ) : (
          <span className="text-neutral-400">Sem prazo</span>
        )}

        {/* Status transition dropdown / switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            title="Alterar status"
          >
            <span>Mudar status</span>
            <MoreHorizontal className="h-3 w-3" />
          </button>

          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <div className="px-2.5 py-1 text-[11px] font-medium text-neutral-400">
                  Mover para:
                </div>
                {availableStatuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onStatusChange(task.id, st);
                      setShowStatusMenu(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                      task.status === st
                        ? 'font-medium text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <span>{st}</span>
                    {task.status === st && <span className="text-xs text-emerald-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
