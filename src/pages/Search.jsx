import { useEffect, useMemo, useState } from "react";
import SearchBar from "../components/SearchBar";
import MedicineCard from "../components/MedicineCard";
import Icon from "../components/Icon";
import { medicines, comparisonKey } from "../data/medicines";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [form, setForm] = useState("all");
  const [sort, setSort] = useState("asc");
  // SECURITY: Search text is length-limited and rendered only through React escaping.
  const normalized = query.trim().toLowerCase().slice(0, 50);
  const searching = normalized !== debounced;
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(normalized), 350);
    return () => window.clearTimeout(timer);
  }, [normalized]);
  const groups = useMemo(() => {
    if (!debounced) return [];
    const matches = medicines.filter((item) =>
      `${item.brand} ${item.formula}`.toLowerCase().includes(debounced),
    );
    const keys = [...new Set(matches.map(comparisonKey))];
    return keys.map((key) => {
      const all = medicines.filter((item) => comparisonKey(item) === key);
      const prices = all.map((item) => item.price);
      return {
        key,
        all,
        matchedIds: matches.map((item) => item.id),
        minimum: Math.min(...prices),
        maximum: Math.max(...prices),
      };
    });
  }, [debounced]);
  const visibleGroups = groups.filter(
    (group) => form === "all" || group.all[0].form === form,
  );
  const count = visibleGroups.reduce(
    (total, group) => total + group.all.length,
    0,
  );
  function changeQuery(value) {
    setQuery(value);
    setForm("all");
  }
  return (
    <div className="search-page">
      <section className="search-heading">
        <div className="container">
          <span className="eyebrow">MAKE AN INFORMED CHOICE</span>
          <h1>Same formula. Explore your options.</h1>
          <p>
            Find your medicine, understand its ingredients, and compare sample
            prices.
          </p>
          <SearchBar
            value={query}
            onChange={changeQuery}
            searching={searching}
          />
          <div className="suggestions">
            <span>Try a search:</span>
            {["Panadol", "Ibuprofen", "Omeprazole"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => changeQuery(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section
        className="container results-section"
        aria-label="Medicine results"
      >
        <div className="sample-note">
          <Icon name="shield" size={18} />
          <span>
            Sample data for prototype, real data will come from the DRAP
            database.
            <br />
            <small>
              Brand details and prices are illustrative, unverified, and not
              live DRAP records.
            </small>
          </span>
        </div>
        <div className="filter-row">
          <div>
            <h2>Medicine comparisons</h2>
            <p aria-live="polite" role="status">
              {searching
                ? "Searching…"
                : debounced
                  ? `${count} sample options in ${visibleGroups.length} matching groups`
                  : "Start with a brand or active ingredient."}
            </p>
          </div>
          <div className="filters">
            <div className="field">
              <label htmlFor="dosage-form">Dosage form</label>
              <select
                id="dosage-form"
                value={form}
                onChange={(event) => setForm(event.target.value)}
              >
                <option value="all">All forms</option>
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="price-sort">Sort by price</label>
              <select
                id="price-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="asc">Low to high</option>
                <option value="desc">High to low</option>
              </select>
            </div>
          </div>
        </div>
        <div aria-busy={searching}>
          {searching ? (
            <div className="empty-state">
              <Icon name="search" size={36} />
              <h3>Searching sample medicines…</h3>
              <p>Finding matching ingredients and comparable packs.</p>
            </div>
          ) : !debounced ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="search" size={32} />
              </span>
              <h2>Let’s find out what’s in your medicine.</h2>
              <p>
                Search a brand like Panadol or an ingredient like Paracetamol.
                <br />
                Your comparison will appear here.
              </p>
              <span className="badge">
                15 sample medicines · 5 active ingredients
              </span>
            </div>
          ) : !count ? (
            <div className="empty-state">
              <Icon name="search" size={36} />
              <h2>
                {groups.length
                  ? "No options in this dosage form"
                  : "No medicine found, check spelling"}
              </h2>
              <p>
                {groups.length
                  ? "Try all dosage forms to see the matching sample results."
                  : "Try a different brand or search by active ingredient."}
              </p>
              <button
                className="button secondary"
                onClick={() =>
                  groups.length ? setForm("all") : changeQuery("")
                }
              >
                {groups.length ? "Show all forms" : "Clear search"}
              </button>
            </div>
          ) : (
            visibleGroups.map((group) => (
              <section
                className="formula-group"
                key={group.key}
                aria-labelledby={`group-${group.all[0].id}`}
              >
                <div className="formula-banner">
                  <span className="medicine-icon">
                    <Icon name="pill" />
                  </span>
                  <div>
                    <span className="eyebrow">MATCHING ACTIVE INGREDIENT</span>
                    <h2 id={`group-${group.all[0].id}`}>
                      {group.all[0].formula}
                    </h2>
                    <p>
                      {group.all[0].strength} · {group.all[0].form} ·{" "}
                      {group.all[0].pack}
                    </p>
                  </div>
                </div>
                <p className="comparison-caption">
                  Search matches and same-formulation alternatives. Savings
                  compare with the highest sample pack price in this group (PKR{" "}
                  {group.maximum}). Best Value means lowest sample price, not
                  clinical suitability.
                </p>
                <div className="medicine-grid">
                  {[...group.all]
                    .sort((a, b) =>
                      sort === "asc" ? a.price - b.price : b.price - a.price,
                    )
                    .map((medicine) => (
                      <MedicineCard
                        key={medicine.id}
                        medicine={medicine}
                        maximum={group.maximum}
                        minimum={group.minimum}
                        matched={group.matchedIds.includes(medicine.id)}
                      />
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
        <aside className="safety-note">
          <Icon name="shield" size={23} />
          <div>
            <strong>Your safety comes first</strong>
            <p>
              Always confirm with your doctor or pharmacist before switching
              medicines. Prices are approximate.
            </p>
            <small>
              Matching ingredients alone do not establish interchangeability.
              Amoxicillin is an antibiotic; use only as prescribed.
            </small>
          </div>
        </aside>
      </section>
    </div>
  );
}
