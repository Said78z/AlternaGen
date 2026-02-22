import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

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
    
    if (!audit.email) {
      return NextResponse.json({ error: 'No email address for this audit' }, { status: 400 });
    }
    
    let pdfSignedUrl: string | null = null;
    
    if (audit.pdfPath) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin.storage
        .from('audit-reports')
        .createSignedUrl(audit.pdfPath, 60 * 60 * 24 * 7);
      pdfSignedUrl = data?.signedUrl || null;
    }
    
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    
    if (resendKey && !fromEmail) {
      return NextResponse.json({ error: 'RESEND_FROM_EMAIL is not configured' }, { status: 500 });
    }
    const scoreBreakdown = audit.scoreBreakdown as Record<string, number>;
    const recommendations = audit.recommendations as Array<{ title: string; description: string; action: string }>;
    
    const emailHtml = `
      <h1>Votre Rapport d'Audit Express Agricole</h1>
      <p>Merci d'avoir complété votre audit. Voici un résumé de vos résultats :</p>
      <h2>Score Global : ${audit.scoreTotal}/100</h2>
      <ul>
        <li>Digital : ${scoreBreakdown?.digital || 0}/40</li>
        <li>Opérations : ${scoreBreakdown?.ops || 0}/30</li>
        <li>Commercial : ${scoreBreakdown?.sales || 0}/30</li>
      </ul>
      <h2>Top 3 Recommandations</h2>
      ${recommendations?.slice(0, 3).map((r, i) => `
        <h3>${i + 1}. ${r.title}</h3>
        <p>${r.description}</p>
        <p><strong>Action :</strong> ${r.action}</p>
      `).join('') || '<p>Aucune recommandation disponible.</p>'}
      ${pdfSignedUrl ? `<p><a href="${pdfSignedUrl}">Télécharger votre rapport complet (PDF)</a></p>` : ''}
      <p>À très bientôt,<br/>L'équipe Audit Express</p>
    `;
    
    if (!resendKey) {
      console.log('[DEV] Email would be sent to:', audit.email);
      console.log('[DEV] Subject: Votre rapport Audit Express Agricole');
      console.log('[DEV] PDF URL:', pdfSignedUrl);
    } else {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: fromEmail!,
        to: audit.email,
        subject: 'Votre rapport Audit Express Agricole',
        html: emailHtml,
      });
    }
    
    await prisma.auditEvent.create({
      data: {
        auditId,
        type: 'EMAIL_SENT',
        payload: { to: audit.email, hasPdf: !!pdfSignedUrl },
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
