export default function ApClassroomLogo({ light = false, className = '' }) {
  return (
    <span
      className={`ap-classroom-logo${light ? ' light' : ''}${className ? ` ${className}` : ''}`}
      aria-label="AP Classroom simulated interface"
    >
      <svg
        className="ap-classroom-logo-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="14" rx="7" ry="9" fill={light ? '#FFFFFF' : '#1E1E1E'} />
        <path
          d="M12 5C12 5 8 7 8 11C8 13 9.5 14.5 12 14.5C14.5 14.5 16 13 16 11C16 7 12 5 12 5Z"
          fill={light ? '#E6EDF8' : '#324DC7'}
        />
        <path
          d="M12 2L14 6H10L12 2Z"
          fill={light ? '#FFFFFF' : '#1E1E1E'}
        />
      </svg>
      <span>AP Classroom</span>
    </span>
  );
}
