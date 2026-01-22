import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* LOGO */}
        <div className="nav-logo">
          🤟 <span>Sign Language AI</span>
        </div>

        {/* DESKTOP LINKS */}
        <nav className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/sign-to-voice">Sign → Voice</NavLink>
          <NavLink to="/voice-to-sign">Voice → Sign</NavLink>
        </nav>

        {/* MOBILE TOGGLE */}
        <button
          className="nav-toggle"
          onClick={() => setOpen(v => !v)}
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="nav-mobile">
          <NavLink onClick={() => setOpen(false)} to="/">Home</NavLink>
          <NavLink onClick={() => setOpen(false)} to="/sign-to-voice">
            Sign → Voice
          </NavLink>
          <NavLink onClick={() => setOpen(false)} to="/voice-to-sign">
            Voice → Sign
          </NavLink>
        </div>
      )}
    </header>
  );
}
