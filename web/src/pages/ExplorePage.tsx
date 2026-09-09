import { CategoryListingsPage } from "./CategoryListingsPage";

// Note: the roadmap's "Tourism" category (parks, landmarks, experiences)
// isn't backed by its own data model on the backend yet — only hostel,
// hotel, rental, and sale listings exist. This page works as a general
// search across everything Rooma currently lists, rather than a separate
// tourism/experiences catalog. Revisit once a tourism data model exists.
export function ExplorePage() {
  return (
    <CategoryListingsPage
      heroTitle="Explore Rooma"
      heroSubtitle="Search across hostels, hotels, rentals, and homes for sale — all in one place."
    />
  );
}
