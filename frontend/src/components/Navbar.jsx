import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [openPath, setOpenPath] = useState(null);
  const open = openPath === pathname;
  const close = () => setOpenPath(null);
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <div className="container nav-wrap">
        <Link className="brand" to="/" onClick={close} aria-label="GenMed home">
          <span className="brand-mark">
            <Icon size={23} />
          </span>
          Gen<span>Med</span>
          <span className="country">PAKISTAN</span>
        </Link>
        <button
          className="menu-toggle icon-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav
          id="primary-navigation"
          className={`navigation ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={close}>
            Home
          </NavLink>
          <NavLink to="/search" onClick={close}>
            Find medicine
          </NavLink>
          {user ? (
            <>
              <span className="welcome">Welcome, {user.name}</span>
              <button
                className="button secondary small"
                onClick={() => {
                  logout();
                  close();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              className="button secondary small"
              to="/login"
              onClick={close}
            >
              Login <Icon name="arrow" size={17} />
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
