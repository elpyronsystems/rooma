import { Navbar } from "../components/Navbar";
import "./PrivacyPolicyPage.css";

const SECTIONS = [
  { id: "about", title: "1. About Rooma" },
  { id: "info-we-collect", title: "2. Information We Collect" },
  { id: "how-we-use", title: "3. How We Use Your Information" },
  { id: "how-shared", title: "4. How Information Is Shared" },
  { id: "payment-info", title: "5. Payment Information" },
  { id: "verification", title: "6. Property Verification and Trust" },
  { id: "cookies", title: "7. Cookies and Similar Technologies" },
  { id: "storage-security", title: "8. Data Storage and Security" },
  { id: "retention", title: "9. Data Retention" },
  { id: "your-rights", title: "10. Your Rights and Choices" },
  { id: "children", title: "11. Children's Privacy" },
  { id: "third-party", title: "12. Third-Party Services and Links" },
  { id: "governing-law", title: "13. Governing Law" },
  { id: "changes", title: "14. Changes to This Privacy Policy" },
  { id: "contact", title: "15. Contact Us" },
];

export function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <Navbar />

      <section className="privacy-hero">
        <span className="privacy-hero__eyebrow">LEGAL</span>
        <h1>Privacy Policy</h1>
        <p>How Rooma collects, uses, stores, shares, and protects your information.</p>
        <div className="privacy-hero__dates">
          <span>Last Updated: September 6, 2026</span>
          <span className="privacy-hero__dot" />
          <span>Effective Date: September 7, 2026</span>
        </div>
      </section>

      <div className="privacy-body">
        <aside className="privacy-toc">
          <p className="privacy-toc__title">On this page</p>
          <nav>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="privacy-content">
          <p className="privacy-intro">
            Rooma is committed to protecting the privacy and personal information of everyone who
            uses our platform. This Privacy Policy explains how Rooma, a product of eLPi.dev,
            collects, uses, stores, shares, and protects information when you use our websites,
            mobile applications, services, and related platforms. By creating an account or using
            Rooma, you acknowledge that you have read and understood this Privacy Policy.
          </p>

          <section id="about" className="privacy-section">
            <h2>1. About Rooma</h2>
            <p>
              Rooma is built by eLPi.dev, the software development vertical of Elpyron Ltd. Ghana's
              accommodation search today is scattered across informal WhatsApp groups, unreliable
              agents, and outdated listings — seekers waste time and money on physical inspections
              that don't match what they were promised, while landlords, agents, and hotel managers
              lack a simple way to reach the people looking for a place to stay. Rooma brings
              hostels, hotels, rentals, and home sales into a single, verified platform to close
              that gap.
            </p>
          </section>

          <section id="info-we-collect" className="privacy-section">
            <h2>2. Information We Collect</h2>
            <p>We may collect different types of information depending on how you use Rooma.</p>

            <h3>A. Information You Provide to Us</h3>
            <p>
              When you create an account, make an enquiry, create a listing, make a booking,
              contact support, or otherwise interact with Rooma, you may provide information such
              as:
            </p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Username and account details</li>
              <li>Profile photograph, where applicable</li>
              <li>Location information</li>
              <li>Booking and enquiry details</li>
              <li>Property preferences</li>
              <li>Communication with Rooma or property providers</li>
            </ul>

            <h3>B. Property and Listing Information</h3>
            <p>
              If you are a landlord, hotel manager, property owner, agent, developer, or other
              property provider, we may collect information relating to properties you list on
              Rooma, including:
            </p>
            <ul>
              <li>Property name and description</li>
              <li>Property type</li>
              <li>Location and address</li>
              <li>Pricing and availability</li>
              <li>Amenities and facilities</li>
              <li>Images and videos</li>
              <li>Contact information</li>
              <li>Booking and enquiry information</li>
              <li>Information/documents submitted for property or ownership verification</li>
            </ul>
            <p>
              All listed documents may be required to establish the legitimacy of a property or
              provider.
            </p>

            <h3>C. Account Verification Information</h3>
            <p>To help maintain the security and integrity of the platform, Rooma may collect:</p>
            <ul>
              <li>Phone number verification</li>
              <li>One-time verification codes</li>
              <li>Authentication information</li>
              <li>Other information reasonably necessary to prevent fraud or unauthorized access</li>
            </ul>

            <h3>D. Booking and Transaction Information</h3>
            <p>When you make or receive a booking, enquiry, or transaction through Rooma, we may collect:</p>
            <ul>
              <li>Property or accommodation selected</li>
              <li>Booking dates</li>
              <li>Number of guests or occupants</li>
              <li>Booking status</li>
              <li>Transaction reference numbers</li>
              <li>Payment status</li>
              <li>Receipts and transaction records</li>
            </ul>
            <p>
              Rooma does not necessarily store your complete payment card, mobile money PIN, or
              banking credentials. Payments may be processed through authorized third-party payment
              providers.
            </p>

            <h3>E. Automatically Collected Information</h3>
            <p>When you access Rooma, we may automatically collect certain technical information, including:</p>
            <ul>
              <li>Device type, operating system, and browser type</li>
              <li>IP address and approximate location</li>
              <li>Application or website usage</li>
              <li>Pages and listings viewed, and search activity</li>
              <li>Device identifiers</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section id="how-we-use" className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We may use your information to:</p>
            <ul>
              <li>Create and manage your Rooma account</li>
              <li>Provide accommodation and property discovery services</li>
              <li>Process enquiries and bookings</li>
              <li>Facilitate communication between seekers and providers</li>
              <li>Process or support payments and transaction confirmations</li>
              <li>Verify users, providers, and listings</li>
              <li>Display and manage property listings</li>
              <li>Provide personalized recommendations</li>
              <li>Improve search results and user experience</li>
              <li>Respond to customer support requests</li>
              <li>Detect, investigate, and prevent fraud, abuse, or security incidents</li>
              <li>Monitor and improve platform performance</li>
              <li>Send important service-related notifications</li>
              <li>Comply with applicable legal and regulatory requirements</li>
            </ul>
            <p>Rooma may also use aggregated or anonymized information for research, analytics, and product improvement.</p>
          </section>

          <section id="how-shared" className="privacy-section">
            <h2>4. How Information Is Shared</h2>
            <p>Rooma does not sell your personal information as a business model. However, we may share relevant information in the following circumstances.</p>

            <h3>A. With Property Providers</h3>
            <p>
              When you make an enquiry or booking, relevant information may be shared with the
              applicable hotel, hostel manager, landlord, property owner, real estate agent,
              property manager, or authorized listing representative. The information shared will
              depend on what is reasonably necessary to process your enquiry, booking, or request.
            </p>

            <h3>B. With Seekers and Customers</h3>
            <p>
              If you list a property on Rooma, information you choose to include in your listing —
              property details, images and videos, pricing, availability, location, amenities, and
              public business or provider information — may be displayed to users of the platform.
              You should not include personal or sensitive information in public listings unless you
              intend for that information to be visible to users.
            </p>

            <h3>C. With Service Providers</h3>
            <p>
              We work with trusted third-party service providers that help us operate Rooma,
              including cloud hosting and storage (such as AWS), SMS and authentication services
              (such as Hubtel), payment processing, maps and location services, analytics, customer
              support, and security and fraud prevention. These providers may process information on
              our behalf where necessary to provide their services.
            </p>

            <h3>D. Legal and Security Requirements</h3>
            <p>We may disclose information where reasonably necessary to comply with applicable laws or lawful requests, respond to legal processes, protect the rights and safety of Rooma, our users, or the public, investigate suspected fraud or illegal activity, or enforce our Terms and Conditions.</p>
          </section>

          <section id="payment-info" className="privacy-section">
            <h2>5. Payment Information</h2>
            <p>
              Rooma may facilitate payments for bookings and other services through authorized
              payment providers. Depending on the payment method, transaction processing may involve
              third-party payment services such as mobile money, banks, card processors, or other
              approved payment platforms. We may retain transaction-related information such as
              transaction reference, amount, date and time, payment status, and related booking or
              service. You should never share your payment PIN, password, or other confidential
              banking credentials with Rooma, a property provider, or another user.
            </p>
          </section>

          <section id="verification" className="privacy-section">
            <h2>6. Property Verification and Trust</h2>
            <p>
              Rooma may implement verification processes for users, property providers, and listings
              to improve trust and reduce misinformation on the platform. Depending on the type of
              verification, we may request identity or account verification information, property
              ownership or authorization documents, property photographs or videos, location
              information, and camera-captured verification materials. Verification does not
              necessarily guarantee the quality, safety, legality, ownership, availability, or
              suitability of every property or provider — users should exercise reasonable care and
              review all relevant information before making accommodation, rental, purchase, or
              financial decisions.
            </p>
          </section>

          <section id="cookies" className="privacy-section">
            <h2>7. Cookies and Similar Technologies</h2>
            <p>Rooma may use cookies and similar technologies to keep you signed in, remember your preferences, improve website functionality, understand how users interact with the platform, improve security, and measure performance. You may be able to manage certain cookie preferences through your browser or device settings. Disabling some cookies may affect the functionality of Rooma.</p>
          </section>

          <section id="storage-security" className="privacy-section">
            <h2>8. Data Storage and Security</h2>
            <p>
              Rooma uses reasonable technical and organizational measures designed to protect
              personal information against unauthorized access, loss, misuse, alteration, or
              disclosure, including authentication and access controls, role-based access
              restrictions, secure system architecture, encryption where appropriate, monitoring and
              security auditing, and controlled access to sensitive systems and data. Rooma's
              technical framework is designed around centralized data management, secure
              authentication, role-based access control, and cloud-based storage. However, no
              internet-based platform or storage system can guarantee absolute security. You are also
              responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section id="retention" className="privacy-section">
            <h2>9. Data Retention</h2>
            <p>
              We retain personal information only for as long as reasonably necessary to provide
              Rooma services, maintain your account, process bookings and transactions, meet legal,
              accounting, security, or regulatory obligations, resolve disputes, and enforce our
              agreements. The length of time we retain information may vary depending on the type of
              information and the purpose for which it was collected. When information is no longer
              required, we may delete, anonymize, or securely dispose of it in accordance with
              applicable requirements.
            </p>
          </section>

          <section id="your-rights" className="privacy-section">
            <h2>10. Your Rights and Choices</h2>
            <p>Depending on applicable law and the nature of your relationship with Rooma, you may have rights regarding your personal information, including the ability to:</p>
            <ul>
              <li>Access certain personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Update your account information</li>
              <li>Request deletion of your account or certain information</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Object to or restrict certain processing, where applicable</li>
              <li>Manage marketing communication preferences</li>
            </ul>
            <p>Some information may need to be retained where required for legitimate business, legal, security, or regulatory purposes. To make a privacy-related request, contact us using the details below.</p>
          </section>

          <section id="children" className="privacy-section">
            <h2>11. Children's Privacy</h2>
            <p>
              Rooma is not intended to knowingly collect personal information from children in
              violation of applicable law. If we become aware that personal information has been
              collected from a child without appropriate authorization or consent where required, we
              may take reasonable steps to delete or restrict access to that information. If you
              believe a child has provided personal information to Rooma improperly, please contact
              us.
            </p>
          </section>

          <section id="third-party" className="privacy-section">
            <h2>12. Third-Party Services and Links</h2>
            <p>
              Rooma may contain links to third-party websites, services, maps, payment platforms, or
              other external resources. Rooma is not responsible for the privacy practices, content,
              or security of third-party services. We encourage you to review the privacy policies of
              any external service before providing your personal information.
            </p>
          </section>

          <section id="governing-law" className="privacy-section">
            <h2>13. Governing Law</h2>
            <p>This Privacy Policy is governed by the laws of Ghana.</p>
          </section>

          <section id="changes" className="privacy-section">
            <h2>14. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes to Rooma's
              services, technology, security practices, or legal or regulatory requirements. When we
              make material changes, we may provide notice through the Rooma platform, email, or
              another appropriate method. The "Last Updated" date at the top of this Privacy Policy
              indicates when it was most recently revised. Your continued use of Rooma after an
              updated Privacy Policy becomes effective may be subject to the revised policy.
            </p>
          </section>

          <section id="contact" className="privacy-section">
            <h2>15. Contact Us</h2>
            <p>If you have questions, concerns, or requests relating to this Privacy Policy or how Rooma handles your information, you may contact us at:</p>
            <div className="privacy-contact-card">
              <p className="privacy-contact-card__title">Rooma Privacy &amp; Data Protection</p>
              <p>
                Email: <a href="mailto:privacy@rooma.elpi.dev">privacy@rooma.elpi.dev</a>
              </p>
              <p>
                General Support: <a href="mailto:support@rooma.elpi.dev">support@rooma.elpi.dev</a>
              </p>
              <p>
                Website: <a href="https://rooma.elpi.dev">https://rooma.elpi.dev</a>
              </p>
              <p className="privacy-contact-card__footer">
                Rooma — A Product of eLPi.dev
                <br />
                eLPi.dev is a Subsidiary of Elpyron Ltd.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
