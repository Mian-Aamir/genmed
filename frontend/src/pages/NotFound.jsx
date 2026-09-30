import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function NotFound() {
  return (
    <section className="container empty-state not-found">
      <span className="empty-icon">
        <Icon name="search" size={36} />
      </span>
      <span className="eyebrow">404 · PAGE NOT FOUND</span>
      <h1>This page took a wrong turn.</h1>
      <p>Let’s get you back to clearer medicine choices.</p>
      <div className="actions">
        <Link className="button" to="/">
          Back to home
        </Link>
        <Link className="button secondary" to="/search">
          Find medicine
        </Link>
      </div>
    </section>
  );
}
