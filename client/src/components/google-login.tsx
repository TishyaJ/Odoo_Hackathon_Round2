import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';

export function GoogleLoginButton() {
  const { login } = useAuth();

  const onGoogleAuth = async (authResult: any) => {
    try {
      if (authResult && authResult.code) {
        const res = await fetch('/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: authResult.code }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Google auth failed');
        }
        const data = await res.json();
        if (data?.token) {
          login(data.token);
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      alert(err instanceof Error ? err.message : 'Google login failed');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: onGoogleAuth,
    onError: onGoogleAuth,
    flow: 'auth-code',
  });

  return (
    <button
      onClick={() => googleLogin()}
      className="flex items-center justify-center w-full py-2 text-sm font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 rounded-md"
    >
      <FcGoogle className="text-xl mr-2" />
      Continue with Google
    </button>
  );
}
