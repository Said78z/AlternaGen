export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ResultActions } from '@/components/ResultActions';

interface Props {
  params: Promise<{ nicheKey: string; auditId: string }>;
}

function ScoreGauge({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold">{score}/{max}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function ResultPage({ params }: Props) {
  const { nicheKey, auditId } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { template: true },
  });

  if (!audit || audit.nicheKey !== nicheKey) notFound();

  const breakdown = audit.scoreBreakdown as Record<string, number>;
  const recommendations = audit.recommendations as Array<{ id: string; title: string; description: string; action: string; priority: number }>;
  const template = audit.template;

  const scoreColor = audit.scoreTotal >= 70 ? 'text-green-600' : audit.scoreTotal >= 40 ? 'text-yellow-600' : 'text-red-600';
  const scoreLabel = audit.scoreTotal >= 70 ? 'Excellent' : audit.scoreTotal >= 40 ? 'En développement' : 'À améliorer';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-green-700 hover:text-green-900 text-sm">← Retour à l&apos;accueil</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vos Résultats d&apos;Audit</h1>
          <p className="text-gray-500 mb-6">{template?.title}</p>
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>{audit.scoreTotal}</div>
          <div className="text-xl text-gray-500">/100</div>
          <div className={`mt-2 font-semibold ${scoreColor}`}>{scoreLabel}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Détail par axe</h2>
          <div className="space-y-4">
            <ScoreGauge score={breakdown?.digital || 0} max={40} label="💻 Maturité Digitale" />
            <ScoreGauge score={breakdown?.ops || 0} max={30} label="⚙️ Efficacité Opérationnelle" />
            <ScoreGauge score={breakdown?.sales || 0} max={30} label="💰 Performance Commerciale" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">🎯 Top 3 Recommandations</h2>
          <div className="space-y-4">
            {recommendations?.slice(0, 3).map((reco, i) => (
              <div key={reco.id || i} className="border border-green-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{reco.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{reco.description}</p>
                    <p className="text-green-700 text-sm font-medium">→ {reco.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Passez à l&apos;action</h2>
          <p className="text-green-200 mb-6">Réservez un appel stratégique gratuit de 30 min avec un expert agricole</p>
          {template?.calendlyUrl && (
            <a
              href={template.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors"
            >
              📅 Réserver mon RDV gratuit
            </a>
          )}
        </div>

        <ResultActions auditId={auditId} />
      </main>
    </div>
  );
}
