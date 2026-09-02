const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const listingsRoutes = require("./routes/listings.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const mediaRoutes = require("./routes/media.routes");
const ratingsRoutes = require("./routes/ratings.routes");
const savedListingsRoutes = require("./routes/savedListings.routes");
const errorHandler = require("./middleware/errorHandler");
const buildCorsOptions = require("./config/cors");

const app = express();

if (!process.env.ALLOWED_ORIGINS && process.env.NODE_ENV === "production") {
  console.warn(
    "WARNING: ALLOWED_ORIGINS is not set in production — CORS will allow all origins. Set it in .env to your real frontend domain(s)."
  );
}

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/listings/:listingId/media", mediaRoutes);
app.use("/api/listings/:listingId/ratings", ratingsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/saved-listings", savedListingsRoutes);
// TODO: /api/payments — on hold per CEO's instruction

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

module.exports = app;
