import { useState, useEffect } from 'react';
import { planApi } from '../services/api';
import { CalendarCheck, Clock, BookOpen, RefreshCw, CheckCircle2, Circle, Flame, BarChart3 } from 'lucide-react';

interface PlanItem {
  id: string;
  type: 'STUDY' | 'REVISION' | 'PRACTICE';
  date: string;
  durationMin: number;
  description: string;
  completed: boolean;
  completedAt?: string;
  chapter: string;
  subject: string;
}

interface Adherence {
  weeklyTotal: number;
  weeklyCompleted: number;
  adherencePercentage: number;
  target: number;
  onTrack: boolean;
}

export default function Plan() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<PlanItem[]>([]);
  const [adherence, setAdherence] = useState<Adherence | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');

  const fetchPlan = async () => {
    try {
      const [planRes, todayRes, adhRes] = await Promise.all([
        planApi.get(),
        planApi.today(),
        planApi.adherence(),
      ]);

      if (planRes.data.plan) {
        setItems(planRes.data.plan.items);
        setHasPlan(true);
      }
      setTodayTasks(todayRes.data.tasks || []);
      if (adhRes.data.adherence) setAdherence(adhRes.data.adherence);
    } catch (err) {
      console.error('Fetch plan error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data } = await planApi.generate();
      setItems(data.plan.items);
      setHasPlan(true);
      // Refresh today's tasks
      const todayRes = await planApi.today();
      setTodayTasks(todayRes.data.tasks || []);
    } catch (err) {
      console.error('Generate plan error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const completeItem = async (itemId: string) => {
    try {
      await planApi.complete(itemId);
      // Update local state
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: true } : i));
      setTodayTasks(prev => prev.map(i => i.id === itemId ? { ...i, completed: true } : i));
      // Refresh adherence
      const { data } = await planApi.adherence();
      if (data.adherence) setAdherence(data.adherence);
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'STUDY': return <BookOpen size={16} className="text-blue-500" />;
      case 'REVISION': return <RefreshCw size={16} className="text-amber-500" />;
      case 'PRACTICE': return <Flame size={16} className="text-rose-500" />;
      default: return <BookOpen size={16} />;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'STUDY': return 'bg-blue-50 text-blue-700';
      case 'REVISION': return 'bg-amber-50 text-amber-700';
      case 'PRACTICE': return 'bg-rose-50 text-rose-700';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getWeekItems = () => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return items.filter(i => {
      const d = new Date(i.date);
      return d >= now && d <= weekEnd;
    });
  };

  const groupByDate = (list: PlanItem[]) => {
    const groups: Record<string, PlanItem[]> = {};
    for (const item of list) {
      const key = new Date(item.date).toLocaleDateString('en-IN', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-laksh-600" />
      </div>
    );
  }

  // ─── No Plan Yet ────────────────────────────────
  if (!hasPlan) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-laksh-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarCheck size={32} className="text-laksh-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Study Plan Yet</h2>
        <p className="text-gray-500 mb-6">
          Generate an adaptive plan based on your goals and diagnostic results.
          The plan prioritizes high-weightage chapters where your mastery is lowest.
        </p>
        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={generatePlan}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            <>
              <CalendarCheck size={18} />
              Generate Study Plan
            </>
          )}
        </button>
      </div>
    );
  }

  // ─── Plan View ──────────────────────────────────
  const displayItems = viewMode === 'today' ? todayTasks : viewMode === 'week' ? getWeekItems() : items;
  const grouped = viewMode === 'today' ? null : groupByDate(displayItems);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-laksh-100 rounded-lg flex items-center justify-center">
            <CalendarCheck size={20} className="text-laksh-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Plan</h1>
            <p className="text-sm text-gray-500">{items.length} total tasks planned</p>
          </div>
        </div>
        <button
          className="btn-secondary flex items-center gap-2 text-sm"
          onClick={generatePlan}
          disabled={generating}
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Today's Tasks</p>
          <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
          <p className="text-xs text-gray-400">
            {todayTasks.filter(t => t.completed).length} done
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Weekly Adherence</p>
          <p className={`text-2xl font-bold ${adherence?.onTrack ? 'text-success-700' : 'text-warning-700'}`}>
            {adherence?.adherencePercentage || 0}%
          </p>
          <p className="text-xs text-gray-400">target: {adherence?.target || 60}%</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-laksh-700">
            {items.filter(i => i.completed).length}
          </p>
          <p className="text-xs text-gray-400">of {items.length}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(['today', 'week', 'all'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode === 'today' ? "Today" : mode === 'week' ? 'This Week' : 'All Tasks'}
          </button>
        ))}
      </div>

      {/* Task List */}
      {viewMode === 'today' ? (
        <div className="space-y-3">
          {todayTasks.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No tasks scheduled for today. Check the weekly view.
            </div>
          ) : (
            todayTasks.map((item) => (
              <TaskCard key={item.id} item={item} onComplete={completeItem} typeIcon={typeIcon} typeBadge={typeBadge} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped && Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">{date}</h3>
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <TaskCard key={item.id} item={item} onComplete={completeItem} typeIcon={typeIcon} typeBadge={typeBadge} />
                ))}
              </div>
            </div>
          ))}
          {displayItems.length === 0 && (
            <div className="card p-8 text-center text-gray-500">No tasks in this view.</div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  item,
  onComplete,
  typeIcon,
  typeBadge,
}: {
  item: PlanItem;
  onComplete: (id: string) => void;
  typeIcon: (type: string) => React.ReactNode;
  typeBadge: (type: string) => string;
}) {
  return (
    <div className={`card p-4 flex items-center gap-4 ${item.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={() => !item.completed && onComplete(item.id)}
        className="shrink-0"
        disabled={item.completed}
      >
        {item.completed ? (
          <CheckCircle2 size={22} className="text-success-500" />
        ) : (
          <Circle size={22} className="text-gray-300 hover:text-laksh-500 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.description}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">{item.subject}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {item.durationMin} min
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {typeIcon(item.type)}
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeBadge(item.type)}`}>
          {item.type}
        </span>
      </div>
    </div>
  );
}
