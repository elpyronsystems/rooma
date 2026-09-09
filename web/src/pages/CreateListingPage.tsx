import { useState, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { createListing } from "../api/listings";
import { uploadListingMedia } from "../api/media";
import { uploadListingDocuments, type DocumentType } from "../api/documents";
import { ApiError } from "../api/apiError";
import type { CreateListingParams } from "../api/listings";
import { StepIndicator } from "../components/StepIndicator";
import "../pages/AuthForms.css";
import "./CreateListingPage.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

type ListingType = "hostel" | "hotel" | "rental" | "sale";
type Step = "form" | "media" | "documents" | "done";

// Rentals and sales are property transactions that benefit from an
// ownership/authorization document — hostels and hotels don't have an
// equivalent concept, so the document step only shows for these two types.
const DOCUMENT_REQUIRED_TYPES: ListingType[] = ["rental", "sale"];

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "ownership_deed", label: "Ownership Deed" },
  { value: "land_title", label: "Land Title" },
  { value: "id_verification", label: "ID Verification" },
  { value: "other", label: "Other" },
];

// 50MB per file, matching the backend's own limit (src/middleware/upload.js)
// — enforcing it client-side too avoids a slow upload attempt that the
// server would reject anyway.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<Step>("form");
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  const [type, setType] = useState<ListingType>("hostel");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [address, setAddress] = useState("");

  // Type-specific fields
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileSelectError, setFileSelectError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [docType, setDocType] = useState<DocumentType>("ownership_deed");
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<string[]>([]);
  const [docSelectError, setDocSelectError] = useState<string | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const needsDocuments = DOCUMENT_REQUIRED_TYPES.includes(type);
  const formSteps = needsDocuments ? ["Details", "Photos", "Documents", "Done"] : ["Details", "Photos", "Done"];
  const stepOrder: Step[] = needsDocuments ? ["form", "media", "documents", "done"] : ["form", "media", "done"];
  const stepIndex = stepOrder.indexOf(step);

  if (!user) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">
          Log in to create a listing.{" "}
          <Link to="/login" state={{ redirectTo: location.pathname }} className="create-listing-page__link">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (!OWNER_ROLES.includes(user.role)) {
    return (
      <div className="create-listing-page">
        <Navbar />
        <p className="create-listing-page__status">
          Only landlords, agents, and hotel managers can create listings. Your account role is{" "}
          <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  function buildDetails(): Pick<
    CreateListingParams,
    "hostelDetails" | "hotelDetails" | "rentalDetails" | "saleDetails"
  > {
    if (type === "hostel") {
      return {
        hostelDetails: {
          roomType: roomType || undefined,
          capacity: capacity ? Number(capacity) : undefined,
          distanceToCampusKm: distanceToCampusKm ? Number(distanceToCampusKm) : undefined,
        },
      };
    }
    if (type === "hotel") {
      return {
        hotelDetails: {
          starRating: starRating ? Number(starRating) : undefined,
          amenities: amenitiesText
            ? amenitiesText.split(",").map((a) => a.trim()).filter(Boolean)
            : undefined,
        },
      };
    }
    if (type === "rental") {
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

    const priceNumber = Number(price);
    if (title.trim().length < 3) {
      setFieldErrors({ title: "Title must be at least 3 characters" });
      return;
    }
    if (!price || priceNumber <= 0) {
      setFieldErrors({ price: "Enter a valid positive price" });
      return;
    }

    setIsSubmitting(true);
    try {
      const listing = await createListing({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNumber,
        currency,
        priceNegotiable,
        address: address.trim() || undefined,
        ...buildDetails(),
      });
      setCreatedListingId(listing.id);
      setStep("media");
    } catch (err) {
      if (err instanceof ApiError && err.issues && err.issues.length > 0) {
        const errs: Record<string, string> = {};
        for (const issue of err.issues) errs[issue.field] = issue.message;
        setFieldErrors(errs);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    setFileSelectError(null);

    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    const rejectedNames: string[] = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE_BYTES) {
        rejectedNames.push(file.name);
      } else {
        accepted.push(file);
      }
    }

    if (rejectedNames.length > 0) {
      setFileSelectError(
        `Skipped ${rejectedNames.join(", ")} — only JPEG, PNG, WEBP images and MP4/MOV videos up to 50MB are allowed.`
      );
    }

    const newFiles = [...selectedFiles, ...accepted];
    const newPreviews = [...previewUrls, ...accepted.map((f) => URL.createObjectURL(f))];
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  }

  function handleRemoveFile(index: number) {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function goToNextAfterMedia() {
    setStep(needsDocuments ? "documents" : "done");
  }

  async function handleUploadMedia() {
    if (!createdListingId || selectedFiles.length === 0) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadListingMedia(createdListingId, selectedFiles);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      goToNextAfterMedia();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDocsSelected(fileList: FileList | null) {
    if (!fileList) return;
    setDocSelectError(null);

    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    const rejectedNames: string[] = [];

    for (const file of incoming) {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE_BYTES) {
        rejectedNames.push(file.name);
      } else {
        accepted.push(file);
      }
    }

    if (rejectedNames.length > 0) {
      setDocSelectError(
        `Skipped ${rejectedNames.join(", ")} — only JPEG, PNG, WEBP images and PDF files up to 50MB are allowed.`
      );
    }

    setSelectedDocs((prev) => [...prev, ...accepted]);
    setDocPreviewUrls((prev) => [
      ...prev,
      ...accepted.map((f) => (f.type === "application/pdf" ? "" : URL.createObjectURL(f))),
    ]);
  }

  function handleRemoveDoc(index: number) {
    if (docPreviewUrls[index]) URL.revokeObjectURL(docPreviewUrls[index]);
    setSelectedDocs((prev) => prev.filter((_, i) => i !== index));
    setDocPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadDocuments() {
    if (!createdListingId || selectedDocs.length === 0) return;
    setDocUploadError(null);
    setIsUploadingDocs(true);
    try {
      await uploadListingDocuments(createdListingId, selectedDocs, docType);
      docPreviewUrls.forEach((url) => url && URL.revokeObjectURL(url));
      setStep("done");
    } catch (err) {
      setDocUploadError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploadingDocs(false);
    }
  }

  return (
    <div className="create-listing-page">
      <Navbar />
      <div className="create-listing-container">
        <StepIndicator steps={formSteps} currentIndex={stepIndex} />

        {step === "form" && (
          <form className="create-listing-form" onSubmit={handleSubmit}>
            <h1>Create a Listing</h1>
            <p className="create-listing-form__intro">Fill in the details for your property.</p>

            <div className="field">
              <label>Listing type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ListingType)}>
                <option value="hostel">Student Hostel</option>
                <option value="hotel">Hotel</option>
                <option value="rental">Rental</option>
                <option value="sale">For Sale</option>
              </select>
            </div>

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
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. East Legon, Accra" />
            </div>

            {type === "hostel" && (
              <>
                <div className="create-listing-form__row">
                  <div className="field">
                    <label>Room type</label>
                    <input value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="Single, Shared..." />
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

            {type === "hotel" && (
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
                  <input
                    value={amenitiesText}
                    onChange={(e) => setAmenitiesText(e.target.value)}
                    placeholder="Wi-Fi, Pool, Breakfast (comma-separated)"
                  />
                </div>
              </>
            )}

            {(type === "rental" || type === "sale") && (
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

            {type === "rental" && (
              <>
                <div className="field">
                  <label>Lease term</label>
                  <input value={leaseTerm} onChange={(e) => setLeaseTerm(e.target.value)} placeholder="Monthly, 6-months, yearly" />
                </div>
                <label className="create-listing-form__checkbox">
                  <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
                  Furnished
                </label>
              </>
            )}

            {type === "sale" && (
              <div className="field">
                <label>Land size (m²)</label>
                <input type="number" min="0" value={landSizeSqm} onChange={(e) => setLandSizeSqm(e.target.value)} />
              </div>
            )}

            {formError && <div className="form-error">{formError}</div>}

            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Listing"}
            </button>
          </form>
        )}

        {step === "media" && (
          <div className="create-listing-form">
            <h1>Add Photos</h1>
            <p className="create-listing-form__intro">
              Add photos or a short video of your listing. JPEG, PNG, WEBP, MP4, or MOV — up to 50MB each.
            </p>

            <label className="create-listing-dropzone">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = ""; // allow re-selecting the same file after removing it
                }}
              />
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 16.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10.5M4 16.5 8.5 12a2 2 0 0 1 2.8 0L15 15.7M14 14l1.3-1.3a2 2 0 0 1 2.8 0L20 15" />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
              <span>Click to choose files, or drag and drop</span>
            </label>

            {fileSelectError && <div className="form-error">{fileSelectError}</div>}

            {selectedFiles.length > 0 && (
              <>
                <p className="create-listing-form__file-count">{selectedFiles.length} file(s) selected</p>
                <div className="create-listing-previews">
                  {selectedFiles.map((file, index) => (
                    <div className="create-listing-preview" key={`${file.name}-${index}`}>
                      {file.type.startsWith("video") ? (
                        <video src={previewUrls[index]} className="create-listing-preview__media" />
                      ) : (
                        <img src={previewUrls[index]} alt={file.name} className="create-listing-preview__media" />
                      )}
                      <button
                        type="button"
                        className="create-listing-preview__remove"
                        onClick={() => handleRemoveFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {uploadError && <div className="form-error">{uploadError}</div>}

            <div className="create-listing-form__media-actions">
              <button
                className="btn-primary"
                type="button"
                onClick={handleUploadMedia}
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? "Uploading…" : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ""} Photo${selectedFiles.length === 1 ? "" : "s"}`}
              </button>
              <button className="create-listing-form__skip" type="button" onClick={goToNextAfterMedia}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === "documents" && (
          <div className="create-listing-form">
            <h1>Add Property Document</h1>
            <p className="create-listing-form__intro">
              For rentals and sales, add an ownership or authorization document — this helps us
              verify the listing and builds trust with seekers. Accepted: JPEG, PNG, WEBP, or PDF,
              up to 50MB each.
            </p>

            <div className="field">
              <label>Document type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="create-listing-dropzone">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  handleDocsSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                <path d="M14 2v6h6M9 15h6M9 11h6" />
              </svg>
              <span>Click to choose a file, or drag and drop</span>
            </label>

            {docSelectError && <div className="form-error">{docSelectError}</div>}

            {selectedDocs.length > 0 && (
              <>
                <p className="create-listing-form__file-count">{selectedDocs.length} file(s) selected</p>
                <div className="create-listing-previews">
                  {selectedDocs.map((file, index) => (
                    <div className="create-listing-preview" key={`${file.name}-${index}`}>
                      {file.type === "application/pdf" ? (
                        <div className="create-listing-preview__pdf">
                          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                            <path d="M14 2v6h6" />
                          </svg>
                          <span>PDF</span>
                        </div>
                      ) : (
                        <img src={docPreviewUrls[index]} alt={file.name} className="create-listing-preview__media" />
                      )}
                      <button
                        type="button"
                        className="create-listing-preview__remove"
                        onClick={() => handleRemoveDoc(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {docUploadError && <div className="form-error">{docUploadError}</div>}

            <div className="create-listing-form__media-actions">
              <button
                className="btn-primary"
                type="button"
                onClick={handleUploadDocuments}
                disabled={isUploadingDocs || selectedDocs.length === 0}
              >
                {isUploadingDocs ? "Uploading…" : "Upload Document"}
              </button>
              <button className="create-listing-form__skip" type="button" onClick={() => setStep("done")}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="create-listing-form create-listing-form--success">
            <span className="create-listing-form__success-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h1>Listing created!</h1>
            <p className="create-listing-form__intro">
              Your listing is now live. You can add more photos or edit it anytime.
            </p>
            <div className="create-listing-form__done-actions">
              <button className="btn-primary" type="button" onClick={() => navigate(`/listings/${createdListingId}`)}>
                View Listing
              </button>
              <button
                className="create-listing-form__skip"
                type="button"
                onClick={() => {
                  previewUrls.forEach((url) => URL.revokeObjectURL(url));
                  docPreviewUrls.forEach((url) => url && URL.revokeObjectURL(url));
                  setStep("form");
                  setCreatedListingId(null);
                  setTitle("");
                  setPrice("");
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                  setFileSelectError(null);
                  setUploadError(null);
                  setSelectedDocs([]);
                  setDocPreviewUrls([]);
                  setDocSelectError(null);
                  setDocUploadError(null);
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
