'use client';

import { useState } from 'react';

interface Props {
  auditId: string;
}

export function ResultActions({ auditId }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/pdf`, { method: 'POST' });
      const data = await res.json();
      if (data.signedUrl) {
        setPdfUrl(data.signedUrl);
      } else {
        alert('PDF généré mais lien non disponible (vérifiez la config Supabase).');
      }
    } catch {
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await fetch(`/api/audits/${auditId}/email`, { method: 'POST' });
      if (res.ok) {
        setEmailSent(true);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'envoi de l'email.");
      }
    } catch {
      alert("Erreur lors de l'envoi de l'email.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-bold text-gray-900 text-lg mb-4">📥 Télécharger &amp; Partager</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            download
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl text-center transition-colors"
          >
            ⬇️ Télécharger le PDF
          </a>
        ) : (
          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            {pdfLoading ? 'Génération...' : '📄 Générer le rapport PDF'}
          </button>
        )}
        <button
          onClick={handleSendEmail}
          disabled={emailSent}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          {emailSent ? '✅ Email envoyé !' : '📧 Recevoir par email'}
        </button>
      </div>
    </div>
  );
}
