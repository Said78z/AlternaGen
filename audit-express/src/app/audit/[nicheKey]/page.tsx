export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AuditForm from '@/components/AuditForm';

interface Props {
  params: Promise<{ nicheKey: string }>;
}

export default async function AuditPage({ params }: Props) {
  const { nicheKey } = await params;
  const template = await prisma.auditTemplate.findUnique({
    where: { nicheKey },
  });

  if (!template) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-green-700 hover:text-green-900 text-sm">← Retour</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <span className="text-4xl">🌾</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{template.title}</h1>
          {template.description && (
            <p className="text-gray-600 mt-2">{template.description}</p>
          )}
        </div>
        <AuditForm
          nicheKey={nicheKey}
          questions={template.questions as any}
        />
      </main>
    </div>
  );
}
