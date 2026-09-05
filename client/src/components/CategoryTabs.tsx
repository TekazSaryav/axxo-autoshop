import React from 'react';
import type { Category } from '../types.js';
import { Layers } from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  totalProducts: number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalProducts
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 no-scrollbar">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
          selectedCategory === null
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 border border-white/5'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Tous ({totalProducts})
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 border border-white/5'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-700/60 text-gray-400'
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
