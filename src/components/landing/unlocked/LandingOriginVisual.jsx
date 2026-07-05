const TIMELINE = [
  {
    id: 'overload',
    when: 'Fall',
    title: 'Three APs on one schedule',
    description: 'Chem, US History, and Psych all hit at once. Reviewing the night before stopped working.',
    chips: ['AP Chem', 'APUSH', 'AP Psych'],
    icon: 'stack',
  },
  {
    id: 'deadends',
    when: 'Winter',
    title: 'Tried everything',
    description: 'Nothing told me if it was working until the grade was already back.',
    deadEnds: ['Re-read notes', 'YouTube marathons', 'Night-before cram'],
    icon: 'loop',
  },
  {
    id: 'built',
    when: 'Now',
    title: 'Built Veridian',
    description: 'A study engine that knows your material, your deadline, and your actual gaps.',
    highlight: true,
    icon: 'spark',
  },
];

function TimelineIcon({ type }) {
  if (type === 'stack') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="6" y="6" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
        <rect x="8" y="2" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      </svg>
    );
  }
  if (type === 'loop') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h7a4 4 0 0 1 0 8H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 7 4 4m3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m13 17-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 13.8 8.6 19.5 9.3 15.2 13.1 16.5 19 12 16.2 7.5 19 8.8 13.1 4.5 9.3 10.2 8.6 12 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingOriginVisual() {
  return (
    <div className="landing-origin-timeline" aria-hidden="true">
      <p className="landing-origin-timeline-heading">Sophomore year</p>
      <div className="landing-origin-timeline-track">
        {TIMELINE.map((event, index) => (
          <div
            key={event.id}
            className={`landing-origin-timeline-item${event.highlight ? ' landing-origin-timeline-item--highlight' : ''}`}
            style={{ '--timeline-i': index }}
          >
            <div className="landing-origin-timeline-rail">
              <span className="landing-origin-timeline-node">
                <TimelineIcon type={event.icon} />
              </span>
              {index < TIMELINE.length - 1 && <span className="landing-origin-timeline-line" />}
            </div>
            <div className="landing-origin-timeline-card">
              <span className="landing-origin-timeline-when">{event.when}</span>
              <strong className="landing-origin-timeline-title">{event.title}</strong>
              <p className="landing-origin-timeline-desc">{event.description}</p>
              {event.chips && (
                <div className="landing-origin-timeline-chips">
                  {event.chips.map((chip) => (
                    <span key={chip} className="landing-origin-timeline-chip">{chip}</span>
                  ))}
                </div>
              )}
              {event.deadEnds && (
                <ul className="landing-origin-timeline-deadends">
                  {event.deadEnds.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
