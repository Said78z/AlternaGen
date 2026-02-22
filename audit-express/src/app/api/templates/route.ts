import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  nicheKey: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ nicheKey: searchParams.get('nicheKey') });
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'nicheKey is required' }, { status: 400 });
  }
  
  const template = await prisma.auditTemplate.findUnique({
    where: { nicheKey: parsed.data.nicheKey },
  });
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  
  return NextResponse.json(template);
}
