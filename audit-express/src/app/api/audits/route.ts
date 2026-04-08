import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeScore, Question, RecoRule } from '@/lib/scoring';
import { z } from 'zod';

const auditSchema = z.object({
  nicheKey: z.string().min(1),
  email: z.string().email().optional(),
  answers: z.record(z.string(), z.number()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = auditSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { nicheKey, email, answers } = parsed.data;
    
    const template = await prisma.auditTemplate.findUnique({
      where: { nicheKey },
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const { scoreTotal, scoreBreakdown, recommendations } = computeScore(
      template.questions as unknown as Question[],
      answers,
      template.recoRules as unknown as RecoRule[]
    );
    
    const audit = await prisma.audit.create({
      data: {
        nicheKey,
        templateId: nicheKey,
        email,
        answers,
        scoreTotal,
        scoreBreakdown: scoreBreakdown as any,
        recommendations: recommendations as any,
      },
    });
    
    await prisma.auditEvent.create({
      data: {
        auditId: audit.id,
        type: 'CREATED',
        payload: { scoreTotal },
      },
    });
    
    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Error creating audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin: list all audits - protected elsewhere by middleware
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(audits);
}
