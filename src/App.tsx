import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Settings, 
  BookOpen, 
  Layers, 
  ChevronRight,
  AlertCircle,
  Sparkles,
  Database,
  CheckCircle2,
  Plus,
  Trash2,
  FileDown,
  Wand2,
  LayoutGrid,
  ClipboardList
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Part, QuestionType } from './types';
import { QUESTION_BANK } from './data/questions';
import { QuestionPaper } from './components/QuestionPaper';
import { cn } from './lib/utils';

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "Accountancy", "Business Studies", "Economics"];
const STREAMS = ["Science", "Commerce", "Arts"];
const CLASSES = ["I PU", "II PU"];

const CHAPTER_MAPPING: Record<string, string[]> = {
  "Physics": [
    "Electric Charges and Fields", "Electrostatic Potential and Capacitance", 
    "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter",
    "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves",
    "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter",
    "Atoms", "Nuclei", "Semiconductor Electronics"
  ],
  "Chemistry": [
    "Solutions", "Electrochemistry", "Chemical Kinetics", "d and f Block Elements",
    "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"
  ],
  "Mathematics": [
    "Relations and Functions", "Inverse Trigonometric Functions", "Matrices",
    "Determinants", "Continuity and Differentiability", "Application of Derivatives",
    "Integrals", "Application of Integrals", "Differential Equations",
    "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"
  ],
  "Biology": [
    "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health",
    "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution",
    "Human Health and Disease", "Microbes in Human Welfare", "Biotechnology: Principles and Processes",
    "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation"
  ],
  "Accountancy": [
    "Accounting for Partnership: Basic Concepts", "Reconstitution of a Partnership Firm: Admission of a Partner",
    "Retirement/Death of a Partner", "Dissolution of Partnership Firm", "Accounting for Share Capital",
    "Issue and Redemption of Debentures", "Financial Statements of a Company", "Analysis of Financial Statements",
    "Accounting Ratios", "Cash Flow Statement"
  ],
  "Business Studies": [
    "Nature and Significance of Management", "Principles of Management", "Business Environment",
    "Planning", "Organizing", "Staffing", "Directing", "Controlling", "Financial Management",
    "Financial Markets", "Marketing", "Consumer Protection"
  ],
  "Economics": [
    "Introduction to Microeconomics", "Theory of Consumer Behaviour", "Production and Costs",
    "Theory of the Firm under Perfect Competition", "Market Equilibrium", "Non-competitive Markets",
    "Introduction to Macroeconomics", "National Income Accounting", "Money and Banking",
    "Determination of Income and Employment", "Government Budget and the Economy", "Open Economy Macroeconomics"
  ]
};

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function App() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[1]);
  const [selectedStream, setSelectedStream] = useState(STREAMS[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedChapter, setSelectedChapter] = useState("");

  // Reset chapter when subject changes
  useEffect(() => {
    setSelectedChapter("");
  }, [selectedSubject]);

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    QuestionType.MCQ, 
    QuestionType.FILL_IN_BLANKS, 
    QuestionType.TRUE_FALSE, 
    QuestionType.ASSERTION_REASON, 
    QuestionType.DESCRIPTIVE
  ]);
  const [generationMode, setGenerationMode] = useState<'bank' | 'ai'>('bank');
  const [viewMode, setViewMode] = useState<'config' | 'selection' | 'preview'>('config');
  const [collegeName, setCollegeName] = useState("GOVERNMENT PRE-UNIVERSITY COLLEGE");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger MathJax re-render when questions change
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, [generatedQuestions, questionPool]);

  const toggleQuestionSelection = (id: string) => {
    const newSelection = new Set(selectedQuestionIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedQuestionIds(newSelection);
  };

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [viewMode, questionPool, generatedQuestions]);

  const fetchPoolFromBank = () => {
    const filtered = QUESTION_BANK.filter(q => 
      q.class === selectedClass && 
      q.subject === selectedSubject &&
      (selectedChapter === "" || q.chapter === selectedChapter) &&
      (selectedQuestionTypes.length === 0 || selectedQuestionTypes.includes(q.type))
    );
    return filtered;
  };

  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);

  const EDUCATIONAL_FACTS = [
    "The Karnataka PU Board was established in 1966.",
    "Over 7 lakh students appear for PU exams every year in Karnataka.",
    "Model papers are designed to test both knowledge and application skills.",
    "The 2025-26 blueprint emphasizes more objective-type questions in Part A.",
    "PU education is a crucial bridge between high school and higher education.",
    "Karnataka was one of the first states to introduce a separate PU Board.",
    "The board ensures uniform standards across all PU colleges in the state.",
    "Continuous evaluation helps in better understanding of core concepts."
  ];

  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (isAiProcessing) {
      const interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % EDUCATIONAL_FACTS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAiProcessing]);

  const fetchPoolFromAI = async () => {
    setIsAiProcessing(true);
    setGenerationProgress(0);
    setGenerationStatus("Initializing AI Model...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const model = "gemini-3-flash-preview";

    const prompt = `Generate a large pool of questions for a Karnataka PU Board ${selectedClass} ${selectedSubject} exam.
    Stream: ${selectedStream}
    Chapter/Topic: ${selectedChapter || "Full Syllabus"}
    Allowed Question Types: ${selectedQuestionTypes.join(", ")}
    
    The output must be a JSON array of objects matching this schema:
    {
      "id": "string",
      "text": "string",
      "marks": number,
      "part": "Part A" | "Part B" | "Part C" | "Part D",
      "type": "MCQ" | "Fill in the Blanks" | "True/False" | "Assertion & Reasoning" | "Descriptive",
      "options": ["string", "string", "string", "string"] (only for MCQ),
      "subject": "${selectedSubject}",
      "class": "${selectedClass}",
      "stream": "${selectedStream}",
      "chapter": "${selectedChapter || "General " + selectedSubject}",
      "isMath": boolean,
      "difficulty": "Easy" | "Medium" | "Hard",
      "answer": "string (detailed marking scheme answer)"
    }

    Blueprint Pool Requirements:
    - Part A: 15 questions (ONLY use these types: ${selectedQuestionTypes.filter(t => t !== QuestionType.DESCRIPTIVE).join(", ") || "MCQ"} - 1 mark each)
    - Part B: 10 questions (Descriptive - 2 marks each)
    - Part C: 10 questions (Descriptive - 3 marks each)
    - Part D: 10 questions (Descriptive - 5 marks each)
    Total: 45 questions.
    
    CRITICAL: Only generate questions of the following types: ${selectedQuestionTypes.join(", ")}.
    If "Descriptive" is not selected, do not generate Part B, C, or D questions.
    If objective types are not selected, do not generate Part A questions.

    Ensure Science/Math questions use LaTeX for formulas (e.g., \\( E = mc^2 \\)).
    CRITICAL: For ALL mathematical content, formulas, variables (like V, x, y, λ), or scientific notation, you MUST use LaTeX delimiters: \\( ... \\) for inline and \\[ ... \\] for block math.
    CRITICAL: This applies to the "text" field, "options" array, and "answer" field.
    CRITICAL: If ANY field (text, options, or answer) contains LaTeX or mathematical symbols, the "isMath" property MUST be set to true.
    CRITICAL: Do NOT use plain text for math (e.g., use \\( V \\) instead of just V).
    CRITICAL: For MCQ options, if they contain math, use LaTeX delimiters like \\( ... \\) inside the option strings.`;

    try {
      setGenerationStatus("Analyzing Karnataka PU Board Blueprint...");
      const result = await ai.models.generateContentStream({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                marks: { type: Type.NUMBER },
                part: { type: Type.STRING, enum: ["Part A", "Part B", "Part C", "Part D"] },
                type: { type: Type.STRING, enum: ["MCQ", "Fill in the Blanks", "True/False", "Assertion & Reasoning", "Descriptive"] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                subject: { type: Type.STRING },
                class: { type: Type.STRING },
                stream: { type: Type.STRING },
                chapter: { type: Type.STRING },
                isMath: { type: Type.BOOLEAN },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                answer: { type: Type.STRING }
              },
              required: ["id", "text", "marks", "part", "type", "subject", "class", "stream", "chapter"]
            }
          }
        }
      });

      let fullText = "";
      let chunkCount = 0;
      for await (const chunk of result) {
        fullText += chunk.text;
        chunkCount++;
        
        // Dynamic status updates based on chunks
        if (chunkCount === 2) {
          setGenerationStatus("Generating Part A (MCQs & Objective)...");
          setGenerationProgress(20);
        }
        if (chunkCount === 5) {
          setGenerationStatus("Crafting Part B & C (Short Answers)...");
          setGenerationProgress(50);
        }
        if (chunkCount === 8) {
          setGenerationStatus("Designing Part D (Long Answers)...");
          setGenerationProgress(80);
        }
        if (chunkCount === 12) {
          setGenerationStatus("Finalizing LaTeX Formulas & Marking Scheme...");
          setGenerationProgress(95);
        }
      }

      const data = JSON.parse(fullText);
      setQuestionPool(prev => {
        const existingTexts = new Set(prev.map(q => q.text));
        const uniqueAi = data.filter((q: Question) => !existingTexts.has(q.text));
        return [...prev, ...uniqueAi];
      });
      setGenerationProgress(100);
      setGenerationStatus("Generation Complete!");
    } catch (err) {
      console.error(err);
      setError("AI background processing failed. Using bank questions only.");
    } finally {
      setIsAiProcessing(false);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    setSelectedQuestionIds(new Set());
    
    // 1. Load Bank Questions Immediately
    const bankQuestions = fetchPoolFromBank();
    setQuestionPool(bankQuestions);
    setViewMode('selection');
    setIsGenerating(false);

    // 2. Start AI Processing in Background if mode is AI
    if (generationMode === 'ai') {
      fetchPoolFromAI();
    }
  };

  const finalizePaper = () => {
    const selected = questionPool.filter(q => selectedQuestionIds.has(q.id));
    // Sort by Part A, B, C, D
    const sorted = [...selected].sort((a, b) => {
      const order = { [Part.A]: 1, [Part.B]: 2, [Part.C]: 3, [Part.D]: 4 };
      return order[a.part] - order[b.part];
    });
    setGeneratedQuestions(sorted);
    setViewMode('preview');
  };

  const exportToPDF = async () => {
    const element = document.getElementById('question-paper');
    if (!element) return;

    // Wait for MathJax to finish rendering
    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([element]);
    }

    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Ensure the cloned element is visible for capture
        const el = clonedDoc.getElementById('question-paper');
        if (el) el.style.display = 'block';
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KA_PU_${selectedSubject}_${selectedClass}_Paper.pdf`);
  };

  const cleanLatexForWord = (text: string) => {
    // Basic replacements for common LaTeX symbols to make it readable in Word
    return text
      .replace(/\\\(/g, '')
      .replace(/\\\)/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
      .replace(/\\times/g, '×')
      .replace(/\\pm/g, '±')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\lambda/g, 'λ')
      .replace(/\^\{([^}]+)\}/g, '^$1')
      .replace(/_\{([^}]+)\}/g, '_$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\/g, ''); // Final cleanup of remaining backslashes
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Department of Pre-University Education, Karnataka",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Model Question Paper",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Class: ${selectedClass} | Subject: ${selectedSubject} | Stream: ${selectedStream}`, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          ...[Part.A, Part.B, Part.C, Part.D].flatMap(part => {
            const partQuestions = generatedQuestions.filter(q => q.part === part);
            if (partQuestions.length === 0) return [];

            return [
              new Paragraph({
                text: part,
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 },
              }),
              ...partQuestions.flatMap((q, idx) => {
                const questionText = q.isMath ? cleanLatexForWord(q.text) : q.text;
                const questionParagraph = new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun({ text: questionText }),
                    new TextRun({ text: ` (${q.marks})`, bold: true }),
                  ],
                  spacing: { before: 100, after: 100 },
                });

                if (q.type === 'MCQ' && q.options) {
                  const optionsParagraph = new Paragraph({
                    children: q.options.map((opt, i) => {
                      const optText = q.isMath ? cleanLatexForWord(opt) : opt;
                      return new TextRun({ 
                        text: `${String.fromCharCode(97 + i)}) ${optText}    `,
                        break: i % 2 === 0 && i !== 0 ? 0 : 0 // Simple spacing
                      });
                    }),
                    indent: { left: 720 }, // Indent options
                    spacing: { after: 100 }
                  });
                  return [questionParagraph, optionsParagraph];
                }

                return [questionParagraph];
              })
            ];
          })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `KA_PU_${selectedSubject}_${selectedClass}_Paper.docx`);
  };

  const selectedCountByPart = useMemo(() => {
    const counts = { [Part.A]: 0, [Part.B]: 0, [Part.C]: 0, [Part.D]: 0 };
    let totalMarks = 0;
    Array.from(selectedQuestionIds).forEach(id => {
      const q = questionPool.find(qp => qp.id === id);
      if (q) {
        counts[q.part]++;
        totalMarks += q.marks;
      }
    });
    return { counts, totalMarks };
  }, [selectedQuestionIds, questionPool]);

  const difficultyDistribution = useMemo(() => {
    const dist = { Easy: 0, Medium: 0, Hard: 0 };
    Array.from(selectedQuestionIds).forEach(id => {
      const q = questionPool.find(qp => qp.id === id);
      if (q && q.difficulty) {
        dist[q.difficulty]++;
      }
    });
    return dist;
  }, [selectedQuestionIds, questionPool]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              PU <span className="text-indigo-600">IntelliQ</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">Faculty Portal</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
                <Layers className="w-5 h-5" />
                <h2>Paper Configuration</h2>
              </div>

              {/* Generation Mode Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setGenerationMode('bank')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                    generationMode === 'bank' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Database className="w-4 h-4" />
                  Bank
                </button>
                <button
                  onClick={() => setGenerationMode('ai')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                    generationMode === 'ai' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Gen
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CLASSES.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={cn(
                          "py-2 px-4 rounded-xl text-sm font-medium transition-all border",
                          selectedClass === c 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stream</label>
                  <select 
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chapter / Topic</label>
                  <select 
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">All Chapters (Full Syllabus)</option>
                    {CHAPTER_MAPPING[selectedSubject]?.map(chapter => (
                      <option key={chapter} value={chapter}>{chapter}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Types</label>
                  <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {Object.values(QuestionType).map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={selectedQuestionTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestionTypes([...selectedQuestionTypes, type]);
                            } else {
                              setSelectedQuestionTypes(selectedQuestionTypes.filter(t => t !== type));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" />
                      Institutional Branding
                    </label>
                    <input 
                      type="text"
                      placeholder="College Name"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">Generate Answer Key</span>
                    </div>
                    <button 
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative",
                        showAnswerKey ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        showAnswerKey ? "left-5" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={startGeneration}
                disabled={isGenerating}
                className={cn(
                  "w-full font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group",
                  generationMode === 'ai' 
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                )}
              >
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{generationMode === 'ai' ? 'Fetch AI Pool' : 'Fetch Bank Pool'}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {viewMode === 'selection' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
              >
                <div className="flex items-center justify-between text-indigo-600 font-semibold">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    <h3>Blueprint Validator</h3>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-md font-bold",
                    selectedCountByPart.totalMarks === 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {selectedCountByPart.totalMarks} / 70 Marks
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedCountByPart.counts).map(([part, count]) => (
                    <div key={part} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{part}</p>
                      <p className="text-lg font-bold text-slate-700">{count}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty Balance</h4>
                  <div className="space-y-2">
                    {Object.entries(difficultyDistribution).map(([diff, count]) => (
                      <div key={diff} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{diff}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((count as number) / (selectedQuestionIds.size || 1)) * 100}%` }}
                            className={cn(
                              "h-full rounded-full",
                              diff === 'Easy' ? "bg-emerald-500" : diff === 'Medium' ? "bg-amber-500" : "bg-rose-500"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={finalizePaper}
                  disabled={selectedQuestionIds.size === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Finalize Paper</span>
                </button>
              </motion.div>
            )}

            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold">Blueprint Info</h3>
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Generated papers follow the official Karnataka PU Board blueprint for 2025-26.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-indigo-200">
                  <li className="flex items-center gap-2">• Part A: 1 Mark MCQs</li>
                  <li className="flex items-center gap-2">• Part B: 2 Mark Short Ans</li>
                  <li className="flex items-center gap-2">• Part C: 3 Mark Short Ans</li>
                  <li className="flex items-center gap-2">• Part D: 5 Mark Long Ans</li>
                </ul>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-800 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {viewMode === 'selection' ? (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <LayoutGrid className="text-indigo-600 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          Question Pool
                          {isAiProcessing && (
                            <div className="flex flex-col gap-2 w-64">
                              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                                <span className="flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-2 h-2 animate-spin" />
                                  {generationStatus}
                                </span>
                                <span>{generationProgress}%</span>
                              </div>
                              <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-600"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${generationProgress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 italic truncate">
                                Did you know? {EDUCATIONAL_FACTS[currentFactIndex]}
                              </p>
                            </div>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">Select questions to include in your paper</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {selectedQuestionIds.size} Selected
                    </div>
                  </div>

                  <div className="space-y-8">
                    {[Part.A, Part.B, Part.C, Part.D].map(part => {
                      const partQuestions = questionPool.filter(q => q.part === part);
                      if (partQuestions.length === 0) return null;

                      return (
                        <div key={part} className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-slate-200"></span>
                            {part}
                            <span className="flex-1 h-[1px] bg-slate-200"></span>
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {partQuestions.map(q => (
                              <button
                                key={q.id}
                                onClick={() => toggleQuestionSelection(q.id)}
                                className={cn(
                                  "text-left p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                                  selectedQuestionIds.has(q.id)
                                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-indigo-200"
                                )}
                              >
                                <div className={cn(
                                  "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                  selectedQuestionIds.has(q.id)
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "border-slate-200 group-hover:border-indigo-300"
                                )}>
                                  {selectedQuestionIds.has(q.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4 text-slate-300" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase tracking-wider">
                                      {q.type}
                                    </span>
                                    <p className={cn("text-sm leading-relaxed", q.isMath ? "math-tex" : "")}>{q.text}</p>
                                  </div>
                                  {q.type === 'MCQ' && q.options && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 ml-2">
                                      {q.options.map((opt, i) => (
                                        <div key={i} className="text-xs text-slate-500 flex gap-1">
                                          <span className="font-bold">{String.fromCharCode(97 + i)})</span>
                                          <span className={q.isMath ? "math-tex" : ""}>{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{q.marks} Marks</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded uppercase">{q.chapter}</span>
                                    {q.difficulty && (
                                      <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                        q.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-600" : 
                                        q.difficulty === 'Medium' ? "bg-amber-50 text-amber-600" : 
                                        "bg-rose-50 text-rose-600"
                                      )}>
                                        {q.difficulty}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : viewMode === 'preview' ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileText className="text-green-600 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Final Question Paper</h3>
                        <p className="text-xs text-slate-500">{generatedQuestions.length} questions selected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('selection')}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Edit Selection
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={exportToWord}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-[800px] border border-slate-200 rounded-2xl">
                    <QuestionPaper 
                      questions={generatedQuestions}
                      subject={selectedSubject}
                      className={selectedClass}
                      stream={selectedStream}
                      collegeName={collegeName}
                      showAnswerKey={showAnswerKey}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <FileText className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Build Your Paper?</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mb-8">
                    Choose your subject and generation mode. We'll provide a pool of questions for you to hand-pick from.
                  </p>
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Advanced: Manual selection & Word export enabled</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500">
            © 2026 Karnataka PU Board Question Generator. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
