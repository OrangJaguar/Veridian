import { useNavigate } from 'react-router-dom';
import PublicOnly from '@/components/routing/PublicOnly';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { provisionStarterJourney } from '@/api/entities/starterJourney';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSuccess(user) {
    setUser(user);
    try {
      await provisionStarterJourney();
    } catch {
      // HomePage hook will retry if provisioning fails here
    }
    navigate('/home', { replace: true });
  }

  return (
    <PublicOnly>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Create an account
        </h1>
        <AuthForm defaultTab="signup" onSuccess={handleSuccess} />
      </div>
    </PublicOnly>
  );
}
