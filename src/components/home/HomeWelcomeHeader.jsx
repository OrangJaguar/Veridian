import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { greetingForHour, formatTodayDate } from '@/components/journeys/journeyUtils';
import { getGreetingName } from '@/utils/userDisplayName';

export default function HomeWelcomeHeader() {
  const { user } = useAuth();
  const { data: preferences } = usePreferences();
  const name = getGreetingName({ user, preferences });
  const greeting = greetingForHour();

  return (
    <header className="home-welcome">
      <div className="home-welcome-row">
        <h1 className="home-welcome-greeting">
          {name ? `${greeting}, ${name}` : greeting}
        </h1>
        <p className="home-welcome-date">{formatTodayDate()}</p>
      </div>
    </header>
  );
}
