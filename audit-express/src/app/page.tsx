import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold text-green-800">Audit Express</span>
          </div>
          <Link href="/login" className="text-sm text-green-700 hover:text-green-900">
            Admin →
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium mb-6">
            🚀 Nouveau : Audit Express pour agriculteurs TPE/PME
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Évaluez la maturité de<br />
            <span className="text-green-600">votre exploitation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            En 5 minutes, obtenez un diagnostic complet de votre niveau digital, 
            opérationnel et commercial avec des recommandations personnalisées.
          </p>
          <Link
            href="/audit/agri-tpe-pme"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            Démarrer mon audit gratuit
            <span>→</span>
          </Link>
          <p className="mt-4 text-sm text-gray-500">Gratuit • 5 min • Résultats immédiats</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Score /100</h3>
              <p className="text-gray-600">Analyse sur 3 axes : Digital (40pts), Opérations (30pts), Commercial (30pts)</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recommandations</h3>
              <p className="text-gray-600">Top 3 actions prioritaires personnalisées pour votre exploitation</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rapport PDF</h3>
              <p className="text-gray-600">Téléchargez votre rapport complet et partagez-le avec votre équipe</p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choisissez votre secteur</h2>
          <p className="text-gray-600 mb-8">Audit spécialisé par niche pour des recommandations ultra-pertinentes</p>
          <div className="inline-grid grid-cols-1 gap-4">
            <Link
              href="/audit/agri-tpe-pme"
              className="flex items-center gap-4 bg-white border-2 border-green-200 hover:border-green-500 rounded-xl px-8 py-6 transition-colors group"
            >
              <span className="text-4xl">🌾</span>
              <div className="text-left">
                <div className="font-bold text-gray-900 group-hover:text-green-700">Agriculture TPE/PME</div>
                <div className="text-sm text-gray-500">Exploitations agricoles, élevage, maraîchage</div>
              </div>
              <span className="ml-auto text-green-600 group-hover:text-green-800">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Audit Express • Propulsé par AlternaGen
        </div>
      </footer>
    </div>
  );
}
