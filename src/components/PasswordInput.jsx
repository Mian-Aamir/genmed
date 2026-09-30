import { useState } from "react";
import Icon from "./Icon";

export default function PasswordInput({
  id,
  label,
  error,
  newPassword = false,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        {/* SECURITY: Passwords stay only in the live form and use the appropriate autocomplete. */}
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          maxLength={128}
          autoComplete={newPassword ? "new-password" : "current-password"}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help`}
        />
        <button
          className="icon-button"
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Icon name="eye" size={20} />
          <span>{visible ? "Hide" : "Show"}</span>
        </button>
      </div>
      <span id={`${id}-help`} className={error ? "field-error" : "field-hint"}>
        {error || hint}
      </span>
    </div>
  );
}
