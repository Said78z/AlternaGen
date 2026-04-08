'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Option {
  value: number;
  label: string;
}

interface Question {
  id: string;
  category: string;
  text: string;
  weight: number;
  options: Option[];
}

interface Props {
  nicheKey: string;
  questions: Question[];
}

const CATEGORY_LABELS: Record<string, string> = {
  digital: '💻 Digital',
  ops: '⚙️ Opérations',
  sales: '💰 Commercial',
};

export default function AuditForm({ nicheKey, questions }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = questions.length;
  const progress = (Object.keys(answers).length / totalQuestions) * 100;

  const groupedByCategory = questions.reduce<Record<string, Question[]>>((acc, q) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(answers).length < totalQuestions) {
      alert('Veuillez répondre à toutes les questions avant de soumettre.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicheKey, email: email || undefined, answers }),
      });
      
      if (!res.ok) throw new Error('Submission failed');
      
      const audit = await res.json();
      router.push(`/audit/${nicheKey}/result/${audit.id}`);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{Object.keys(answers).length}/{totalQuestions} questions</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions by category */}
      {Object.entries(groupedByCategory).map(([category, qs]) => (
        <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h2 className="font-bold text-green-800 text-lg">
              {CATEGORY_LABELS[category] || category}
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {qs.map((q, idx) => (
              <div key={q.id}>
                <p className="font-medium text-gray-900 mb-3">
                  {idx + 1}. {q.text}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        answers[q.id] === opt.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-100 hover:border-green-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        answers[q.id] === opt.value ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`} />
                      <span className="text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Email + Submit */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Recevoir vos résultats par email (optionnel)</h3>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
        />
        <button
          type="submit"
          disabled={isSubmitting || Object.keys(answers).length < totalQuestions}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
        >
          {isSubmitting ? 'Calcul en cours...' : 'Voir mes résultats →'}
        </button>
        {Object.keys(answers).length < totalQuestions && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Répondez à toutes les questions pour soumettre
          </p>
        )}
      </div>
    </form>
  );
}
