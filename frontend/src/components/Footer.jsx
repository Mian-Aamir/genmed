import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <Link className="brand footer-brand" to="/">
            <Icon /> GenMed
          </Link>
          <p>Clearer choices. More affordable care.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/login">Account</Link>
          <Link to="/dashboard">My dashboard</Link>
        </nav>
        <p className="fine-print">
          © {new Date().getFullYear()} GenMed Pakistan
          <br />
          Role-based prototype · Development Activity 2
        </p>
      </div>
    </footer>
  );
}
