import { useState, useEffect } from 'react';
import { X, Database, Check, Copy, AlertTriangle, ExternalLink, RefreshCw, KeyRound, Globe, Terminal } from 'lucide-react';
import { getSavedConfig, saveConfig, clearConfig, testConnection, SUPABASE_SETUP_SQL } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedChange: (connected: boolean) => void;
}

export function SupabaseModal({ isOpen, onClose, onConnectedChange }: SupabaseModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableReady?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'creds' | 'sql'>('creds');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSavedConfig();
      setUrl(cfg.url || '');
      setAnonKey(cfg.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do projeto e a chave anônima (anon public key).',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      saveConfig(url.trim(), anonKey.trim());
      onConnectedChange(true);
    }
  };

  const handleDisconnect = () => {
    clearConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConnectedChange(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Conexão com o Supabase</h2>
              <p className="text-xs text-neutral-500">Sincronize suas tarefas e pipeline diretamente no banco de dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-100 px-6 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('creds')}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'creds'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Configuração de Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'sql'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Script SQL &amp; Políticas (RLS)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">
          {activeTab === 'creds' ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400">
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Como obter suas credenciais:</p>
                <ol className="mt-1.5 list-inside list-decimal space-y-1">
                  <li>No painel do Supabase, clique em seu Projeto.</li>
                  <li>Acesse <strong>Project Settings &gt; API</strong>.</li>
                  <li>Copie o <strong>Project URL</strong> e a chave <strong>Project API Keys &gt; anon (public)</strong>.</li>
                </ol>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <Globe className="h-3.5 w-3.5 text-neutral-400" />
                  Project URL do Supabase
                </label>
                <input
                  type="text"
                  placeholder="https://exemplo-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <KeyRound className="h-3.5 w-3.5 text-neutral-400" />
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
                />
              </div>

              {testResult && (
                <div
                  className={`rounded-lg border p-3.5 text-xs ${
                    testResult.success
                      ? testResult.tableReady === false
                        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      testResult.tableReady === false ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      )
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">{testResult.message}</p>
                      {testResult.tableReady === false && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('sql')}
                          className="mt-1 inline-flex items-center gap-1 font-semibold underline"
                        >
                          Ver Script SQL para criar a tabela agora &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Execute este script no <strong>SQL Editor</strong> do seu Supabase para criar a tabela com os campos exatos do CRM:
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  {copiedSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-lg border border-neutral-200 bg-neutral-900 p-3.5 dark:border-neutral-800">
                <pre className="max-h-60 overflow-x-auto text-xs text-neutral-200 font-mono">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Passo a passo: Supabase &gt; SQL Editor &gt; New Query &gt; Colar &gt; Run</span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-neutral-700 hover:underline dark:text-neutral-300"
                >
                  Abrir Supabase
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-6 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-xs text-neutral-500 hover:text-rose-600 hover:underline"
          >
            Limpar / Desconectar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Testando...
                </>
              ) : (
                'Salvar e Conectar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
