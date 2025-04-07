import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// List of public routes that don't require authentication
const publicRoutes = ['/signin', '/signup', '/reset-password'];

// Temporarily add dashboard to public routes for debugging
const debugRoutes = [
  '/dashboard-home', 
  '/profile',
  '/quotation',
  '/order',
  '/payment',
  '/shipment-tracking'
];

export async function middleware(req: NextRequest) {
  console.log('Middleware executing for path:', req.nextUrl.pathname);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('Middleware session check:', session ? 'Session exists' : 'No session');
  
  const path = req.nextUrl.pathname;
  
  // TEMPORARY: Allow direct access to dashboard-home for debugging
  if (debugRoutes.includes(path)) {
    console.log('DEBUG: Allowing direct access to:', path);
    return NextResponse.next();
  }
  
  // If the user is not logged in and trying to access a protected route
  if (!session && !publicRoutes.includes(path) && !path.startsWith('/_next')) {
    console.log('Redirecting to /signin from:', path);
    const redirectUrl = new URL('/signin', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If user is logged in and trying to access auth pages
  if (session && publicRoutes.includes(path)) {
    console.log('Redirecting to /dashboard-home from:', path);
    const redirectUrl = new URL('/dashboard-home', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  console.log('Continuing to:', path);
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}; 