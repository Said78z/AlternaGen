import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin') || (pathname === '/api/audits' && req.method === 'GET')) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  req.cookies.get('sb-access-token')?.value ||
                  req.cookies.get('supabase-auth-token')?.value;
    
    if (!token) {
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify token with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.auth.getUser(token);
      
      if (error) {
        if (pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL('/login', req.url));
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/audits'],
};
