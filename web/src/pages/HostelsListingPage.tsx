import { CategoryListingsPage } from "./CategoryListingsPage";

export function HostelsListingPage() {
  return (
    <CategoryListingsPage
      heroTitle="Student Hostels"
      heroSubtitle="Affordable, safe accommodation near your campus."
      fixedTypes={["hostel"]}
    />
  );
}
