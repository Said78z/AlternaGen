import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const stageSchema = z.object({
  stage: z.enum(['NEW', 'QUALIFIED', 'BOOKED', 'WON', 'LOST']),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    const { auditId } = await params;
    const body = await req.json();
    const parsed = stageSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { stage, notes } = parsed.data;
    
    const audit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        stage: stage as any,
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    
    await prisma.auditEvent.create({
      data: {
        auditId,
        type: 'STAGE_CHANGED',
        payload: { stage, notes },
      },
    });
    
    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
