export default function PasswordStrengthMeter({ strength }) {
  if (!strength) return null;

  return (
    <div className={`password-strength password-strength-${strength.level.toLowerCase()}`} role="status" aria-live="polite">
      <strong>Password strength: {strength.level}</strong>
      <span>{strength.score}/{strength.maximumScore}</span>
      <p>{strength.message}</p>
    </div>
  );
}
