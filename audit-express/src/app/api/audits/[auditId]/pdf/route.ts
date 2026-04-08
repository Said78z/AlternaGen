import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { AuditReport } from '@/components/pdf/AuditReport';
import React, { ReactElement } from 'react';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    const { auditId } = await params;
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { template: true },
    });
    
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }
    
    // Cast via unknown since AuditReport renders a <Document> which satisfies DocumentProps at runtime
    const element = (React.createElement(AuditReport, { audit }) as unknown) as ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(element);
    
    const supabaseAdmin = getSupabaseAdmin();
    const fileName = `audits/${auditId}/rapport.pdf`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('audit-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('audit-reports')
      .createSignedUrl(fileName, 60 * 60 * 24);
    
    await prisma.audit.update({
      where: { id: auditId },
      data: { pdfPath: fileName },
    });
    
    await prisma.auditEvent.create({
      data: {
        auditId,
        type: 'PDF_GENERATED',
        payload: { pdfPath: fileName },
      },
    });
    
    return NextResponse.json({ signedUrl: signedUrlData?.signedUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
