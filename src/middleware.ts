import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const validUser = process.env.BASIC_AUTH_USER;
    const validPwd = process.env.BASIC_AUTH_PASSWORD;

    if (user === validUser && pwd === validPwd) {
      return NextResponse.next();
    }
  }

  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Beta Access"',
    },
  });
}