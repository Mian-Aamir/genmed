// Activity 5 Task 5 (Muhammad Aamir): displays the result returned by the
// instructor-provided window.checkPasswordStrength(password). It receives only the
// result object (level, score, message), never the password itself.
export default function PasswordStrengthMeter({ id, result, unavailable }) {
  if (unavailable) {
    return (
      <div id={id} className="strength" role="status">
        <p className="field-error">Password strength checker is unavailable (password_strength_helper.js did not load).</p>
      </div>
    );
  }
  const level = result?.level?.toLowerCase();
  return (
    <div id={id} className="strength" aria-live="polite">
      {result && (
        <>
          <div className={`strength-meter strength-${level}`} aria-hidden="true">
            {Array.from({ length: result.maximumScore }, (_, index) => (
              <span key={index} className={index < result.score ? 'filled' : ''} />
            ))}
          </div>
          <p className="strength-result">
            Password strength: <strong className={`strength-label strength-${level}`}>{result.level}</strong>
            {' '}· Score {result.score}/{result.maximumScore}
          </p>
          <p className="strength-message">{result.message}</p>
        </>
      )}
    </div>
  );
}
