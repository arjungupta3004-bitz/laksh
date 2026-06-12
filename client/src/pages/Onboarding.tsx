import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../services/api';
import { GraduationCap, Calendar, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { student, setStudent } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [board] = useState('CBSE');
  const [grade] = useState(10);
  const [examDate, setExamDate] = useState('2026-03-01');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.onboard({
        board,
        grade,
        examDate: new Date(examDate).toISOString(),
      });
      setStudent(data.student);
      navigate('/goals');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Welcome to Laksh!',
      subtitle: `Hi ${student?.name?.split(' ')[0] || 'there'}! Let's set you up for board exam success.`,
      content: (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-laksh-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={40} className="text-laksh-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">CBSE Class 10</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Your board and grade are pre-set for this MVP. Laksh will help you achieve your target
            score through a personalized adaptive plan.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="card px-4 py-3 text-center">
              <p className="text-xs text-gray-400">Board</p>
              <p className="font-semibold text-laksh-700">{board}</p>
            </div>
            <div className="card px-4 py-3 text-center">
              <p className="text-xs text-gray-400">Class</p>
              <p className="font-semibold text-laksh-700">{grade}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'When is your exam?',
      subtitle: 'This helps us build a study plan that fits your timeline.',
      content: (
        <div className="py-8">
          <div className="w-16 h-16 bg-laksh-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-laksh-600" />
          </div>
          <div className="max-w-xs mx-auto">
            <label className="label text-center">Expected Exam Date</label>
            <input
              type="date"
              className="input text-center"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              CBSE Class 10 boards are typically in Feb-March
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="card p-8">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-laksh-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900">{currentStep.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{currentStep.subtitle}</p>

          {currentStep.content}

          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <button className="btn-secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              className="btn-primary flex items-center gap-2"
              onClick={isLast ? handleComplete : () => setStep(step + 1)}
              disabled={loading}
            >
              {loading ? 'Setting up...' : isLast ? 'Get Started' : 'Next'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
