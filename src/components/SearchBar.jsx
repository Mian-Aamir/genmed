import Icon from "./Icon";

export default function SearchBar({ value, onChange, searching }) {
  return (
    <div className="search-box">
      <label htmlFor="medicine-query">
        Medicine brand or active ingredient
      </label>
      <div className="search-input">
        <Icon name="search" />
        <input
          id="medicine-query"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, 50))}
          maxLength={50}
          placeholder="Try Panadol or Paracetamol"
          autoComplete="off"
          aria-describedby="search-help search-count"
        />
        {value && (
          <button
            type="button"
            className="icon-button"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      <div className="search-meta">
        <span id="search-help">
          {searching
            ? "Searching sample medicines…"
            : "Search by the name on your medicine pack."}
        </span>
        <span id="search-count">{value.length}/50</span>
      </div>
    </div>
  );
}
