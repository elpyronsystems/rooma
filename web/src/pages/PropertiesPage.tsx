import { CategoryListingsPage } from "./CategoryListingsPage";

export function PropertiesPage() {
  return (
    <CategoryListingsPage
      heroTitle="Explore Properties"
      heroSubtitle="Homes to rent or buy, verified for your peace of mind."
      fixedTypes={["rental", "sale"]}
    />
  );
}
