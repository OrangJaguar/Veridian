import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicOnly from '@/components/routing/PublicOnly';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  function handleSuccess(user) {
    setUser(user);
    const redirect = searchParams.get('redirect');
    navigate(redirect && redirect.startsWith('/') ? redirect : '/home', { replace: true });
  }

  return (
    <PublicOnly>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Sign in to Veridian
        </h1>
        <AuthForm defaultTab="login" onSuccess={handleSuccess} />
      </div>
    </PublicOnly>
  );
}
