'use server';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      // Get provider avatar if available and check Convex profile existence
      if (
        ['google', 'azure'].includes(
          data?.user?.app_metadata?.provider as string,
        )
      ) {
        const userId = data.user?.id;

        if (userId) {
          try {
            const convex = new ConvexHttpClient(
              process.env.NEXT_PUBLIC_CONVEX_URL!,
            );

            // Check if Convex profile exists (do not create)
            const result = await convex.mutation(api.profiles.hasProfile, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              userId,
            });

            if (!result?.exists) {
              return NextResponse.redirect(
                new URL('https://hackerai.co/login'),
              );
            }
          } catch (error) {
            console.error('Error checking Convex profile existence:', error);
          }
        }

        const avatarUrl = data.user.user_metadata?.picture;

        if (avatarUrl && data.user) {
          try {
            // Use Convex mutation directly
            const convex = new ConvexHttpClient(
              process.env.NEXT_PUBLIC_CONVEX_URL!,
            );
            await convex.mutation(api.profiles.updateProfileAvatar, {
              serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
              userId: data.user.id,
              avatarUrl,
            });
          } catch (error) {
            console.error('Error updating profile avatar:', error);
          }
        }
      }
    } catch (error: unknown) {
      // Handle email confirmation success case when user confirms email in the different browser session
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'bad_code_verifier' ||
          error.code === 'validation_failed')
      ) {
        const redirectUrl = new URL(
          '/login',
          process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || requestUrl.origin,
        );
        redirectUrl.searchParams.set('message', 'signin_success');
        return NextResponse.redirect(redirectUrl);
      }

      // For all other errors, log and redirect with generic auth error
      console.error('Authentication error:', error);
      const redirectUrl = new URL(
        '/login',
        process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || requestUrl.origin,
      );
      redirectUrl.searchParams.set('message', 'auth');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle expired email link
  if (error === 'unauthorized_client' && errorCode === '401') {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
    const redirectUrl = new URL(
      '/login?message=code_expired',
      process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || requestUrl.origin,
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
