import { Link } from 'react-router-dom';
import LoginPrompt from '@/components/stubs/LoginPrompt';

export default function StubPage({
  title,
  phase,
  description,
  loginAction,
  children,
  showStudyAppLink = true,
}) {
  return (
    <div className="stub-page">
      <p className="stub-phase">{phase}</p>
      <h1 className="stub-title">{title}</h1>
      <p className="stub-description">{description}</p>
      {loginAction && <LoginPrompt action={loginAction} />}
      {children}
      {showStudyAppLink && (
        <Link to="/app" className="btn btn-primary stub-study-link">
          Open Study App
        </Link>
      )}
    </div>
  );
}
