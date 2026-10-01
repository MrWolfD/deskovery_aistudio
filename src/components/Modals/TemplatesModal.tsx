import React, { useState } from 'react';
import { X, Search, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { BoardElement, Point } from '../../types/board';
import { BoardTemplate, TEMPLATES } from '../../data/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTemplate: (elements: BoardElement[]) => void;
  centerPoint: Point;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onInsertTemplate,
  centerPoint,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Все шаблоны' },
    { id: 'flowchart', label: 'Блок-схемы' },
    { id: 'architecture', label: 'Архитектура' },
    { id: 'brainstorm', label: 'Брейншторм' },
    { id: 'agile', label: 'Agile & Kanban' },
  ];

  const filtered = TEMPLATES.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApply = (tpl: BoardTemplate) => {
    const elements = tpl.generateElements(centerPoint);
    onInsertTemplate(elements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Библиотека шаблонов диаграмм
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Готовые профессиональные схемы и структуры в стиле Excalidraw
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/60 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700/80'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск шаблонов..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleApply(tpl)}
              className="group p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-neutral-850 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{tpl.icon}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                    {tpl.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tpl.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="flex items-center gap-1 group-hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Вставить на холст
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
