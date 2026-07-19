import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, FileText, Search, Code, Check } from 'lucide-react';
import { Template } from '../types';

export const Templates: React.FC = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate, showToast, askConfirmation } = useApp();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  // Filter templates
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setName('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, tName: string) => {
    askConfirmation({
      title: 'Hapus Template',
      message: `Apakah Anda yakin ingin menghapus template "${tName}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: () => deleteTemplate(id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      showToast('Harap lengkapi semua field!', 'warning');
      return;
    }

    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, name, content });
    } else {
      addTemplate({ name, content });
    }
    setIsModalOpen(false);
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => prev + ` ${variable}`);
  };

  return (
    <div id="templates-view" className="p-4 space-y-4 overflow-hidden flex flex-col flex-1">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg shadow-xs shrink-0">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Cari template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Template</span>
        </button>
      </div>

      {/* Grid of Templates cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Tidak ada template.</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                id={`template-card-${template.id}`}
                className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-400/30 transition-all card-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wide truncate pr-3">
                      📁 {template.name}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(template)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 rounded cursor-pointer transition-colors"
                        title="Edit Template"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.name)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded cursor-pointer transition-colors"
                        title="Hapus Template"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed bg-gray-50/50 dark:bg-zinc-900/50 p-2 rounded border border-gray-100 dark:border-zinc-800/60 font-sans italic whitespace-pre-wrap">
                    "{template.content}"
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-1.5 text-[9px] text-gray-400">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider">Placeholder:</span>
                  {['{{nama}}', '{{sales}}', '{{tanggal}}'].map((v) => {
                    const isUsed = template.content.includes(v);
                    return (
                      <span
                        key={v}
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          isUsed
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100/30'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                        }`}
                      >
                        {v}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                {editingTemplate ? '✏️ Edit Template' : '➕ Tambah Template'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Template *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Follow Up H+1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    Isi Template Pesan *
                  </label>
                  <span className="text-[9px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                    <Code className="h-2.5 w-2.5" /> Insert variables
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="Ketik template pesan di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
                />

                {/* Variable tags inserters */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase">Click to add:</span>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{nama}}')}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/30 rounded cursor-pointer"
                  >
                    {"{{nama}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{sales}}')}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/30 rounded cursor-pointer"
                  >
                    {"{{sales}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{tanggal}}')}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/30 rounded cursor-pointer"
                  >
                    {"{{tanggal}}"}
                  </button>
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-1 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {editingTemplate ? 'Simpan Perubahan' : 'Simpan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
