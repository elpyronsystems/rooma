import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../components/Navbar";
import { SearchBar } from "../components/SearchBar";
import { ListingCard } from "../components/ListingCard";
import { searchListings } from "../api/listings";
import type { Listing } from "../api/types";
import "./CategoryListingsPage.css";

type SortKey = "recommended" | "price_low" | "price_high" | "newest";
type ListingType = "hostel" | "hotel" | "rental" | "sale";

const SORT_PILLS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "newest", label: "Newly Added" },
  { key: "price_low", label: "Price: Low–High" },
  { key: "price_high", label: "Price: High–Low" },
];

const TYPE_LABELS: Record<ListingType, string> = {
  hostel: "Hostels",
  hotel: "Hotels",
  rental: "Rentals",
  sale: "For Sale",
};

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #1e293b, #475569)",
  "linear-gradient(135deg, #0ea5e9, #7dd3fc)",
  "linear-gradient(135deg, #78350f, #b45309)",
  "linear-gradient(135deg, #292524, #57534e)",
  "linear-gradient(135deg, #1d4ed8, #93c5fd)",
  "linear-gradient(135deg, #166534, #86efac)",
];

interface CategoryListingsPageProps {
  heroTitle: string;
  heroSubtitle: string;
  /** If set, only these listing types are fetched/shown, and the type-filter
   * row is hidden. If omitted, every type is fetched and a type filter row
   * is shown (used for the general "Explore" page). */
  fixedTypes?: ListingType[];
}

export function CategoryListingsPage({ heroTitle, heroSubtitle, fixedTypes }: CategoryListingsPageProps) {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSort, setActiveSort] = useState<SortKey>("recommended");
  const [activeTypeFilter, setActiveTypeFilter] = useState<ListingType | "all">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [searchText, setSearchText] = useState("");
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        // When restricted to a single fixed type, ask the backend to filter
        // directly. Otherwise (Explore, or multiple fixed types) fetch
        // broadly and filter client-side, since the backend only accepts
        // one `type` value per request.
        const singleType = fixedTypes?.length === 1 ? fixedTypes[0] : undefined;
        const results = await searchListings({ type: singleType, minPrice, maxPrice });
        if (!cancelled) setAllListings(results);
      } catch {
        if (!cancelled) setLoadError("Couldn't load listings right now. Please try again shortly.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, fixedTypes]);

  function resetFilters() {
    setMinPrice(0);
    setMaxPrice(5000);
    setActiveSort("recommended");
    setActiveTypeFilter("all");
    setSearchText("");
    setMinBedrooms(0);
    setFurnishedOnly(false);
    setMaxDistanceKm(null);
  }

  const effectiveTypes = fixedTypes ?? (activeTypeFilter === "all" ? [] : [activeTypeFilter]);
  const showBedroomFilter = effectiveTypes.some((t) => t === "rental" || t === "sale");
  const showFurnishedFilter = effectiveTypes.includes("rental");
  const showDistanceFilter = effectiveTypes.includes("hostel");

  const visible = useMemo(() => {
    let result = [...allListings];

    if (fixedTypes && fixedTypes.length > 0) {
      result = result.filter((l) => fixedTypes.includes(l.type));
    } else if (activeTypeFilter !== "all") {
      result = result.filter((l) => l.type === activeTypeFilter);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || (l.address ?? "").toLowerCase().includes(q)
      );
    }

    if (minBedrooms > 0) {
      result = result.filter((l) => {
        const beds = l.rentalDetails?.bedrooms ?? l.saleDetails?.bedrooms;
        return beds !== undefined && beds >= minBedrooms;
      });
    }

    if (furnishedOnly) {
      result = result.filter((l) => l.rentalDetails?.furnished === true);
    }

    if (maxDistanceKm !== null) {
      result = result.filter((l) => {
        const dist = l.hostelDetails?.distanceToCampusKm;
        return dist !== undefined && parseFloat(dist) <= maxDistanceKm;
      });
    }

    switch (activeSort) {
      case "price_low":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_high":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
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
  }, [allListings, fixedTypes, activeTypeFilter, searchText, activeSort, minBedrooms, furnishedOnly, maxDistanceKm]);

  const showTypeFilter = !fixedTypes;

  return (
    <div className="category-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
        </div>
        <div className="category-hero__search">
          <SearchBar compact onSearch={({ search }) => setSearchText(search)} />
        </div>
      </section>

      <div className="category-body">
        {showTypeFilter && (
          <div className="category-pills">
            <button
              type="button"
              className={`category-pill${activeTypeFilter === "all" ? " category-pill--active" : ""}`}
              onClick={() => setActiveTypeFilter("all")}
            >
              All
            </button>
            {(Object.keys(TYPE_LABELS) as ListingType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`category-pill${activeTypeFilter === t ? " category-pill--active" : ""}`}
                onClick={() => setActiveTypeFilter(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        <div className="category-layout">
          {(showBedroomFilter || showFurnishedFilter || showDistanceFilter) && (
            <aside className="category-sidebar">
              <p className="category-sidebar__title">Filters</p>

              {showBedroomFilter && (
                <div className="category-sidebar__group">
                  <label>Minimum bedrooms</label>
                  <select value={minBedrooms} onChange={(e) => setMinBedrooms(Number(e.target.value))}>
                    <option value={0}>Any</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}+</option>
                    ))}
                  </select>
                </div>
              )}

              {showFurnishedFilter && (
                <label className="category-sidebar__checkbox">
                  <input
                    type="checkbox"
                    checked={furnishedOnly}
                    onChange={(e) => setFurnishedOnly(e.target.checked)}
                  />
                  Furnished only
                </label>
              )}

              {showDistanceFilter && (
                <div className="category-sidebar__group">
                  <label>Max distance to campus (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Any"
                    value={maxDistanceKm ?? ""}
                    onChange={(e) => setMaxDistanceKm(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              )}
            </aside>
          )}

          <div className="category-main">
            <div className="category-sort-row">
              <p className="category-results-count">
                {isLoading ? "Searching…" : `${visible.length} results`}
              </p>
              <div className="category-sort-pills">
                {SORT_PILLS.map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    className={`category-sort-pill${activeSort === pill.key ? " category-sort-pill--active" : ""}`}
                    onClick={() => setActiveSort(pill.key)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {loadError && <p className="category-status category-status--error">{loadError}</p>}

            {!isLoading && !loadError && visible.length === 0 && (
              <p className="category-status">
                No listings match your filters yet.{" "}
                <button className="category-status__reset" onClick={resetFilters} type="button">
                  Reset filters
                </button>
              </p>
            )}

            <div className="category-grid">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="listing-card listing-card--skeleton" />)
                : visible.map((listing, index) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      gradient={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
