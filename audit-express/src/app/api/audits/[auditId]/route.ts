import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { events: { orderBy: { createdAt: 'desc' } } },
  });
  
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }
  
  return NextResponse.json(audit);
}
