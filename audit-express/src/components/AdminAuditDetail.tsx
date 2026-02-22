'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAGES = ['NEW', 'QUALIFIED', 'BOOKED', 'WON', 'LOST'];

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-yellow-100 text-yellow-800',
  BOOKED: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

interface AuditEvent {
  id: string;
  type: string;
  createdAt: string;
  payload: unknown;
}

interface Audit {
  id: string;
  nicheKey: string;
  email: string | null;
  scoreTotal: number;
  scoreBreakdown: Record<string, number>;
  recommendations: Array<{ title: string; description: string; action: string }>;
  stage: string;
  notes: string | null;
  createdAt: string;
  template: { title: string; calendlyUrl: string | null };
  events: AuditEvent[];
}

export default function AdminAuditDetail({ audit }: { audit: Audit }) {
  const router = useRouter();
  const [stage, setStage] = useState(audit.stage);
  const [notes, setNotes] = useState(audit.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const breakdown = audit.scoreBreakdown as Record<string, number>;
  const recommendations = audit.recommendations as Array<{ title: string; description: string; action: string }>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/audits/${audit.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/admin" className="text-gray-500 hover:text-gray-900 text-sm">← Retour</a>
          <h1 className="font-bold text-gray-900">Audit #{audit.id.slice(0, 8)}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[stage]}`}>
            {stage}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Score &amp; Résultats</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className={`text-5xl font-bold ${
                audit.scoreTotal >= 70 ? 'text-green-600' : 
                audit.scoreTotal >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {audit.scoreTotal}<span className="text-2xl text-gray-400">/100</span>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Digital</span>
                  <span className="font-medium">{breakdown?.digital || 0}/40</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Opérations</span>
                  <span className="font-medium">{breakdown?.ops || 0}/30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commercial</span>
                  <span className="font-medium">{breakdown?.sales || 0}/30</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 text-sm">Recommandations</h3>
              {recommendations?.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-green-50 rounded-lg p-3">
                  <p className="font-medium text-sm text-gray-900">{r.title}</p>
                  <p className="text-xs text-green-700 mt-1">→ {r.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Historique des événements</h2>
            <div className="space-y-3">
              {audit.events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{event.type}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {new Date(event.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
              {audit.events.length === 0 && (
                <p className="text-gray-400 text-sm">Aucun événement</p>
              )}
            </div>
          </div>
        </div>

        {/* CRM sidebar */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-3">Contact</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{audit.email || 'Non renseigné'}</span>
              </div>
              <div>
                <span className="text-gray-500">Niche:</span>
                <span className="ml-2 text-gray-900">{audit.nicheKey}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(audit.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Stage & CRM */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Pipeline CRM</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Ajouter des notes..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl text-sm transition-colors"
              >
                {saved ? '✅ Sauvegardé !' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Calendly */}
          {audit.template?.calendlyUrl && (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
              <a
                href={audit.template.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-green-700 font-medium text-sm hover:text-green-900"
              >
                📅 Planifier un RDV →
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
