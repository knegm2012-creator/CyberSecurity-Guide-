'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, XCircle, Trophy, RefreshCw, ArrowRight, HelpCircle } from 'lucide-react';
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

export function QuickQuizModal({
  isOpen,
  onClose,
  currentStageId,
  onAwardXp,
  onOpenAiMentor,
}: QuickQuizModalProps) {
  const [prevStageId, setPrevStageId] = useState(currentStageId);
  const [selectedStageId, setSelectedStageId] = useState(currentStageId || 'stage-0');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Sync selectedStageId when currentStageId changes
  if (currentStageId !== prevStageId) {
    setPrevStageId(currentStageId);
    setSelectedStageId(currentStageId || 'stage-0');
  }

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
        setErrorMsg('Could not parse quiz questions. Please try generating again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to communicate with Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch quiz when modal opens or stage changes
  useEffect(() => {
    if (!isOpen) return;
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
            setErrorMsg('Could not parse quiz questions. Please try generating again.');
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setErrorMsg(err?.message || 'Failed to communicate with Gemini AI.');
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
  }, [isOpen, selectedStageId]);

  if (!isOpen) return null;

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

    // Award +100 XP if passed (>= 3 out of 5)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <span>QUICK QUIZ</span>
                <span>·</span>
                <span>GEMINI 3.8 FLASH</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Stage {activeStage.number}: {activeStage.title.split(':')[0]}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage Switcher */}
        <div className="flex items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-mono">Select Stage:</span>
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
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
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Generate a brand new set of 5 questions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">New Questions</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-start gap-2">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Quiz Generation Notice:</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <div className="text-sm font-bold text-white">AI Tutor is crafting your 5 questions...</div>
            <p className="text-xs text-slate-400 font-mono">Analyzing {activeStage.title} topics & concepts</p>
          </div>
        )}

        {/* Questions Body */}
        {!loading && questions.length > 0 && (
          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
            {questions.map((q, qIdx) => {
              const selectedOpt = userAnswers[qIdx];

              return (
                <div
                  key={qIdx}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
                >
                  <div className="text-xs font-bold text-white flex items-start gap-2">
                    <span className="font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                      Q{qIdx + 1}
                    </span>
                    <span className="leading-relaxed">{q.question}</span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let style = 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700';

                      if (submitted) {
                        if (isCorrect) {
                          style = 'border-emerald-600 bg-emerald-950/40 text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          style = 'border-rose-600 bg-rose-950/40 text-rose-300 line-through';
                        }
                      } else if (isSelected) {
                        style = 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submitted}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${style}`}
                        >
                          <span className="line-clamp-2">{opt}</span>
                          {submitted && isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {submitted && (
                    <div className="mt-2 rounded-lg bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800/80 font-sans leading-relaxed space-y-2">
                      <div>
                        <strong className="text-cyan-400 font-mono">Why: </strong>
                        {q.explanation}
                      </div>
                      {onOpenAiMentor && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenAiMentor(
                                `ELI9: Explain this Computer Science quiz question for a 9th grader: "${q.question}". The correct answer is "${q.options[q.correctIndex]}". Why is this correct, and what real-world analogy helps me remember it?`
                              );
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-cyan-950/40 hover:bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50"
                          >
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span>Explain this concept in AI Mentor</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Controls / Result Bar */}
            {!submitted ? (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {Object.keys(userAnswers).length} of {questions.length} answered
                </span>
                <button
                  disabled={!allAnswered}
                  onClick={handleSubmitQuiz}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-40 cursor-pointer shadow-lg"
                >
                  Submit & Score Quiz
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">Score for Stage {activeStage.number}:</div>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {score} / {questions.length} ({percentage}%)
                  </div>
                  {percentage >= 60 ? (
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      Awesome job! You passed the stage comprehension check! +100 XP awarded.
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 mt-1">
                      Good effort! Review the explanations above and try a fresh set to master the stage.
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchQuizForStage(activeStage)}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
                  >
                    Try 5 More Questions
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
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
