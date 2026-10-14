'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, HelpCircle, CheckCircle2, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';

interface AiMentorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function AiMentorPanel({ isOpen, onClose, initialPrompt }: AiMentorPanelProps) {
  const [prevPrompt, setPrevPrompt] = useState<string | undefined>(initialPrompt);
  const [activeMode, setActiveMode] = useState<'eli9' | 'quiz' | 'debug' | 'review'>('eli9');
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [codeOrError, setCodeOrError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('stage-0');
  const [loading, setLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<string | null>(null);

  // Sync state if initialPrompt changes
  if (initialPrompt !== prevPrompt) {
    setPrevPrompt(initialPrompt);
    if (initialPrompt) {
      setPromptText(initialPrompt);
      if (initialPrompt.toLowerCase().includes('quiz')) {
        setActiveMode('quiz');
      } else if (initialPrompt.toLowerCase().includes('review')) {
        setActiveMode('review');
      } else {
        setActiveMode('eli9');
      }
    }
  }

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentStage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

  const handleAskMentor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText && activeMode !== 'quiz') return;

    setLoading(true);
    setResponseResult(null);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeMode,
          stageId: currentStage.id,
          stageTitle: `Stage ${currentStage.number}: ${currentStage.title}`,
          promptText: promptText || currentStage.title,
          codeOrError,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setResponseResult(`Error: ${data.error}`);
      } else if (activeMode === 'quiz') {
        setQuizQuestions(data.quiz || []);
        setUserAnswers({});
        setQuizSubmitted(false);
      } else {
        setResponseResult(data.result);
      }
    } catch (err: any) {
      setResponseResult(`Communication error: ${err?.message || 'Server request failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: quizQuestions.length,
      pct: quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Super Tutor & Mentor</h3>
              <p className="text-[11px] font-mono text-purple-300">Grade 9 Friendly · Powered by Gemini</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-2 gap-1.5 text-xs font-semibold">
          {[
            { id: 'eli9', label: 'ELI9 Analogies' },
            { id: 'quiz', label: 'Stage Quizzer' },
            { id: 'debug', label: 'Error Doctor' },
            { id: 'review', label: 'Lab Reviewer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMode(tab.id as any);
                setResponseResult(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeMode === tab.id
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stage Selector Bar */}
        <div className="border-b border-slate-800/80 bg-slate-950 px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-mono">Stage Context:</span>
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-200 focus:outline-none font-mono text-[11px]"
          >
            {STAGES_DATA.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.number}: {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* QUIZ MODE DISPLAY */}
          {activeMode === 'quiz' && (
            <div className="space-y-4">
              {quizQuestions.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center space-y-3">
                  <Trophy className="h-8 w-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Stage {currentStage.number} Knowledge Quiz</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Test your understanding of {currentStage.title}. Click generate to create 5 personalized multiple-choice questions!
                  </p>
                  <button
                    disabled={loading}
                    onClick={() => handleAskMentor()}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>{loading ? 'Generating 5 Questions...' : 'Generate 5-Question Quiz'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Questions List */}
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                      <div className="text-xs font-bold text-white">
                        <span className="text-purple-400 font-mono mr-1">Q{qIdx + 1}:</span> {q.question}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctIndex === optIdx;

                          let optionStyle = 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700';
                          if (quizSubmitted) {
                            if (isCorrect) optionStyle = 'border-emerald-600 bg-emerald-950/40 text-emerald-300 font-bold';
                            else if (isSelected && !isCorrect) optionStyle = 'border-rose-600 bg-rose-950/40 text-rose-300 line-through';
                          } else if (isSelected) {
                            optionStyle = 'border-purple-500 bg-purple-950/50 text-purple-200 font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="rounded-lg bg-slate-950 p-2.5 text-xs text-slate-300 font-sans border border-slate-800/80">
                          <strong className="text-purple-400 font-mono">Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submit / Score Bar */}
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 transition-colors cursor-pointer"
                    >
                      Submit Quiz & Check Answers
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Your Score</div>
                        <div className="text-xl font-bold font-mono text-white">
                          {calculateScore().correct} / {calculateScore().total} ({calculateScore().pct}%)
                        </div>
                      </div>
                      <button
                        onClick={() => handleAskMentor()}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                      >
                        Try New Questions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESPONSE FOR OTHER MODES */}
          {activeMode !== 'quiz' && responseResult && (
            <div className="rounded-xl border border-purple-900/60 bg-slate-900/90 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-purple-400 font-bold uppercase">Mentor Guidance</span>
                <button
                  onClick={() => setResponseResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {responseResult}
              </div>
            </div>
          )}

          {/* Prompt Presets for Quick Questions */}
          {activeMode === 'eli9' && !responseResult && (
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono">Suggested questions:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What is a pointer in C and why do people find it hard?',
                  'How does subnetting work in IPv4?',
                  'Explain the TCP 3-way handshake with a food delivery metaphor',
                  'What is the difference between hashing and encryption?',
                  'Why does modern C++ use RAII instead of manual malloc?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptText(q)}
                    className="text-left text-[11px] bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar (for non-quiz modes) */}
        {activeMode !== 'quiz' && (
          <form onSubmit={handleAskMentor} className="border-t border-slate-800 bg-slate-900/90 p-4 space-y-3">
            {activeMode === 'debug' && (
              <textarea
                rows={2}
                value={codeOrError}
                onChange={(e) => setCodeOrError(e.target.value)}
                placeholder="Paste the error message or code that failed here..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
              />
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  activeMode === 'eli9'
                    ? 'Ask to explain any concept like you are in Grade 9...'
                    : activeMode === 'debug'
                    ? 'What were you trying to do?'
                    : 'Paste your lab write-up notes or link...'
                }
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none font-sans"
              />

              <button
                type="submit"
                disabled={loading || !promptText}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Ask</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
