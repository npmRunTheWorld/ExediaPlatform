'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { signIn } from '../actions';

// Same screen as the original Login.jsx: looping cloud video, the logo, and the
// Google button. Only the plumbing changed: the credential goes to the server.
export default function LoginClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="login">
        <video src="/media/cloud.mp4" loop muted autoPlay playsInline controls={false} />
        <div className="over">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/AJC_logo.png" width={130} alt="Exedia" draggable={false} />
          </div>
          <div className="btnwrap" aria-busy={pending}>
            <GoogleLogin
              onSuccess={(res) => {
                if (!res.credential) return setError('Google did not return a sign in. Try again.');
                startTransition(async () => {
                  const out = await signIn(res.credential!);
                  if (out.error) setError(out.error);
                  else router.replace('/');
                });
              }}
              onError={() => setError('Sign in was cancelled or failed.')}
            />
          </div>
          {error && <p className="err" role="alert">{error}</p>}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
