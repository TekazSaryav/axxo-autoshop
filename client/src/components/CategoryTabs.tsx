import React from 'react';
import type { Category } from '../types.js';
import { Layers, Tv, Bot, Shield, MessageSquare, Sparkles, Trophy, Video } from 'lucide-react';
import { useLanguage } from '../i18n.js';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  totalProducts: number;
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('stream') || n.includes('tv') || n.includes('netflix')) return <Tv className="w-3.5 h-3.5" />;
  if (n.includes('ai') || n.includes('ia') || n.includes('bot') || n.includes('claude')) return <Bot className="w-3.5 h-3.5" />;
  if (n.includes('vpn') || n.includes('secur')) return <Shield className="w-3.5 h-3.5" />;
  if (n.includes('discord')) return <MessageSquare className="w-3.5 h-3.5" />;
  if (n.includes('sport')) return <Trophy className="w-3.5 h-3.5" />;
  if (n.includes('edit')) return <Video className="w-3.5 h-3.5" />;
  return <Sparkles className="w-3.5 h-3.5" />;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalProducts
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-4 no-scrollbar">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
          selectedCategory === null
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
            : 'bg-gray-850/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-white/5'
        }`}
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>{t.all_categories}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            selectedCategory === null ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          {totalProducts}
        </span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const icon = getCategoryIcon(cat.name);

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              isSelected
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                : 'bg-gray-850/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-white/5'
            }`}
          >
            <span className={isSelected ? 'text-white' : 'text-indigo-400'}>{icon}</span>
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
