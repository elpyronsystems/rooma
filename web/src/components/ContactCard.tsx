import type { OwnerContact } from "../api/types";
import "./ContactCard.css";

interface ContactCardProps {
  owner?: OwnerContact;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function ContactCard({ owner }: ContactCardProps) {
  if (!owner) return null;

  const displayName = owner.businessName || owner.fullName;
  const phone = owner.contactPhone || owner.phoneNumber;
  const email = owner.contactEmail || owner.email;
  const whatsapp = owner.contactWhatsapp;

  // No contact details set at all — nothing useful to show.
  if (!phone && !email && !whatsapp) return null;

  return (
    <div className="contact-card">
      <p className="contact-card__title">Contact {displayName}</p>

      <div className="contact-card__actions">
        {phone && (
          <a href={`tel:${phone}`} className="contact-card__action">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
            </svg>
            Call {phone}
          </a>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${digitsOnly(whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card__action contact-card__action--whatsapp"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5.1-1.3A10 10 0 0 0 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18.2c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.8.1.2 2 3 4.7 4.2a5.8 5.8 0 0 0 3.5 1c1 0 1.7-.4 1.9-.8.2-.4.2-.8.1-.9-.1-.1-.3-.2-.5-.3Z" />
            </svg>
            WhatsApp
          </a>
        )}

        {email && (
          <a href={`mailto:${email}`} className="contact-card__action">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Email
          </a>
        )}
      </div>

      <p className="contact-card__note">Reach out directly to ask questions or arrange a viewing.</p>
    </div>
  );
}
