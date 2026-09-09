import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getListing, updateListing } from "../api/listings";
import { ApiError } from "../api/apiError";
import type { Listing } from "../api/types";
import "../pages/AuthForms.css";
import "./CreateListingPage.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [address, setAddress] = useState("");

  const [roomType, setRoomType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [distanceToCampusKm, setDistanceToCampusKm] = useState("");
  const [starRating, setStarRating] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [landSizeSqm, setLandSizeSqm] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getListing(id)
      .then((data) => {
        if (cancelled) return;
        setListing(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setPrice(data.price);
        setCurrency(data.currency);
        setPriceNegotiable(data.priceNegotiable);
        setAddress(data.address ?? "");

        if (data.hostelDetails) {
          setRoomType(data.hostelDetails.roomType ?? "");
          setCapacity(data.hostelDetails.capacity?.toString() ?? "");
          setDistanceToCampusKm(data.hostelDetails.distanceToCampusKm?.toString() ?? "");
        }
        if (data.hotelDetails) {
          setStarRating(data.hotelDetails.starRating?.toString() ?? "");
          setAmenitiesText((data.hotelDetails.amenities ?? []).join(", "));
        }
        if (data.rentalDetails) {
          setBedrooms(data.rentalDetails.bedrooms?.toString() ?? "");
          setBathrooms(data.rentalDetails.bathrooms?.toString() ?? "");
          setLeaseTerm(data.rentalDetails.leaseTerm ?? "");
          setFurnished(data.rentalDetails.furnished ?? false);
        }
        if (data.saleDetails) {
          setBedrooms(data.saleDetails.bedrooms?.toString() ?? "");
          setBathrooms(data.saleDetails.bathrooms?.toString() ?? "");
          setLandSizeSqm(data.saleDetails.landSizeSqm?.toString() ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("This listing couldn't be found.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!user) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">Log in to edit your listings.</p>
      </div>
    );
  }

  if (!OWNER_ROLES.includes(user.role)) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">
          Only landlords, agents, and hotel managers can edit listings. Your account role is{" "}
          <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">Loading listing…</p>
      </div>
    );
  }

  if (loadError || !listing) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">{loadError ?? "This listing couldn't be found."}</p>
      </div>
    );
  }

  if (listing.owner && listing.owner.id !== user.id && user.role !== "admin") {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">You can only edit listings you own.</p>
      </div>
    );
  }

  function buildDetails() {
    if (listing!.type === "hostel") {
      return {
        hostelDetails: {
          roomType: roomType || undefined,
          capacity: capacity ? Number(capacity) : undefined,
          distanceToCampusKm: distanceToCampusKm ? Number(distanceToCampusKm) : undefined,
        },
      };
    }
    if (listing!.type === "hotel") {
      return {
        hotelDetails: {
          starRating: starRating ? Number(starRating) : undefined,
          amenities: amenitiesText
            ? amenitiesText.split(",").map((a) => a.trim()).filter(Boolean)
            : undefined,
        },
      };
    }
    if (listing!.type === "rental") {
      return {
        rentalDetails: {
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          leaseTerm: leaseTerm || undefined,
          furnished,
        },
      };
    }
    return {
      saleDetails: {
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        landSizeSqm: landSizeSqm ? Number(landSizeSqm) : undefined,
      },
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSavedMessage(null);

    const priceNumber = Number(price);
    if (title.trim().length < 3) {
      setFieldErrors({ title: "Title must be at least 3 characters" });
      return;
    }
    if (!price || priceNumber <= 0) {
      setFieldErrors({ price: "Enter a valid positive price" });
      return;
    }

    setIsSaving(true);
    try {
      await updateListing(listing!.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNumber,
        currency,
        priceNegotiable,
        address: address.trim() || undefined,
        ...buildDetails(),
      });
      setSavedMessage("Saved.");
    } catch (err) {
      if (err instanceof ApiError && err.issues && err.issues.length > 0) {
        const errs: Record<string, string> = {};
        for (const issue of err.issues) errs[issue.field] = issue.message;
        setFieldErrors(errs);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="create-listing-page">
      <Navbar />
      <div className="create-listing-container">
        <form className="create-listing-form" onSubmit={handleSubmit}>
          <h1>Edit Listing</h1>
          <p className="create-listing-form__intro">
            Editing a {listing.type} listing.{" "}
            <Link to={`/listings/${listing.id}`}>View live listing</Link>
          </p>

          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            {fieldErrors.title && <span className="field__error">{fieldErrors.title}</span>}
          </div>

          <div className="field">
            <label>Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="create-listing-form__row">
            <div className="field">
              <label>Price</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
              {fieldErrors.price && <span className="field__error">{fieldErrors.price}</span>}
            </div>
            <div className="field">
              <label>Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </div>
          </div>

          <label className="create-listing-form__checkbox">
            <input type="checkbox" checked={priceNegotiable} onChange={(e) => setPriceNegotiable(e.target.checked)} />
            Price is negotiable
          </label>

          <div className="field">
            <label>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {listing.type === "hostel" && (
            <>
              <div className="create-listing-form__row">
                <div className="field">
                  <label>Room type</label>
                  <input value={roomType} onChange={(e) => setRoomType(e.target.value)} />
                </div>
                <div className="field">
                  <label>Capacity</label>
                  <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Distance to campus (km)</label>
                <input type="number" min="0" step="0.1" value={distanceToCampusKm} onChange={(e) => setDistanceToCampusKm(e.target.value)} />
              </div>
            </>
          )}

          {listing.type === "hotel" && (
            <>
              <div className="field">
                <label>Star rating</label>
                <select value={starRating} onChange={(e) => setStarRating(e.target.value)}>
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} stars</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amenities</label>
                <input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="Wi-Fi, Pool, Breakfast" />
              </div>
            </>
          )}

          {(listing.type === "rental" || listing.type === "sale") && (
            <div className="create-listing-form__row">
              <div className="field">
                <label>Bedrooms</label>
                <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
              <div className="field">
                <label>Bathrooms</label>
                <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
              </div>
            </div>
          )}

          {listing.type === "rental" && (
            <>
              <div className="field">
                <label>Lease term</label>
                <input value={leaseTerm} onChange={(e) => setLeaseTerm(e.target.value)} />
              </div>
              <label className="create-listing-form__checkbox">
                <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
                Furnished
              </label>
            </>
          )}

          {listing.type === "sale" && (
            <div className="field">
              <label>Land size (m²)</label>
              <input type="number" min="0" value={landSizeSqm} onChange={(e) => setLandSizeSqm(e.target.value)} />
            </div>
          )}

          {formError && <div className="form-error">{formError}</div>}
          {savedMessage && <div className="contact-us-success">{savedMessage}</div>}

          <button className="btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="create-listing-form__skip"
            style={{ marginTop: "1rem" }}
            onClick={() => navigate("/listings/mine")}
          >
            Back to My Listings
          </button>
        </form>
      </div>
    </div>
  );
}
