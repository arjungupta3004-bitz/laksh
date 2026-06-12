import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import {
  Target, Brain, CalendarCheck, Flame, TrendingUp, Clock,
  ChevronRight, BookOpen, RefreshCw, CheckCircle2, Circle,
} from 'lucide-react';
import { planApi } from '../services/api';

interface DashboardData {
  student: { name: string; board: string; grade: number };
  goal: { targetPercentage: number; examDate: string; daysUntilExam: number } | null;
  readiness: { overall: number; target: number; gap: number };
  subjects: {
    subjectName: string;
    subjectCode: string;
    averageMastery: number;
    chaptersAssessed: number;
    totalChapters: number;
    targetPercentage: number;
  }[];
  todayTasks: {
    id: string;
    type: string;
    durationMin: number;
    description: string;
    completed: boolean;
    chapter: string;
    subject: string;
  }[];
  adherence: { weeklyPercentage: number; target: number; onTrack: boolean };
  streak: { current: number; longest: number };
  diagnosticsCompleted: number;
  totalSubjects: number;
  hasPlan: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await dashboardApi.get();
      setData(res.dashboard);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const completeTask = async (itemId: string) => {
    try {
      await planApi.complete(itemId);
      // Refresh dashboard
      fetchDashboard();
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-laksh-600" />
      </div>
    );
  }

  const readinessPercent = data.goal ? Math.min(100, Math.round((data.readiness.overall / data.readiness.target) * 100)) : 0;

  // Determine which step to prompt next
  const nextStep = !data.goal
    ? { label: 'Set Your Goal', path: '/goals', icon: Target, desc: 'Define your target percentage' }
    : data.diagnosticsCompleted === 0
    ? { label: 'Take Diagnostic', path: '/diagnostic', icon: Brain, desc: 'Assess your chapter mastery' }
    : !data.hasPlan
    ? { label: 'Generate Plan', path: '/plan', icon: CalendarCheck, desc: 'Create your adaptive study plan' }
    : null;

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {data.student.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Class {data.student.grade} {data.student.board}
          {data.goal ? ` \u00B7 ${data.goal.daysUntilExam} days until your exam` : ''}
        </p>
      </div>

      {/* Next step prompt */}
      {nextStep && (
        <button
          onClick={() => navigate(nextStep.path)}
          className="w-full card p-5 mb-6 flex items-center gap-4 hover:shadow-md transition-shadow text-left border-laksh-200 bg-laksh-50"
        >
          <div className="w-12 h-12 bg-laksh-100 rounded-xl flex items-center justify-center shrink-0">
            <nextStep.icon size={24} className="text-laksh-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-laksh-800">Next: {nextStep.label}</p>
            <p className="text-sm text-laksh-600">{nextStep.desc}</p>
          </div>
          <ChevronRight size={20} className="text-laksh-400" />
        </button>
      )}

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Readiness */}
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-2">Readiness</p>
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={readinessPercent >= 70 ? '#10b981' : readinessPercent >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${readinessPercent} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{data.readiness.overall}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Target: {data.readiness.target}%
          </p>
        </div>

        {/* Streak */}
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-2">Streak</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={24} className={data.streak.current > 0 ? 'text-orange-500' : 'text-gray-300'} />
            <span className="text-3xl font-bold text-gray-900">{data.streak.current}</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            {data.streak.current === 1 ? 'day' : 'days'} \u00B7 best: {data.streak.longest}
          </p>
        </div>

        {/* Adherence */}
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-2">Weekly Adherence</p>
          <p className={`text-3xl font-bold text-center ${
            data.adherence.onTrack ? 'text-success-700' : 'text-warning-700'
          }`}>
            {data.adherence.weeklyPercentage}%
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            target: {data.adherence.target}%
          </p>
        </div>

        {/* Diagnostics */}
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-2">Diagnostics</p>
          <p className="text-3xl font-bold text-center text-gray-900">
            {data.diagnosticsCompleted}
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            of {data.totalSubjects} subjects
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarCheck size={18} className="text-laksh-600" />
              Today's Plan
            </h3>
            <button
              onClick={() => navigate('/plan')}
              className="text-xs text-laksh-600 hover:text-laksh-700 font-medium"
            >
              View all
            </button>
          </div>

          {data.todayTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {data.hasPlan ? 'No tasks for today' : 'Generate a plan to see tasks'}
            </div>
          ) : (
            <div className="space-y-3">
              {data.todayTasks.map((task) => (
                <div key={task.id} className={`flex items-center gap-3 ${task.completed ? 'opacity-50' : ''}`}>
                  <button
                    onClick={() => !task.completed && completeTask(task.id)}
                    disabled={task.completed}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={18} className="text-success-500" />
                    ) : (
                      <Circle size={18} className="text-gray-300 hover:text-laksh-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.description}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {task.durationMin} min
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.type === 'STUDY' ? 'bg-blue-50 text-blue-600' :
                    task.type === 'REVISION' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Mastery */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-laksh-600" />
              Subject Mastery
            </h3>
            <button
              onClick={() => navigate('/diagnostic')}
              className="text-xs text-laksh-600 hover:text-laksh-700 font-medium"
            >
              Take test
            </button>
          </div>

          {data.subjects.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              Complete diagnostics to see mastery
            </div>
          ) : (
            <div className="space-y-4">
              {data.subjects.map((subj) => {
                const assessed = subj.chaptersAssessed > 0;
                return (
                  <div key={subj.subjectCode}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{subj.subjectName}</span>
                      <span className="text-gray-500">
                        {assessed ? `${subj.averageMastery}%` : 'Not assessed'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          subj.averageMastery >= 70 ? 'bg-success-500' :
                          subj.averageMastery >= 40 ? 'bg-warning-500' :
                          assessed ? 'bg-danger-500' : 'bg-gray-200'
                        }`}
                        style={{ width: `${assessed ? subj.averageMastery : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{subj.chaptersAssessed}/{subj.totalChapters} chapters assessed</span>
                      {assessed && subj.targetPercentage > 0 && (
                        <span>target: {subj.targetPercentage}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
