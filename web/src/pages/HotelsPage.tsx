import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { SearchBar } from "../components/SearchBar";
import { HotelCard } from "../components/HotelCard";
import { searchListings } from "../api/listings";
import type { Listing } from "../api/types";
import "./HotelsPage.css";

type SortKey = "recommended" | "price_low" | "price_high" | "top_rated" | "newest";

const FILTER_PILLS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "All Hotels" },
  { key: "top_rated", label: "Top Rated" },
  { key: "newest", label: "Newly Added" },
  { key: "price_low", label: "Price: Low–High" },
  { key: "price_high", label: "Price: High–Low" },
];

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #1e293b, #475569)",
  "linear-gradient(135deg, #0ea5e9, #7dd3fc)",
  "linear-gradient(135deg, #78350f, #b45309)",
  "linear-gradient(135deg, #292524, #57534e)",
  "linear-gradient(135deg, #1d4ed8, #93c5fd)",
  "linear-gradient(135deg, #166534, #86efac)",
];

const AMENITY_OPTIONS = ["Free Wi-Fi", "Swimming Pool", "Breakfast Included", "Airport Shuttle", "Gym / Fitness", "Free Parking", "Spa & Wellness"];

export function HotelsPage() {
  const [searchParams] = useSearchParams();

  const [allHotels, setAllHotels] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSort, setActiveSort] = useState<SortKey>("recommended");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
  const [locationText] = useState(searchParams.get("location") ?? "Accra, Ghana");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        // minPrice/maxPrice are genuinely sent to the backend — it supports
        // that filter natively. Star rating and amenities are filtered
        // client-side below, since they live in hotelDetails, which the
        // backend already includes in the response but doesn't yet filter on.
        const results = await searchListings({ type: "hotel", minPrice, maxPrice });
        if (!cancelled) setAllHotels(results);
      } catch {
        if (!cancelled) setLoadError("Couldn't load hotels right now. Please try again shortly.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // Re-fetch when the price range changes; other filters apply client-side.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function resetFilters() {
    setMinPrice(0);
    setMaxPrice(2000);
    setStarFilter(null);
    setSelectedAmenities([]);
    setActiveSort("recommended");
    setSearchText("");
  }

  const visibleHotels = useMemo(() => {
    let result = [...allHotels];

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (h) => h.title.toLowerCase().includes(q) || (h.address ?? "").toLowerCase().includes(q)
      );
    }

    if (starFilter !== null) {
      result = result.filter((h) => (h.hotelDetails?.starRating ?? 0) >= starFilter);
    }

    if (selectedAmenities.length > 0) {
      result = result.filter((h) => {
        const hotelAmenities = (h.hotelDetails?.amenities ?? []).map((a) => a.toLowerCase());
        return selectedAmenities.every((selected) =>
          hotelAmenities.some((a) => a.includes(selected.toLowerCase().split(" ")[0]))
        );
      });
    }

    switch (activeSort) {
      case "price_low":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_high":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "top_rated":
        result.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
        break;
      case "newest":
        result.sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
        break;
      default:
        break;
    }

    return result;
  }, [allHotels, searchText, starFilter, selectedAmenities, activeSort]);

  return (
    <div className="hotels-page">
      <Navbar />

      <section className="hotels-hero">
        <div className="hotels-hero__overlay" />
        <div className="hotels-hero__content">
          <h1>Explore Hotels</h1>
          <p>Find and book the perfect stay for every journey.</p>
        </div>
        <div className="hotels-hero__search">
          <SearchBar
            compact
            initialLocation={locationText}
            initialSearch={searchText}
            onSearch={({ search }) => setSearchText(search)}
          />
        </div>
      </section>

      <div className="hotels-body">
        <div className="hotels-main">
          <div className="hotels-pills">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={`hotels-pill${activeSort === pill.key ? " hotels-pill--active" : ""}`}
                onClick={() => setActiveSort(pill.key)}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="hotels-results-row">
            <p className="hotels-results-count">
              {isLoading ? "Searching…" : `${visibleHotels.length} hotels found`} in {locationText}
            </p>
          </div>

          {loadError && <p className="hotels-status hotels-status--error">{loadError}</p>}

          {!isLoading && !loadError && visibleHotels.length === 0 && (
            <p className="hotels-status">
              No hotels match your filters yet.{" "}
              <button className="hotels-status__reset" onClick={resetFilters} type="button">
                Reset filters
              </button>
            </p>
          )}

          <div className="hotels-grid">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="hotel-card hotel-card--skeleton" />)
              : visibleHotels.map((hotel, index) => (
                  <HotelCard
                    key={hotel.id}
                    listing={hotel}
                    gradient={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}
                  />
                ))}
          </div>
        </div>

        <aside className="hotels-sidebar">
          <div className="hotels-sidebar__header">
            <h3>Filter Hotels</h3>
            <button type="button" className="hotels-sidebar__reset" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="hotels-filter-group">
            <p className="hotels-filter-group__title">
              Price Range ({allHotels[0]?.currency ?? "GHS"} / night)
            </p>
            <div className="hotels-price-inputs">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
              />
              <span>—</span>
              <input
                type="number"
                min={minPrice}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="hotels-filter-group">
            <p className="hotels-filter-group__title">Star Rating</p>
            <div className="hotels-star-buttons">
              <button
                type="button"
                className={`hotels-star-btn${starFilter === null ? " hotels-star-btn--active" : ""}`}
                onClick={() => setStarFilter(null)}
              >
                All
              </button>
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`hotels-star-btn${starFilter === n ? " hotels-star-btn--active" : ""}`}
                  onClick={() => setStarFilter(n)}
                >
                  {n}+★
                </button>
              ))}
            </div>
          </div>

          <div className="hotels-filter-group">
            <p className="hotels-filter-group__title">Amenities</p>
            <div className="hotels-amenities-list">
              {AMENITY_OPTIONS.map((amenity) => (
                <label key={amenity} className="hotels-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          <div className="hotels-map-placeholder">
            <p>Map view coming soon</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
