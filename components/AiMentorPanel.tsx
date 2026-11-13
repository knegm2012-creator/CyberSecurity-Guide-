'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Send, CheckCircle2, RefreshCw, Trophy } from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { LiquidGlassOrb, type LiquidGlassOrbState } from '@/components/liquid-glass-orb';

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

function resolveInitialMode(prompt?: string): 'eli9' | 'quiz' | 'debug' | 'review' {
  if (!prompt) return 'eli9';
  const lower = prompt.toLowerCase();
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('review')) return 'review';
  if (lower.includes('debug') || lower.includes('error')) return 'debug';
  return 'eli9';
}

function AiMentorContent({
  onClose,
  initialPrompt,
}: {
  onClose: () => void;
  initialPrompt?: string;
}) {
  const [activeMode, setActiveMode] = useState<'eli9' | 'quiz' | 'debug' | 'review'>(() =>
    resolveInitialMode(initialPrompt)
  );
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [codeOrError, setCodeOrError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('stage-0');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responseResult, setResponseResult] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
  }, []);

  const currentStage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

  const orbState: LiquidGlassOrbState = loading
    ? activeMode === 'eli9'
      ? 'searching'
      : 'thinking'
    : hasError
    ? 'error'
    : isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : 'idle';

  const getAudioLevel = useCallback(() => {
    if (!isSpeaking && !isListening) return 0.55;
    const t = (performance.now() - speechStartedAtRef.current) / 1000;
    const syllable =
      0.42 +
      0.32 * Math.abs(Math.sin(t * 7.4)) +
      0.22 * Math.max(0, Math.sin(t * 3.1 + 1.1));
    return Math.min(1, Math.max(0.12, syllable));
  }, [isSpeaking, isListening]);

  const handleAskMentor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText && activeMode !== 'quiz') return;

    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    setIsSpeaking(false);
    setHasError(false);
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
        setHasError(true);
        setResponseResult(`Error: ${data.error}`);
      } else if (activeMode === 'quiz') {
        setQuizQuestions(data.quiz || []);
        setUserAnswers({});
        setQuizSubmitted(false);
        speechStartedAtRef.current = performance.now();
        setIsSpeaking(true);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 3200);
      } else {
        setResponseResult(data.result);
        speechStartedAtRef.current = performance.now();
        setIsSpeaking(true);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 4500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server request failed';
      setHasError(true);
      setResponseResult(`Communication error: ${message}`);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-[#03050b]/75 backdrop-blur-md">
      <div className="w-full max-w-xl h-full border-l border-white/[0.1] bg-[#060a14]/95 backdrop-blur-xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/[0.08] bg-[#040710]/65 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <div>
              <h3 className="font-display text-sm font-semibold text-white">AI Study Mentor</h3>
              <p className="text-[11px] font-mono text-slate-400">Clear explanations, quizzes &amp; debugging</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Agentic Liquid Glass Orb Presence */}
        <div className="border-b border-white/[0.08] bg-black py-4 flex items-center justify-center shrink-0">
          <LiquidGlassOrb
            baseColor="#ffffff"
            colorA="#000000"
            colorB="#4d4d4d"
            colorC="#a9a9a9"
            seed={145}
            startTime={18}
            speed={1.5}
            distortion={0.8}
            clusterCount={7.2}
            clusterIntensity={3}
            clusterSize={22.5}
            scale={0.23}
            spotSize={1.15}
            rotation={0}
            softness={0.31}
            relief={2.94}
            refraction={0.65}
            roughness={0}
            reflection={1.3}
            caustics={0}
            dispersion={1}
            colorDistribution={0}
            grain={0.3}
            grainSize={1}
            paused={false}
            animateDistortion={true}
            grainMode="fine"
            flowType="drift"
            state={orbState}
            thinkingAnimation="ripples"
            searchingAnimation="lens"
            preserveWhites={true}
            animateEntrance={true}
            size={250}
            audioLevel={0.55}
            getAudioLevel={getAudioLevel}
          />
        </div>

        {/* Mode Tabs */}
        <div className="border-b border-white/[0.08] bg-[#040710]/70 px-3 py-2">
          <div className="optical-subnav flex gap-1 p-1 rounded-xl text-xs font-medium">
            {[
              { id: 'eli9', label: 'Concept Guide' },
              { id: 'quiz', label: 'Stage Quiz' },
              { id: 'debug', label: 'Error Doctor' },
              { id: 'review', label: 'Lab Review' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMode(tab.id as typeof activeMode);
                  setResponseResult(null);
                  setHasError(false);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                  activeMode === tab.id
                    ? 'bg-cyan-500/18 text-cyan-200 border-cyan-400/35 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Selector */}
        <div className="border-b border-white/[0.08] bg-[#040710]/50 px-4 py-2.5 flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-mono">Context:</span>
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="flex-1 rounded-xl border border-white/[0.1] bg-[#040710]/90 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400/50 font-mono text-[11px]"
          >
            {STAGES_DATA.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.number}: {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeMode === 'quiz' && (
            <div className="space-y-4">
              {quizQuestions.length === 0 ? (
                <div className="optical-card rounded-2xl p-6 text-center space-y-3">
                  <Trophy className="h-7 w-7 text-amber-400 mx-auto" />
                  <h4 className="font-display text-sm font-semibold text-white">
                    Stage {currentStage.number} Check
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Generate 5 multiple-choice questions on {currentStage.title}.
                  </p>
                  <SoapBubbleButton
                    disabled={loading}
                    onClick={() => handleAskMentor()}
                    tint="rgb(56 189 248)"
                    opacity={0.92}
                    style={{ fontSize: 12 }}
                    className="!min-h-[36px] !px-5 font-semibold text-white"
                  >
                    <span className="inline-flex items-center gap-2">
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>{loading ? 'Generating...' : 'Generate 5 Questions'}</span>
                    </span>
                  </SoapBubbleButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="optical-card rounded-2xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-white">
                        <span className="text-cyan-400 font-mono mr-1.5 tabular-nums">Q{qIdx + 1}.</span>
                        {q.question}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctIndex === optIdx;

                          let optionStyle = 'border-white/[0.08] bg-[#040710]/80 text-slate-300 hover:border-white/[0.18]';
                          if (quizSubmitted) {
                            if (isCorrect) optionStyle = 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 font-semibold';
                            else if (isSelected && !isCorrect) optionStyle = 'border-rose-400/50 bg-rose-500/15 text-rose-200 line-through';
                          } else if (isSelected) {
                            optionStyle = 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between cursor-pointer ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="optical-inset rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                          <span className="font-mono text-cyan-400 font-semibold">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <SoapBubbleButton
                      onClick={() => setQuizSubmitted(true)}
                      tint="rgb(56 189 248)"
                      opacity={0.92}
                      style={{ fontSize: 12 }}
                      className="w-full !min-h-[38px] font-semibold text-white"
                    >
                      Submit Answers
                    </SoapBubbleButton>
                  ) : (
                    <div className="optical-inset rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Score</div>
                        <div className="text-lg font-bold font-mono text-white tabular-nums">
                          {calculateScore().correct} / {calculateScore().total} ({calculateScore().pct}%)
                        </div>
                      </div>
                      <button
                        onClick={() => handleAskMentor()}
                        className="px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-medium text-slate-200 hover:bg-white/[0.08] cursor-pointer"
                      >
                        New Set
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeMode !== 'quiz' && responseResult && (
            <div className="optical-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  Mentor Response
                </span>
                <button
                  onClick={() => {
                    setResponseResult(null);
                    setHasError(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {responseResult}
              </div>
            </div>
          )}

          {activeMode === 'eli9' && !responseResult && (
            <div className="space-y-2.5">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                Suggested Prompts
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  'What is a pointer in C and how does dereferencing work?',
                  'How does subnetting work in IPv4?',
                  'Explain the TCP 3-way handshake with a concrete analogy',
                  'What is the difference between cryptographic hashing and encryption?',
                  'Why do systems languages use stack vs heap allocation?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setPromptText(q)}
                    className="optical-card text-left text-xs rounded-xl px-3.5 py-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        {activeMode !== 'quiz' && (
          <form onSubmit={handleAskMentor} className="border-t border-white/[0.08] bg-[#040710]/70 p-4 space-y-2.5">
            {activeMode === 'debug' && (
              <textarea
                rows={2}
                value={codeOrError}
                onChange={(e) => setCodeOrError(e.target.value)}
                placeholder="Paste the failing command, compiler warning, or code..."
                className="w-full rounded-xl border border-white/[0.1] bg-[#040710]/90 p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-400/50 focus:outline-none"
              />
            )}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={promptText}
                onFocus={() => setIsListening(true)}
                onBlur={() => setIsListening(false)}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  activeMode === 'eli9'
                    ? 'Ask about any concept or command...'
                    : activeMode === 'debug'
                    ? 'Describe what you expected vs what happened...'
                    : 'Paste your lab write-up or notes for feedback...'
                }
                className="flex-1 rounded-xl border border-white/[0.1] bg-[#040710]/90 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none"
              />

              <SoapBubbleButton
                type="submit"
                disabled={loading || !promptText}
                tint="rgb(56 189 248)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white shrink-0"
              >
                <span className="inline-flex items-center gap-1.5">
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Ask</span>
                </span>
              </SoapBubbleButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AiMentorPanel({ isOpen, onClose, initialPrompt }: AiMentorPanelProps) {
  if (!isOpen) return null;
  return <AiMentorContent key={initialPrompt || 'default'} onClose={onClose} initialPrompt={initialPrompt} />;
}
