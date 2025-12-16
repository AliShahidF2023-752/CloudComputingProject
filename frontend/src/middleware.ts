import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

const publicPaths = ['/login', '/register', '/']
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('auth-token')?.value

    // Check if user is authenticated
    let isAuthenticated = false
    let userRole = 'USER'
    let isOnboarded = true

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET)
            isAuthenticated = true
            userRole = (payload as { role?: string }).role || 'USER'
        } catch {
            // Token is invalid, treat as unauthenticated
        }
    }

    // If user is on auth pages but already authenticated, redirect to dashboard
    if (isAuthenticated && authPaths.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is on protected pages but not authenticated, redirect to login
    if (!isAuthenticated && !publicPaths.includes(pathname) && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user tries to access admin pages but is not admin
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
