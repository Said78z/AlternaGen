export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminAuditDetail from '@/components/AdminAuditDetail';

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      template: true,
      events: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!audit) notFound();

  return <AdminAuditDetail audit={audit as any} />;
}
