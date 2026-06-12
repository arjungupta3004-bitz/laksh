import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalApi, dashboardApi } from '../services/api';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, BarChart2 } from 'lucide-react';

interface SubjectGoal {
  subject: string;
  subjectCode: string;
  targetMarks: number;
  totalMarks: number;
  targetPercentage: number;
}

interface Feasibility {
  weeksRemaining: number;
  totalChapters: number;
  chaptersPerWeek: number;
  level: 'achievable' | 'challenging' | 'very_challenging';
}

export default function GoalSetup() {
  const navigate = useNavigate();
  const [targetPercentage, setTargetPercentage] = useState(80);
  const [examDate, setExamDate] = useState('2026-03-01');
  const [subjectGoals, setSubjectGoals] = useState<SubjectGoal[]>([]);
  const [feasibility, setFeasibility] = useState<Feasibility | null>(null);
  const [existingGoal, setExistingGoal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // New state for projected score
  const [projectedScore, setProjectedScore] = useState<number | null>(null);
  const [diagnosticsCompleted, setDiagnosticsCompleted] = useState(0);

  useEffect(() => {
    Promise.all([goalApi.get(), dashboardApi.get()])
      .then(([goalRes, dashRes]) => {
        if (goalRes.data.goal) {
          setTargetPercentage(goalRes.data.goal.targetPercentage);
          setExamDate(new Date(goalRes.data.goal.examDate).toISOString().split('T')[0]);
          setSubjectGoals(goalRes.data.goal.subjectGoals);
          setExistingGoal(true);
        }
        if (dashRes.data.dashboard) {
          const readiness = dashRes.data.dashboard.readiness.overall || 0;
          setDiagnosticsCompleted(dashRes.data.dashboard.diagnosticsCompleted || 0);
          if (dashRes.data.dashboard.diagnosticsCompleted > 0) {
            setProjectedScore(Math.min(100, Math.round(readiness + 15)));
          }
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await goalApi.set({
        targetPercentage,
        examDate: new Date(examDate).toISOString(),
      });
      setSubjectGoals(data.goal.subjectGoals);
      setFeasibility(data.feasibility);
      setExistingGoal(true);
    } catch (err) {
      console.error('Goal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const feasibilityColor = {
    achievable: 'text-success-700 bg-success-50',
    challenging: 'text-warning-700 bg-warning-50',
    very_challenging: 'text-danger-700 bg-danger-50',
  };

  const feasibilityIcon = {
    achievable: CheckCircle2,
    challenging: AlertTriangle,
    very_challenging: AlertTriangle,
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-laksh-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-laksh-100 rounded-lg flex items-center justify-center">
          <Target size={20} className="text-laksh-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set Your Goal</h1>
          <p className="text-sm text-gray-500">
            {existingGoal ? 'Update your target score' : 'What score do you want to achieve?'}
          </p>
        </div>
      </div>

      {projectedScore !== null && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-lg">Projected Achievable Score: {projectedScore}%</p>
            <p className="text-sm text-blue-700">
              Based on your {diagnosticsCompleted} completed diagnostic test{diagnosticsCompleted > 1 ? 's' : ''}, our engine estimates you can achieve a {projectedScore}% with an optimal study plan.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Target Percentage</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(Number(e.target.value))}
                  className="flex-1 accent-laksh-600"
                />
                <span className="text-2xl font-bold text-laksh-700 w-16 text-right">
                  {targetPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="label">Exam Date</label>
              <input
                type="date"
                className="input"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading
                ? 'Calculating...'
                : existingGoal
                ? 'Update Goal'
                : 'Set Goal'}
            </button>
          </form>

          {/* Feasibility */}
          {feasibility && (
            <div className={`mt-6 p-4 rounded-lg ${feasibilityColor[feasibility.level]}`}>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = feasibilityIcon[feasibility.level];
                  return <Icon size={18} />;
                })()}
                <span className="font-semibold capitalize">
                  {feasibility.level.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm">
                {feasibility.weeksRemaining} weeks remaining to cover {feasibility.totalChapters} chapters
                ({feasibility.chaptersPerWeek} chapters/week).
              </p>
            </div>
          )}
        </div>

        {/* Subject Breakdown */}
        {subjectGoals.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-laksh-600" />
              Subject-wise Targets
            </h3>
            <div className="space-y-4">
              {subjectGoals.map((sg) => (
                <div key={sg.subjectCode} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{sg.subject}</span>
                    <span className="text-gray-500">
                      {sg.targetMarks}/{sg.totalMarks} marks ({sg.targetPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-laksh-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${sg.targetPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                className="btn-primary w-full"
                onClick={() => navigate('/diagnostic')}
              >
                Next: Take Diagnostic Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
