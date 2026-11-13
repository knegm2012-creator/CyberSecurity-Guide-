'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { STAGES_DATA, StageData } from '@/lib/curriculum-data';

interface QuickQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStageId: string;
  onAwardXp?: (xp: number) => void;
  onOpenAiMentor?: (prompt: string) => void;
}

interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function QuickQuizBody({
  onClose,
  initialStageId,
  onAwardXp,
  onOpenAiMentor,
}: {
  onClose: () => void;
  initialStageId: string;
  onAwardXp?: (xp: number) => void;
  onOpenAiMentor?: (prompt: string) => void;
}) {
  const [selectedStageId, setSelectedStageId] = useState(initialStageId || 'stage-0');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  const activeStage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

  const fetchQuizForStage = async (stage: StageData) => {
    setLoading(true);
    setErrorMsg(null);
    setSubmitted(false);
    setUserAnswers({});
    setXpAwarded(false);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quiz',
          stageId: stage.id,
          stageTitle: `Stage ${stage.number}: ${stage.title}`,
          promptText: `${stage.goal} Topics: ${stage.topics.map((t) => t.title).join(', ')}`,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else if (Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuestions(data.quiz);
      } else {
        setErrorMsg('Could not parse quiz questions. Please try again.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const stage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

    Promise.resolve().then(async () => {
      if (ignore) return;
      setLoading(true);
      setErrorMsg(null);
      setSubmitted(false);
      setUserAnswers({});
      setXpAwarded(false);

      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quiz',
            stageId: stage.id,
            stageTitle: `Stage ${stage.number}: ${stage.title}`,
            promptText: `${stage.goal} Topics: ${stage.topics.map((t) => t.title).join(', ')}`,
          }),
        });

        const data = await res.json();
        if (!ignore) {
          if (data.error) {
            setErrorMsg(data.error);
          } else if (Array.isArray(data.quiz) && data.quiz.length > 0) {
            setQuestions(data.quiz);
          } else {
            setErrorMsg('Could not parse quiz questions. Please try again.');
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load quiz.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [selectedStageId]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    if (correctCount >= 3 && !xpAwarded && onAwardXp) {
      onAwardXp(100);
      setXpAwarded(true);
    }
  };

  const score = Object.keys(userAnswers).reduce((acc, qIdxStr) => {
    const qIdx = Number(qIdxStr);
    return questions[qIdx]?.correctIndex === userAnswers[qIdx] ? acc + 1 : acc;
  }, 0);

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && Object.keys(userAnswers).length === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050b]/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="optical-panel w-full max-w-2xl rounded-2xl border-white/[0.12] p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-4 w-4 text-amber-400" />
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Concept Check · Stage {activeStage.number}
              </div>
              <h3 className="font-display text-base font-semibold text-white">
                {activeStage.title.split(':')[0]}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stage Switcher */}
        <div className="optical-inset flex items-center justify-between gap-2.5 text-xs p-2.5 rounded-xl">
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/[0.08] bg-[#040710]/90 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 font-mono"
          >
            {STAGES_DATA.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.number}: {s.title}
              </option>
            ))}
          </select>
          <button
            disabled={loading}
            onClick={() => fetchQuizForStage(activeStage)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3.5 text-xs text-rose-200 flex items-start gap-2">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div>{errorMsg}</div>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center space-y-2.5">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
            <div className="text-sm font-semibold text-white">Preparing 5 comprehension questions...</div>
          </div>
        )}

        {!loading && questions.length > 0 && (
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {questions.map((q, qIdx) => {
              const selectedOpt = userAnswers[qIdx];

              return (
                <div
                  key={qIdx}
                  className="optical-card rounded-xl p-4 space-y-3"
                >
                  <div className="text-xs font-semibold text-white flex items-start gap-2">
                    <span className="font-mono text-cyan-400 shrink-0 tabular-nums">Q{qIdx + 1}.</span>
                    <span className="leading-relaxed">{q.question}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let style = 'border-white/[0.08] bg-[#040710]/80 text-slate-300 hover:border-white/[0.18]';

                      if (submitted) {
                        if (isCorrect) {
                          style = 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          style = 'border-rose-400/50 bg-rose-500/15 text-rose-200 line-through';
                        }
                      } else if (isSelected) {
                        style = 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submitted}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between cursor-pointer ${style}`}
                        >
                          <span className="line-clamp-2">{opt}</span>
                          {submitted && isCorrect && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="optical-inset rounded-xl p-3 text-xs text-slate-300 leading-relaxed space-y-1.5">
                      <div>
                        <span className="text-cyan-400 font-mono font-semibold">Why: </span>
                        {q.explanation}
                      </div>
                      {onOpenAiMentor && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAiMentor(
                              `Explain this question clearly: "${q.question}". Correct answer: "${q.options[q.correctIndex]}". Why does it work this way?`
                            );
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Ask Mentor to elaborate</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!submitted ? (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {Object.keys(userAnswers).length} / {questions.length} answered
                </span>
                <SoapBubbleButton
                  disabled={!allAnswered}
                  onClick={handleSubmitQuiz}
                  tint="rgb(56 189 248)"
                  opacity={0.92}
                  style={{ fontSize: 12 }}
                  className="!min-h-[36px] !px-5 font-semibold text-white"
                >
                  Score Quiz
                </SoapBubbleButton>
              </div>
            ) : (
              <div className="optical-inset rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">Result</div>
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    {score} / {questions.length} ({percentage}%)
                  </div>
                  <div className={`text-xs mt-0.5 ${percentage >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {percentage >= 60 ? 'Passed (+100 XP logged).' : 'Review the explanations above and retry.'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <SoapBubbleButton
                    onClick={() => fetchQuizForStage(activeStage)}
                    tint="rgb(56 189 248)"
                    opacity={0.92}
                    style={{ fontSize: 12 }}
                    className="!min-h-[34px] !px-4 font-semibold text-white"
                  >
                    Try Again
                  </SoapBubbleButton>
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickQuizModal({
  isOpen,
  onClose,
  currentStageId,
  onAwardXp,
  onOpenAiMentor,
}: QuickQuizModalProps) {
  if (!isOpen) return null;
  return (
    <QuickQuizBody
      key={currentStageId}
      onClose={onClose}
      initialStageId={currentStageId}
      onAwardXp={onAwardXp}
      onOpenAiMentor={onOpenAiMentor}
    />
  );
}
