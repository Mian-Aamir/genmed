import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> MADE FOR PATIENTS IN PAKISTAN
            </span>
            <h1>
              Your medicine.
              <br />
              The same formula.
              <br />
              <em>A lighter bill.</em>
            </h1>
            <p>
              Discover affordable brands with the same active ingredient.
              Understand your options, compare sample prices, and start a better
              conversation about your care.
            </p>
            <div className="actions">
              <Link className="button" to="/search">
                Find Cheaper Medicine <Icon name="arrow" size={19} />
              </Link>
              <Link className="button secondary" to="/login">
                Login
              </Link>
            </div>
            <div className="hero-note">
              <Icon name="shield" size={18} /> Clear information. Thoughtful
              choices.
            </div>
          </div>
          <div className="hero-visual">
            <div className="comparison-preview">
              <div className="preview-heading">
                <span className="medicine-icon">
                  <Icon name="pill" size={25} />
                </span>
                <span>
                  ONE FORMULA, MORE OPTIONS<strong>Paracetamol · 500 mg</strong>
                </span>
                <span className="preview-dot">●</span>
              </div>
              <div className="preview-row">
                <div>
                  <strong>Panadol</strong>
                  <small>Tablet · 10 tablets</small>
                </div>
                <strong>PKR 40</strong>
              </div>
              <div className="preview-row selected">
                <div>
                  <span className="best-label">
                    <Icon name="check" size={15} /> BEST VALUE
                  </span>
                  <strong>Paracetamol Local</strong>
                  <small>Tablet · 10 tablets</small>
                </div>
                <div>
                  <strong>PKR 20</strong>
                  <span className="badge savings">Save 50%</span>
                </div>
              </div>
              <div className="preview-bottom">
                <Icon name="shield" size={17} /> Compare, then confirm with a
                professional.
              </div>
            </div>
            <div className="floating-note">
              <span>
                <Icon name="wallet" />
              </span>
              <div>
                <strong>A small switch. A meaningful saving.</strong>
                <small>Illustrative comparison · not a recommendation</small>
              </div>
            </div>
            <p className="visual-caption">
              Sample prices only. No clinical verification implied.
            </p>
          </div>
        </div>
      </section>
      <section className="assurance-strip">
        <div className="container">
          <span>
            <Icon name="pill" size={19} /> Compare matching formulations
          </span>
          <span>
            <Icon name="wallet" size={19} /> Prices in Pakistani rupees
          </span>
          <span>
            <Icon name="shield" size={19} /> Privacy-conscious by design
          </span>
        </div>
      </section>
      <section className="container section" aria-labelledby="how-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOW IT WORKS</span>
            <h2 id="how-title">Your next step to affordable care.</h2>
          </div>
          <p>
            Three simple steps.
            <br />
            You stay in control.
          </p>
        </div>
        <div className="three-grid">
          {[
            [
              "01",
              "Search your medicine",
              "Enter a brand name or active ingredient from your medicine pack.",
              "search",
            ],
            [
              "02",
              "Explore the alternatives",
              "Compare matching strengths, dosage forms, and sample pack prices.",
              "pill",
            ],
            [
              "03",
              "Confirm before switching",
              "Ask your doctor or pharmacist which option is appropriate for you.",
              "shield",
            ],
          ].map(([number, title, description, icon]) => (
            <article className="step-card" key={number}>
              <div>
                <span className="step-number">{number}</span>
                <Icon name={icon} size={25} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container why-section" aria-labelledby="why-title">
        <div>
          <span className="eyebrow">WHY GENMED</span>
          <h2 id="why-title">
            Better information.
            <br />
            More confident choices.
          </h2>
          <p>
            Medicine costs matter. So does understanding what you are comparing.
          </p>
          <Link className="text-link" to="/search">
            Explore medicine options <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="why-list">
          <article>
            <Icon name="wallet" />
            <div>
              <h3>See potential savings</h3>
              <p>
                Compare approximate prices with a clear, consistent pack size.
              </p>
            </div>
          </article>
          <article>
            <Icon name="pill" />
            <div>
              <h3>Understand the formula</h3>
              <p>See the active ingredient, strength, and form together.</p>
            </div>
          </article>
          <article>
            <Icon name="shield" />
            <div>
              <h3>
                Doctor-verified alternatives{" "}
                <span className="badge">Coming soon</span>
              </h3>
              <p>
                Professional review is planned. Current sample results are not
                verified.
              </p>
            </div>
          </article>
        </div>
      </section>
      <div className="container sample-note">
        Sample data for prototype, real data will come from the DRAP database.
      </div>
    </>
  );
}
