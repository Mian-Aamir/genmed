import Icon from "./Icon";

export default function MedicineCard({ medicine, maximum, minimum, matched }) {
  const saving = Math.round(((maximum - medicine.price) / maximum) * 100);
  const best = medicine.price === minimum;
  return (
    <article className={`medicine-card ${best ? "best-value" : ""}`}>
      <div className="card-top">
        <span className="medicine-icon">
          <Icon name="pill" />
        </span>
        <span className="badge savings">Save {saving}%</span>
      </div>
      <div className="medicine-title">
        <h3>{medicine.brand}</h3>
        {best && (
          <span className="best-label">
            <Icon name="check" size={15} /> Best Value
          </span>
        )}
      </div>
      <p className="formula">{medicine.formula}</p>
      <div className="tags">
        <span>{medicine.strength}</span>
        <span>{medicine.form}</span>
        {matched && <span>Search match</span>}
      </div>
      <dl>
        <div>
          <dt>Manufacturer</dt>
          <dd>{medicine.manufacturer}</dd>
        </div>
        <div>
          <dt>Comparison pack</dt>
          <dd>{medicine.pack}</dd>
        </div>
      </dl>
      <div className="price-row">
        <div>
          <span className="field-hint">Approximate pack price</span>
          <strong>PKR {medicine.price.toLocaleString("en-PK")}</strong>
        </div>
        <span className="field-hint">Sample price</span>
      </div>
    </article>
  );
}
