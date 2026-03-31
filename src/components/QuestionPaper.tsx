import React, { useEffect } from 'react';
import { Question, Part, QuestionType } from '../types';

interface QuestionPaperProps {
  questions: Question[];
  subject: string;
  className: string;
  stream: string;
}

export const QuestionPaper: React.FC<QuestionPaperProps & { collegeName?: string; showAnswerKey?: boolean }> = ({ 
  questions, 
  subject, 
  className, 
  stream, 
  collegeName = "GOVERNMENT PRE-UNIVERSITY COLLEGE",
  showAnswerKey = false
}) => {
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [questions, showAnswerKey]);

  const parts = [Part.A, Part.B, Part.C, Part.D];

  const getQuestionsByPart = (part: Part) => {
    return questions.filter(q => q.part === part);
  };

  const renderQuestionText = (q: Question) => {
    return (
      <div className="flex-1">
        <p className={q.isMath ? "math-tex" : ""}>{q.text}</p>
        {q.type === QuestionType.MCQ && q.options && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 ml-4 text-sm">
            {q.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-bold">{String.fromCharCode(97 + i)})</span>
                <span className={q.isMath ? "math-tex" : ""}>{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PaperContent = () => (
    <div id="question-paper-content" className="bg-white p-12 font-serif text-black min-h-[1000px]">
      <div className="text-center border-b-2 border-black pb-4 mb-8">
        <h1 className="text-2xl font-bold uppercase">{collegeName}</h1>
        <h2 className="text-lg font-bold mt-1">Department of Pre-University Education, Karnataka</h2>
        <h3 className="text-xl font-bold mt-2 underline">Model Question Paper</h3>
        <div className="flex justify-between mt-4 text-sm font-bold">
          <span>Class: {className}</span>
          <span>Subject: {subject}</span>
          <span>Stream: {stream}</span>
        </div>
        <div className="flex justify-between mt-1 text-sm font-bold">
          <span>Time: 3 Hours 15 Minutes</span>
          <span>Max Marks: 70</span>
        </div>
      </div>

      <div className="space-y-8">
        {parts.map((part) => {
          const partQuestions = getQuestionsByPart(part);
          if (partQuestions.length === 0) return null;

          return (
            <div key={part} className="section">
              <h3 className="text-center font-bold underline mb-4">{part}</h3>
              <p className="italic text-sm mb-4">
                {part === Part.A && "I. Answer all the following questions. Each question carries 1 mark."}
                {part === Part.B && "II. Answer any five of the following questions. Each question carries 2 marks."}
                {part === Part.C && "III. Answer any five of the following questions. Each question carries 3 marks."}
                {part === Part.D && "IV. Answer any five of the following questions. Each question carries 5 marks."}
              </p>
              <div className="space-y-4">
                {partQuestions.map((q, idx) => (
                  <div key={q.id} className="flex gap-4">
                    <span className="w-8 text-right font-bold">{idx + 1}.</span>
                    {renderQuestionText(q)}
                    <span className="w-8 text-right font-bold">({q.marks})</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500 italic">
        *** End of Question Paper ***
      </div>
    </div>
  );

  const AnswerKeyContent = () => (
    <div id="answer-key-content" className="bg-slate-50 p-12 font-serif text-black min-h-[1000px] mt-8 border-t-4 border-indigo-600">
      <div className="text-center border-b-2 border-indigo-600 pb-4 mb-8">
        <h1 className="text-2xl font-bold uppercase text-indigo-700">ANSWER KEY / MARKING SCHEME</h1>
        <h2 className="text-lg font-bold mt-1">{subject} - {className}</h2>
      </div>

      <div className="space-y-8">
        {parts.map((part) => {
          const partQuestions = getQuestionsByPart(part);
          if (partQuestions.length === 0) return null;

          return (
            <div key={part} className="section">
              <h3 className="font-bold text-indigo-600 border-b border-indigo-200 mb-4">{part} - Solutions</h3>
              <div className="space-y-6">
                {partQuestions.map((q, idx) => (
                  <div key={`ans-${q.id}`} className="space-y-2">
                    <div className="flex gap-2 font-bold text-sm">
                      <span>Q{idx + 1}.</span>
                      <div className="flex-1">
                        <p className={q.isMath ? "math-tex" : ""}>{q.text}</p>
                        {q.type === QuestionType.MCQ && q.options && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                            {q.options.map((opt, i) => (
                              <span key={i}>{String.fromCharCode(97 + i)}) {opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pl-8 border-l-2 border-indigo-100 italic text-slate-700 text-sm">
                      <p className="font-semibold text-indigo-500 mb-1">Answer:</p>
                      <p className={q.isMath ? "math-tex" : ""}>{q.answer || "Answer key not generated for this question."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div id="question-paper" className="bg-white shadow-xl max-w-4xl mx-auto overflow-hidden">
      <PaperContent />
      {showAnswerKey && <AnswerKeyContent />}
    </div>
  );
};
