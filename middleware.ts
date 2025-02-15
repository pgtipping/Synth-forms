import { withAuth } from 'next-auth/middleware';

export const runtime = 'nodejs';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/convert/:path*',
  ],
};
