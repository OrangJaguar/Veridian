import { useAuth } from '@/hooks/useAuth';
import { greetingForHour, formatTodayDate } from '@/components/journeys/journeyUtils';

export default function HomeWelcomeHeader() {
  const { user } = useAuth();
  const name = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0];
  const greeting = greetingForHour();

  return (
    <header className="home-welcome">
      <div>
        <h1 className="home-welcome-greeting">
          {name ? `${greeting}, ${name}` : `${greeting}`}
        </h1>
        <p className="home-welcome-date">{formatTodayDate()}</p>
      </div>
    </header>
  );
}
