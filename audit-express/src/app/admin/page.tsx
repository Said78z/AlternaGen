export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-yellow-100 text-yellow-800',
  BOOKED: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

export default async function AdminPage() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const stageStats = {
    NEW: audits.filter((a) => a.stage === 'NEW').length,
    QUALIFIED: audits.filter((a) => a.stage === 'QUALIFIED').length,
    BOOKED: audits.filter((a) => a.stage === 'BOOKED').length,
    WON: audits.filter((a) => a.stage === 'WON').length,
    LOST: audits.filter((a) => a.stage === 'LOST').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-bold text-gray-900">Audit Express — Admin</span>
          </div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">Voir le site →</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Pipeline stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {Object.entries(stageStats).map(([stage, count]) => (
            <div key={stage} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[stage]}`}>
                {stage}
              </div>
            </div>
          ))}
        </div>

        {/* Audits table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Tous les audits ({audits.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niche</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(audit.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{audit.nicheKey}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{audit.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        audit.scoreTotal >= 70 ? 'text-green-600' : 
                        audit.scoreTotal >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {audit.scoreTotal}/100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[audit.stage]}`}>
                        {audit.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/audits/${audit.id}`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Aucun audit pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
