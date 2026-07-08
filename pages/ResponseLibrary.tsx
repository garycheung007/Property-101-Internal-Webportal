
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ResponseTemplate } from '../types';
import { MessageSquare, Search, Plus, Edit2, Trash2, X, Copy, Check, Loader2, Save } from 'lucide-react';

const CATEGORIES = ['General', 'Insurance', 'Meetings', 'Levy Queries', 'Maintenance', 'Disclosure', 'Complaints', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  'General':      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  'Insurance':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Meetings':     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Levy Queries': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Maintenance':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Disclosure':   'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Complaints':   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Other':        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const ResponseLibrary: React.FC = () => {
  const { responseTemplates, deleteResponseTemplate } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm]         = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingTemplate, setEditingTemplate]   = useState<ResponseTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [deletingIds, setDeletingIds]       = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId]             = useState<string | null>(null);

  const filtered = useMemo(() => (
    responseTemplates
      .filter(t =>
        (filterCategory === 'all' || t.category === filterCategory) &&
        (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  ), [responseTemplates, searchTerm, filterCategory]);

  const handleCopy = async (template: ResponseTemplate) => {
    await navigator.clipboard.writeText(template.body);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await deleteResponseTemplate(id);
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleEdit = (e: React.MouseEvent, t: ResponseTemplate) => {
    e.stopPropagation();
    setEditingTemplate(t);
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const categoryColor = (cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Response Library</h1>
          <p className="text-slate-500 dark:text-slate-400">Pre-written responses for common enquiries.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={18} /> Add Response
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="italic text-sm">
            {responseTemplates.length === 0 ? 'No responses yet. Add one to get started.' : 'No responses matched your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-5 cursor-pointer transition-all hover:shadow-md hover:border-pink-200 dark:hover:border-pink-800 ${deletingIds.has(t.id) ? 'opacity-40 pointer-events-none grayscale' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${categoryColor(t.category)}`}>
                  {t.category}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => handleEdit(e, t)}
                      className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={e => handleDelete(e, t.id, t.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-2 leading-snug">{t.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{t.body}</p>
              <div className="mt-4 pt-3 border-t dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Click to view &amp; copy</span>
                <Copy size={13} className="text-slate-300 dark:text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${categoryColor(selectedTemplate.category)}`}>
                  {selectedTemplate.category}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{selectedTemplate.title}</h3>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{selectedTemplate.body}</pre>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950 shrink-0">
              {isAdmin && (
                <button
                  onClick={e => handleEdit(e, selectedTemplate)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Edit2 size={15} /> Edit
                </button>
              )}
              <button
                onClick={() => handleCopy(selectedTemplate)}
                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${copiedId === selectedTemplate.id ? 'bg-emerald-600 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'}`}
              >
                {copiedId === selectedTemplate.id
                  ? <><Check size={15} /> Copied!</>
                  : <><Copy size={15} /> Copy to Clipboard</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <ResponseModal template={editingTemplate} onClose={handleCloseModal} />
      )}
    </div>
  );
};

const ResponseModal: React.FC<{
  template: ResponseTemplate | null;
  onClose: () => void;
}> = ({ template, onClose }) => {
  const { addResponseTemplate, updateResponseTemplate } = useData();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:    template?.title    || '',
    category: template?.category || 'General',
    body:     template?.body     || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setIsSaving(true);
    try {
      if (template) {
        await updateResponseTemplate({
          ...template,
          ...form,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.name || '',
        });
      } else {
        await addResponseTemplate({
          ...form,
          createdAt: new Date().toISOString(),
          createdBy: user?.name || '',
        });
      }
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">
            {template ? 'Edit Response' : 'New Response'}
          </h3>
          <button onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Title</label>
            <input
              required
              type="text"
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              placeholder="e.g. Insurance Valuation Request"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
            <select
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-pink-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Text</label>
            <textarea
              required
              rows={12}
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none leading-relaxed"
              placeholder="Type the full response text here..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : (template ? 'Update Response' : 'Save Response')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResponseLibrary;
