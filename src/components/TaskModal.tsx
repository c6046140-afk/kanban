import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Mail, Phone, Tag, AlertCircle } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types/crm';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'created_at'>) => void;
  initialStatus?: TaskStatus;
  taskToEdit?: Task | null;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialStatus = 'Não iniciado',
  taskToEdit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [dealValue, setDealValue] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setStatus(taskToEdit.status);
        setDealValue(taskToEdit.deal_value ? String(taskToEdit.deal_value) : '');
        setPriority(taskToEdit.priority || 'media');
        setClientName(taskToEdit.client_name || '');
        setClientEmail(taskToEdit.client_email || '');
        setClientPhone(taskToEdit.client_phone || '');
        setDueDate(taskToEdit.due_date || '');
        setDescription(taskToEdit.description || '');
        setTags(taskToEdit.tags || []);
      } else {
        setTitle('');
        setStatus(initialStatus);
        setDealValue('');
        setPriority('media');
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setDueDate('');
        setDescription('');
        setTags([]);
      }
      setError(null);
    }
  }, [isOpen, taskToEdit, initialStatus]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }

    const numericDealValue = dealValue ? parseFloat(dealValue.replace(',', '.')) : 0;

    onSave({
      title: title.trim(),
      status,
      priority,
      deal_value: isNaN(numericDealValue) ? 0 : numericDealValue,
      client_name: clientName.trim() || undefined,
      client_email: clientEmail.trim() || undefined,
      client_phone: clientPhone.trim() || undefined,
      due_date: dueDate || null,
      description: description.trim() || undefined,
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {taskToEdit ? 'Editar Tarefa / Oportunidade' : 'Criar Nova Tarefa Manual'}
            </h2>
            <p className="text-xs text-neutral-500">
              Preencha os dados do CRM e acompanhe no funil Kanban
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-sm">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Título da Tarefa / Negociação *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Apresentar proposta comercial para expansão"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Status no Kanban
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                >
                  <option value="Não iniciado">Não iniciado</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            {/* Deal Value & Due Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                  Valor da Negociação (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  Prazo / Data Limite
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                />
              </div>
            </div>

            {/* Client Info Section */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3.5 space-y-3 dark:border-neutral-800 dark:bg-neutral-800/30">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Informações do Cliente / Contato
              </span>

              <div className="space-y-2.5">
                <div>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Nome do cliente ou empresa"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white pl-8 pr-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white pl-8 pr-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="tel"
                      placeholder="Telefone / WhatsApp"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white pl-8 pr-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Observações e Detalhes
              </label>
              <textarea
                rows={3}
                placeholder="Insira detalhes sobre as necessidades do cliente, próximas ações, histórico da reunião..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <Tag className="h-3.5 w-3.5 text-neutral-400" />
                Tags / Marcadores (pressione Enter para adicionar)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Proposta, Reunião, Contrato"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  Adicionar
                </button>
              </div>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/50 px-6 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
