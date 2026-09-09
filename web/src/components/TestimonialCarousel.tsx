import { useEffect, useState } from "react";
import "./TestimonialCarousel.css";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

// Placeholder testimonials — swap these for real customer quotes once
// you have some. Kept in the same illustrative spirit as the original
// brand reference design.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Rooma made it so easy to find a safe and comfortable place during my studies in Accra.",
    author: "Ama Serwaa",
    role: "Student, University of Ghana",
  },
  {
    quote:
      "As a landlord, I finally have one place to list my units and actually see who's interested — no more juggling WhatsApp groups.",
    author: "Kwabena Owusu",
    role: "Landlord, East Legon",
  },
  {
    quote:
      "Booking a room for a work trip took minutes instead of the usual back-and-forth with agents.",
    author: "Efua Mensah",
    role: "Business Traveller",
  },
];

const AUTO_ADVANCE_MS = 6000;

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, []);

  const active = TESTIMONIALS[activeIndex];

  return (
    <div className="testimonial-card">
      <h3>Trusted by Thousands</h3>

      <div key={activeIndex} className="testimonial-card__slide">
        <p className="testimonial-card__quote">"{active.quote}"</p>
        <p className="testimonial-card__author">— {active.author}</p>
        <p className="testimonial-card__role">{active.role}</p>
      </div>

      <div className="testimonial-card__dots">
        {TESTIMONIALS.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`testimonial-card__dot${
              index === activeIndex ? " testimonial-card__dot--active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
