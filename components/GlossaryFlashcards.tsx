'use client';

import React, { useState } from 'react';
import { Search, RotateCw, ArrowLeft, ArrowRight, BookOpen, Sparkles, Check } from 'lucide-react';
import { GLOSSARY_TERMS, GlossaryTerm } from '@/lib/curriculum-data';

interface GlossaryFlashcardsProps {
  onOpenAiMentor: (context?: string) => void;
}

export function GlossaryFlashcards({ onOpenAiMentor }: GlossaryFlashcardsProps) {
  const [mode, setMode] = useState<'dictionary' | 'flashcards'>('flashcards');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Flashcard state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const categories = ['All', 'Network', 'Security', 'System', 'Dev', 'Hardware', 'Web', 'Database', 'Theory'];

  const filtered = GLOSSARY_TERMS.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.simpleEnglish.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const card = filtered[currentIdx] || filtered[0] || GLOSSARY_TERMS[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>TECHNICAL ENGLISH VOCABULARY</span>
            <span>·</span>
            <span>{GLOSSARY_TERMS.length} ESSENTIAL TERMS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Recall Glossary & Flashcards</h2>
          <p className="text-xs text-slate-400 mt-1">
            &quot;Maintain a vocabulary notebook. You should be able to explain each term in simple English without hesitation.&quot;
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs font-semibold">
          <button
            onClick={() => setMode('flashcards')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              mode === 'flashcards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flashcard Quiz
          </button>
          <button
            onClick={() => setMode('dictionary')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              mode === 'dictionary' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A-Z Dictionary
          </button>
        </div>
      </div>

      {/* FLASHCARD MODE */}
      {mode === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Card {currentIdx + 1} of {filtered.length}
            </span>
            <span className="text-cyan-400 font-semibold">{card.category}</span>
          </div>

          {/* Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-72 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all cursor-pointer relative overflow-hidden group select-none hover:border-cyan-500/50"
          >
            <div className="absolute top-4 right-4 text-[11px] font-mono text-slate-500 flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
              <RotateCw className="h-3 w-3" />
              <span>Click to flip</span>
            </div>

            {!isFlipped ? (
              <div className="space-y-3">
                <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">TERM</span>
                <h3 className="text-3xl font-extrabold text-white">{card.term}</h3>
                <p className="text-xs text-slate-400">What does this mean in simple plain English?</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">DEFINITION</span>
                <p className="text-base text-slate-200 leading-relaxed font-sans">{card.simpleEnglish}</p>
                <div className="pt-2 text-xs font-mono text-slate-400">Category: {card.category}</div>
              </div>
            )}
          </div>

          {/* Flashcard Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() =>
                onOpenAiMentor(`ELI9: Explain the term "${card.term}" with a fun real-world analogy and show me how it applies in cybersecurity!`)
              }
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 cursor-pointer font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Mentor</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-xs font-semibold text-white hover:bg-cyan-500 cursor-pointer"
            >
              <span>Next Card</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* DICTIONARY MODE */}
      {mode === 'dictionary' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search glossary terms or definitions..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === c ? 'bg-cyan-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{item.term}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 border border-cyan-900/60 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.simpleEnglish}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
