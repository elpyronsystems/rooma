import { useState } from "react";
import "./SearchBar.css";

interface SearchBarProps {
  initialLocation?: string;
  initialSearch?: string;
  onSearch?: (params: { location: string; search: string }) => void;
  compact?: boolean;
}

export function SearchBar({
  initialLocation = "Accra, Ghana",
  initialSearch = "",
  onSearch,
  compact = false,
}: SearchBarProps) {
  const [location, setLocation] = useState(initialLocation);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  function handleSubmit() {
    onSearch?.({ location, search: searchTerm });
  }

  return (
    <section className={`search-bar${compact ? " search-bar--compact" : ""}`}>
      <div className="search-bar__field">
        <label>Where are you going?</label>
        <div className="search-bar__input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.3" />
          </svg>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="search-bar__field">
        <label>{compact ? "Search" : "What are you looking for?"}</label>
        <div className="search-bar__input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            placeholder={compact ? "Hotel, area or landmark" : "Search Hotel, Hostel, Property..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="search-bar__field search-bar__field--small">
        <label>Check in</label>
        <div className="search-bar__input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <input type="date" />
        </div>
      </div>

      <div className="search-bar__field search-bar__field--small">
        <label>Check out</label>
        <div className="search-bar__input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <input type="date" />
        </div>
      </div>

      <div className="search-bar__field search-bar__field--small">
        <label>Guests</label>
        <div className="search-bar__input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <input defaultValue="1 Guest" />
        </div>
      </div>

      <button className="search-bar__submit" type="button" onClick={handleSubmit}>
        Search
        {compact && (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </section>
  );
}
