export type UserRole = "seeker" | "landlord" | "agent" | "hotel_manager" | "admin";

export interface User {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  role: UserRole;
}

export interface ApiIssue {
  field: string;
  message: string;
}

export interface ListingMedia {
  id: string;
  mediaType: "image" | "video";
  url: string;
  displayOrder?: number;
  isCover?: boolean;
}

export interface HotelDetails {
  starRating?: number;
  amenities?: string[];
}

export interface RentalDetails {
  bedrooms?: number;
  bathrooms?: number;
  leaseTerm?: string;
  furnished?: boolean;
}

export interface SaleDetails {
  bedrooms?: number;
  bathrooms?: number;
  landSizeSqm?: string;
  ownershipVerified?: boolean;
}

export interface HostelDetails {
  roomType?: string;
  capacity?: number;
  distanceToCampusKm?: string;
}

export interface RoomType {
  id: string;
  name: string;
  pricePerNight: string;
  capacity: number;
  quantityAvailable: number;
}

export interface OwnerContact {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  businessName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
}

export interface Listing {
  id: string;
  type: "hostel" | "hotel" | "rental" | "sale";
  title: string;
  description?: string;
  price: string;
  currency: string;
  priceNegotiable: boolean;
  status: string;
  address?: string;
  averageRating: string;
  ratingCount: number;
  createdAt?: string;
  media: ListingMedia[];
  hotelDetails?: HotelDetails | null;
  rentalDetails?: RentalDetails | null;
  saleDetails?: SaleDetails | null;
  hostelDetails?: HostelDetails | null;
  roomTypes?: RoomType[];
  owner?: OwnerContact;
}

export interface Rating {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { id: string; fullName: string; profilePhotoUrl?: string };
}

export interface Booking {
  id: string;
  listingId: string;
  roomTypeId?: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  checkIn?: string;
  checkOut?: string;
  totalAmount: string;
  currency: string;
  createdAt?: string;
  listing?: { id: string; title: string; address?: string; type: string; currency: string };
  roomType?: { id: string; name: string };
  user?: { id: string; fullName: string; phoneNumber?: string };
}
