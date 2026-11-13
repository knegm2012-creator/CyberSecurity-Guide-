'use client';

import React, { useState } from 'react';
import { RotateCw, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SoapBubbleButton, SoapBubbleSearch } from '@/components/soap-bubble';
import { GLOSSARY_TERMS } from '@/lib/curriculum-data';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400 mb-1">
            <span>Technical English Vocabulary</span>
            <span>·</span>
            <span className="tabular-nums">{GLOSSARY_TERMS.length} Essential Terms</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
            Active Recall Glossary &amp; Flashcards
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explain each concept in plain English without looking at notes.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium self-start">
          <button
            onClick={() => setMode('flashcards')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'flashcards'
                ? 'bg-cyan-500/18 text-cyan-200 border border-cyan-400/35 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Flashcard Quiz
          </button>
          <button
            onClick={() => setMode('dictionary')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'dictionary'
                ? 'bg-cyan-500/18 text-cyan-200 border border-cyan-400/35 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
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
            <span className="tabular-nums">
              Card {currentIdx + 1} of {filtered.length}
            </span>
            <span className="text-cyan-400 font-semibold">{card.category}</span>
          </div>

          {/* Flip Card Container */}
          <motion.div
            onClick={() => setIsFlipped(!isFlipped)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="optical-panel h-72 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative overflow-hidden group select-none hover:border-cyan-400/45"
          >
            <div className="absolute top-4 right-4 text-[11px] font-mono text-slate-400 flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
              <RotateCw className="h-3 w-3" />
              <span>Click to flip</span>
            </div>

            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">TERM</span>
                  <h3 className="font-display text-3xl font-bold text-white tracking-tight [text-wrap:balance]">
                    {card.term}
                  </h3>
                  <p className="text-xs text-slate-400">What does this mean in plain English?</p>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">DEFINITION</span>
                  <p className="text-base text-slate-200 leading-relaxed font-sans">{card.simpleEnglish}</p>
                  <div className="pt-2 text-xs font-mono text-slate-400">Category · {card.category}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Flashcard Controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.1] bg-[#040710]/80 text-xs font-medium text-slate-300 hover:bg-white/[0.08] cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() =>
                onOpenAiMentor(`ELI9: Explain the term "${card.term}" with a real-world analogy and show how it applies in cybersecurity.`)
              }
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 cursor-pointer font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Mentor</span>
            </button>

            <SoapBubbleButton
              onClick={handleNext}
              tint="rgb(56 189 248)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[36px] !px-4 font-semibold text-white"
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Next Card</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </SoapBubbleButton>
          </div>
        </div>
      )}

      {/* DICTIONARY MODE */}
      {mode === 'dictionary' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1">
              <SoapBubbleSearch
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search glossary terms or definitions..."
                style={{ fontSize: 12 }}
              />
            </div>

            <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === c
                      ? 'bg-cyan-500/18 border-cyan-400/35 text-cyan-200 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((item, idx) => (
              <div key={idx} className="optical-card rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-semibold text-white">{item.term}</h4>
                  <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                    · {item.category}
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
