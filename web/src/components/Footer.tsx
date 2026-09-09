import { Link } from "react-router-dom";
import roomaLogo from "../assets/rooma-logo.png";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <img src={roomaLogo} alt="Rooma" className="site-footer__logo" />
        <nav className="site-footer__links">
          <Link to="/support">Support &amp; Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>&copy; {year} Rooma. All rights reserved.</p>
        <p className="site-footer__sign">A product of eLPi.dev — Elpyron Ltd.</p>
      </div>
    </footer>
  );
}
