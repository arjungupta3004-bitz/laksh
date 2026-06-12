import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticApi } from '../services/api';
import { Brain, CheckCircle2, XCircle, ChevronRight, BarChart3 } from 'lucide-react';

const SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', color: 'bg-blue-500' },
  { code: 'SCI', name: 'Science', color: 'bg-green-500' },
  { code: 'SST', name: 'Social Science', color: 'bg-amber-500' },
  { code: 'ENG', name: 'English', color: 'bg-purple-500' },
  { code: 'HIN', name: 'Hindi', color: 'bg-rose-500' },
];

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  difficulty: string;
  chapter: { name: string; chapterNo: number };
}

interface MasteryItem {
  subjectName: string;
  subjectCode: string;
  averageMastery: number;
  chapters: { chapterName: string; chapterNo: number; score: number; level: string }[];
}

type View = 'subjects' | 'quiz' | 'result' | 'mastery';

export default function Diagnostic() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('subjects');
  const [currentSubject, setCurrentSubject] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string | null } | null>(null);
  const [masteryResult, setMasteryResult] = useState<any[]>([]);
  const [mastery, setMastery] = useState<MasteryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedSubjects, setCompletedSubjects] = useState<string[]>([]);

  // Load existing mastery and completed sessions
  useEffect(() => {
    Promise.all([diagnosticApi.mastery(), diagnosticApi.sessions()]).then(([masteryRes, sessionsRes]) => {
      if (masteryRes.data.mastery?.length > 0) {
        setMastery(masteryRes.data.mastery);
      }
      const completed = sessionsRes.data.sessions
        ?.filter((s: any) => s.status === 'COMPLETED')
        .map((s: any) => s.subjectCode) || [];
      setCompletedSubjects([...new Set(completed)] as string[]);
    }).catch(console.error);
  }, []);

  const startDiagnostic = async (subjectCode: string) => {
    setLoading(true);
    setCurrentSubject(subjectCode);
    try {
      const { data } = await diagnosticApi.start(subjectCode);
      setSessionId(data.session.id);
      setQuestion(data.nextQuestion);
      setAnswered(data.questionsAnswered);
      setFeedback(null);
      setSelectedAnswer('');
      setView('quiz');
    } catch (err) {
      console.error('Start diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !question) return;
    setSubmitting(true);
    try {
      const { data } = await diagnosticApi.answer({
        sessionId,
        questionId: question.id,
        answer: selectedAnswer,
      });

      setFeedback({ isCorrect: data.isCorrect, explanation: data.explanation });
      setAnswered(data.questionsAnswered);

      if (data.sessionComplete) {
        setMasteryResult(data.masteryScores);
        setTimeout(() => {
          setView('result');
          setCompletedSubjects((prev) => [...new Set([...prev, currentSubject])]);
        }, 2000);
      } else {
        // Show feedback briefly, then move to next question
        setTimeout(() => {
          setQuestion(data.nextQuestion);
          setSelectedAnswer('');
          setFeedback(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Answer error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const viewMastery = async () => {
    try {
      const { data } = await diagnosticApi.mastery();
      setMastery(data.mastery);
      setView('mastery');
    } catch (err) {
      console.error('Mastery error:', err);
    }
  };

  const levelColor = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-success-500';
      case 'moderate': return 'bg-warning-500';
      case 'weak': return 'bg-danger-500';
      default: return 'bg-gray-300';
    }
  };

  const levelBg = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-success-50 text-success-700';
      case 'moderate': return 'bg-warning-50 text-warning-700';
      case 'weak': return 'bg-danger-50 text-danger-700';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  // ─── Subject Selection View ─────────────────────
  if (view === 'subjects') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-laksh-100 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-laksh-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Diagnostic Tests</h1>
              <p className="text-sm text-gray-500">Take a test to assess your chapter-level mastery</p>
            </div>
          </div>

          {completedSubjects.length > 0 && (
            <button className="btn-secondary flex items-center gap-2" onClick={viewMastery}>
              <BarChart3 size={16} />
              View Mastery Map
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((subj) => {
            const isCompleted = completedSubjects.includes(subj.code);
            const subjectMastery = mastery.find(m => m.subjectCode === subj.code);
            return (
              <div key={subj.code} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${subj.color}`} />
                    <h3 className="font-semibold text-gray-900">{subj.name}</h3>
                  </div>
                  {isCompleted && (
                    <span className="text-xs bg-success-50 text-success-700 px-2 py-1 rounded-full font-medium">
                      Completed
                    </span>
                  )}
                </div>

                {subjectMastery && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Average Mastery</span>
                      <span>{subjectMastery.averageMastery}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-laksh-500 h-2 rounded-full transition-all"
                        style={{ width: `${subjectMastery.averageMastery}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  onClick={() => startDiagnostic(subj.code)}
                  disabled={loading}
                >
                  {isCompleted ? 'Retake Test' : 'Start Test'}
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {completedSubjects.length >= 2 && (
          <div className="mt-6 card p-4 bg-laksh-50 border-laksh-200">
            <p className="text-sm text-laksh-700 text-center">
              You've completed {completedSubjects.length} diagnostics.{' '}
              <button
                className="font-semibold underline"
                onClick={() => navigate('/plan')}
              >
                Generate your study plan
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── Quiz View ──────────────────────────────────
  if (view === 'quiz') {
    const subjectName = SUBJECTS.find(s => s.code === currentSubject)?.name || '';

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{subjectName} Diagnostic</h2>
            <p className="text-sm text-gray-500">Question {answered + 1} of 20</p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              question?.difficulty === 'EASY' ? 'bg-success-50 text-success-700' :
              question?.difficulty === 'HARD' ? 'bg-danger-50 text-danger-700' :
              'bg-warning-50 text-warning-700'
            }`}>
              {question?.difficulty}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div
            className="bg-laksh-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((answered) / 20) * 100}%` }}
          />
        </div>

        {question ? (
          <div className="card p-6">
            <p className="text-xs text-gray-400 mb-2">
              Chapter {question.chapter.chapterNo}: {question.chapter.name}
            </p>
            <p className="text-gray-900 font-medium mb-6 text-lg leading-relaxed">
              {question.text}
            </p>

            <div className="space-y-3">
              {(question.options as string[])?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => !feedback && setSelectedAnswer(option)}
                  disabled={!!feedback}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                    feedback
                      ? option === selectedAnswer
                        ? feedback.isCorrect
                          ? 'border-success-500 bg-success-50'
                          : 'border-danger-500 bg-danger-50'
                        : 'border-gray-100 bg-gray-50 opacity-50'
                      : selectedAnswer === option
                      ? 'border-laksh-500 bg-laksh-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-400 mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                feedback.isCorrect ? 'bg-success-50' : 'bg-danger-50'
              }`}>
                {feedback.isCorrect
                  ? <CheckCircle2 size={20} className="text-success-500 mt-0.5" />
                  : <XCircle size={20} className="text-danger-500 mt-0.5" />
                }
                <div>
                  <p className={`font-medium text-sm ${feedback.isCorrect ? 'text-success-700' : 'text-danger-700'}`}>
                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  {feedback.explanation && (
                    <p className="text-sm text-gray-600 mt-1">{feedback.explanation}</p>
                  )}
                </div>
              </div>
            )}

            {!feedback && (
              <button
                className="btn-primary w-full mt-6"
                onClick={submitAnswer}
                disabled={!selectedAnswer || submitting}
              >
                {submitting ? 'Checking...' : 'Submit Answer'}
              </button>
            )}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No more questions available for this subject.</p>
            <button className="btn-primary mt-4" onClick={() => setView('subjects')}>
              Back to Subjects
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Result View ────────────────────────────────
  if (view === 'result') {
    const subjectName = SUBJECTS.find(s => s.code === currentSubject)?.name || '';

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-laksh-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-laksh-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnostic Complete!</h2>
          <p className="text-gray-500 mt-1">{subjectName} — Chapter-level mastery</p>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Mastery Scores</h3>
          <div className="space-y-3">
            {masteryResult.sort((a, b) => a.chapterNo - b.chapterNo).map((ch) => (
              <div key={ch.chapterNo} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">Ch{ch.chapterNo}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate pr-2">{ch.chapter}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-500">{ch.score}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBg(ch.level)}`}>
                        {ch.level}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${levelColor(ch.level)}`}
                      style={{ width: `${ch.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-secondary flex-1" onClick={() => setView('subjects')}>
            Test Another Subject
          </button>
          <button className="btn-primary flex-1" onClick={() => navigate('/plan')}>
            Generate Study Plan
          </button>
        </div>
      </div>
    );
  }

  // ─── Mastery Map View ───────────────────────────
  if (view === 'mastery') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-laksh-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-laksh-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mastery Map</h1>
              <p className="text-sm text-gray-500">Your chapter-level strengths and weaknesses</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setView('subjects')}>
            Back to Tests
          </button>
        </div>

        <div className="space-y-6">
          {mastery.map((subj) => (
            <div key={subj.subjectCode} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{subj.subjectName}</h3>
                <span className="text-sm text-laksh-600 font-medium">
                  Avg: {subj.averageMastery}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {subj.chapters.sort((a, b) => a.chapterNo - b.chapterNo).map((ch) => (
                  <div
                    key={ch.chapterNo}
                    className={`p-3 rounded-lg text-center ${levelBg(ch.level)}`}
                    title={`${ch.chapterName}: ${ch.score}%`}
                  >
                    <p className="text-xs font-medium truncate">{ch.chapterName}</p>
                    <p className="text-lg font-bold mt-1">{ch.score}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button className="btn-primary" onClick={() => navigate('/plan')}>
            Generate Study Plan
          </button>
        </div>
      </div>
    );
  }

  return null;
}
