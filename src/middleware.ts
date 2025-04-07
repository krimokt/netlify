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

// Routes that should be accessible without authentication (static assets, etc.)
const alwaysPublicPatterns = [
  /^\/api\//,
  /^\/_next\//,
  /^\/images\//,
  /^\/favicon\.ico$/,
];

export async function middleware(req: NextRequest) {
  console.log('Middleware executing for path:', req.nextUrl.pathname);
  
  // Check if the path should always be public
  const isAlwaysPublic = alwaysPublicPatterns.some(pattern => pattern.test(req.nextUrl.pathname));
  if (isAlwaysPublic) {
    console.log('Path is always public, allowing access:', req.nextUrl.pathname);
    return NextResponse.next();
  }
  
  // Initialize response
  const res = NextResponse.next();
  
  try {
    // Create Supabase client with the request
    const supabase = createMiddlewareClient({ req, res });
    
    // Get session data
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log('Middleware session check:', session ? 'Session exists' : 'No session');
    
    // Get current path
    const path = req.nextUrl.pathname;
    
    // TEMPORARY: Allow direct access to dashboard and other routes for debugging
    if (debugRoutes.includes(path)) {
      console.log('DEBUG: Allowing direct access to:', path);
      return NextResponse.next();
    }
    
    // If the user is not logged in and trying to access a protected route
    if (!session && !publicRoutes.includes(path)) {
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
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of error, allow access to public routes
    const path = req.nextUrl.pathname;
    if (publicRoutes.includes(path) || debugRoutes.includes(path)) {
      console.log('Error occurred, but path is public or debug, allowing access:', path);
      return NextResponse.next();
    }
    
    // For other routes, redirect to signin for safety
    console.log('Error occurred, redirecting to /signin from:', path);
    const redirectUrl = new URL('/signin', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}; 