import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Trophy, RefreshCw, FileText } from 'lucide-react';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

interface QuizRendererProps {
  quiz: QuizData;
  onSaveNotes?: (title: string, content: string) => void;
}

export const QuizRenderer: React.FC<QuizRendererProps> = ({ quiz, onSaveNotes }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId: number, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    (quiz?.questions || []).forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score += 1;
      }
    });
    return score;
  };

  const isComplete = Object.keys(selectedAnswers).length === (quiz?.questions || []).length;

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const handleExportPDF = () => {
    let txt = `QUIZ: ${quiz?.title || 'Untitled'}\nTopic: ${quiz?.topic || 'General'}\n\n`;
    (quiz?.questions || []).forEach((q, idx) => {
      txt += `Q${idx + 1}: ${q.question}\n`;
      (q.options || []).forEach((opt, oIdx) => {
        txt += `   [${oIdx === q.correctAnswerIndex ? 'X' : ' '}] ${opt}\n`;
      });
      txt += `Explanation: ${q.explanation}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(quiz?.title || 'quiz').toLowerCase().replace(/\s+/g, '-')}-quiz.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full border border-[#2b2b2b] rounded-xl bg-[#080808] p-4 my-3 space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-white" />
          <div>
            <h4 className="font-semibold text-white text-sm">{quiz?.title}</h4>
            <span className="text-xs text-gray-400">Topic: {quiz?.topic}</span>
          </div>
        </div>
        {submitted && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
            <Trophy className="w-3.5 h-3.5 text-white" />
            <span>
              Score: {calculateScore()} / {(quiz?.questions || []).length}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {(quiz?.questions || []).map((q, qIdx) => {
          const userAns = selectedAnswers[q.id];
          const isCorrect = userAns === q.correctAnswerIndex;

          return (
            <div key={q.id || qIdx} className="p-3 rounded-lg bg-[#111111] border border-[#222222] space-y-2">
              <p className="text-xs font-medium text-gray-200">
                <span className="text-white font-bold mr-1">Q{qIdx + 1}.</span> {q.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(q.options || []).map((opt, oIdx) => {
                  const isSelected = userAns === oIdx;
                  let btnStyle = 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10';

                  if (submitted) {
                    if (oIdx === q.correctAnswerIndex) {
                      btnStyle = 'border-white bg-white/20 text-white font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-white/20 bg-white/5 text-gray-400 line-through';
                    } else {
                      btnStyle = 'border-white/5 bg-white/5 opacity-40 text-gray-500';
                    }
                  } else if (isSelected) {
                    btnStyle = 'border-white bg-white text-black font-bold';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(q.id, oIdx)}
                      className={`text-left text-xs p-2.5 rounded-lg border transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && oIdx === q.correctAnswerIndex && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-2 text-[11px] p-2 rounded bg-white/5 text-gray-300 border border-white/10">
                  <span className="font-semibold text-white">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!isComplete}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              isComplete
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retake Quiz</span>
          </button>
        )}

        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs transition"
        >
          <FileText className="w-3 h-3" />
          <span>Export Quiz</span>
        </button>
      </div>
    </div>
  );
};
