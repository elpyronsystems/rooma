import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getDocuments, updateDocument, type AdminDocument } from "../api/admin";
import { ApiError } from "../api/apiError";
import "./AdminUsersPage.css";
import "./AdminDocumentsPage.css";

export function AdminDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showVerified, setShowVerified] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load documents right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleToggleVerified(doc: AdminDocument) {
    setActionError(null);
    setBusyId(doc.id);
    try {
      const updated = await updateDocument(doc.id, !doc.verified);
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this document.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <p className="admin-status">This area is for admin accounts only.</p>
      </AdminLayout>
    );
  }

  const visible = documents.filter((d) => showVerified || !d.verified);

  return (
    <AdminLayout>
      <label className="admin-support__toggle">
        <input type="checkbox" checked={showVerified} onChange={(e) => setShowVerified(e.target.checked)} />
        Show verified documents
      </label>

      {isLoading && <p className="admin-status">Loading documents…</p>}
      {!isLoading && loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {actionError && <p className="admin-status admin-status--error">{actionError}</p>}

      {!isLoading && !loadError && visible.length === 0 && (
        <p className="admin-status">Nothing to review right now.</p>
      )}

      <div className="admin-doc-grid">
        {visible.map((doc) => (
          <div className={`admin-doc-card${doc.verified ? " admin-doc-card--verified" : ""}`} key={doc.id}>
            <div className="admin-doc-card__preview">
              {doc.fileUrl.toLowerCase().includes(".pdf") ? (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="admin-doc-card__pdf-link">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  View PDF
                </a>
              ) : (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={doc.fileUrl} alt={doc.docType} className="admin-doc-card__img" />
                </a>
              )}
            </div>

            <div className="admin-doc-card__body">
              <p className="admin-doc-card__type">{doc.docType.replace(/_/g, " ")}</p>
              {doc.listing && (
                <Link to={`/listings/${doc.listing.id}`} className="admin-doc-card__listing">
                  {doc.listing.title}
                </Link>
              )}
              {doc.listing?.owner && (
                <p className="admin-doc-card__owner">
                  {doc.listing.owner.fullName} · {doc.listing.owner.phoneNumber}
                </p>
              )}
              <p className="admin-doc-card__date">
                {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <button
                type="button"
                className="admin-table__action"
                disabled={busyId === doc.id}
                onClick={() => handleToggleVerified(doc)}
                style={{ marginTop: "0.75rem" }}
              >
                {doc.verified ? "Unverify" : "Mark verified"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
