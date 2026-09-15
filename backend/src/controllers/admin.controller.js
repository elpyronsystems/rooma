const prisma = require("../config/prisma");
const { attachSignedUrlsToListings, getSignedMediaUrl } = require("../utils/mediaUrls");
const { recordAudit } = require("../utils/audit");

const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
  phoneVerified: true,
  isSuspended: true,
  createdAt: true,
};

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

const VALID_ROLES = ["seeker", "landlord", "agent", "hotel_manager", "admin"];

/**
 * PATCH /api/admin/users/:id
 * Body: { role?, isSuspended? } — either or both. An admin can't
 * suspend or demote themselves through this endpoint, avoiding an
 * accidental lockout.
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, isSuspended } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ error: "You can't change your own account through this panel" });
    }

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isSuspended !== undefined && { isSuspended }),
      },
      select: USER_SELECT,
    });

    await recordAudit({
      actorId: req.user.id,
      action: isSuspended !== undefined ? (isSuspended ? "user.suspended" : "user.reinstated") : "user.role_changed",
      entityType: "user",
      entityId: id,
      metadata: { role, isSuspended },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/listings
 * Every listing regardless of status, so moderation can see what's
 * pending, active, or archived all in one place. Optional ?status=
 * filter.
 */
async function getAdminListings(req, res, next) {
  try {
    const { status } = req.query;

    const listings = await prisma.listing.findMany({
      where: status ? { status } : undefined,
      include: {
        media: { orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }] },
        owner: { select: { id: true, fullName: true, phoneNumber: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    await attachSignedUrlsToListings(listings);

    res.json(listings);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support-messages
 */
async function getSupportMessages(req, res, next) {
  try {
    const messages = await prisma.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support-messages/:id
 * Body: { resolved: boolean }
 */
async function updateSupportMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { resolved } = req.body;

    if (typeof resolved !== "boolean") {
      return res.status(400).json({ error: "resolved must be true or false" });
    }

    const message = await prisma.supportMessage.findUnique({ where: { id } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const updated = await prisma.supportMessage.update({ where: { id }, data: { resolved } });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/documents
 * Every uploaded ownership/verification document across all listings,
 * newest first, with enough listing/owner context to act on. Optional
 * ?verified=true|false filter.
 */
async function getDocuments(req, res, next) {
  try {
    const { verified } = req.query;

    const documents = await prisma.listingDocument.findMany({
      where: verified !== undefined ? { verified: verified === "true" } : undefined,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            owner: { select: { id: true, fullName: true, phoneNumber: true } },
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    await Promise.all(
      documents.map(async (doc) => {
        doc.fileUrl = await getSignedMediaUrl(doc.fileUrl);
      })
    );

    res.json(documents);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/documents/:id
 * Body: { verified: boolean }
 */
async function updateDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res.status(400).json({ error: "verified must be true or false" });
    }

    const document = await prisma.listingDocument.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const updated = await prisma.listingDocument.update({
      where: { id },
      data: { verified, verifiedBy: verified ? req.user.id : null },
    });

    await recordAudit({
      actorId: req.user.id,
      action: verified ? "document.verified" : "document.unverified",
      entityType: "listing_document",
      entityId: id,
      metadata: { listingId: document.listingId },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/analytics
 * Aggregate counts for a lightweight admin dashboard — nothing here
 * needs to be real-time-precise, so straightforward counts/groupBy
 * queries are fine rather than a dedicated analytics pipeline.
 */
async function getAnalytics(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersByRole,
      totalListings,
      listingsByType,
      listingsByStatus,
      totalBookings,
      bookingsByStatus,
      totalSupportMessages,
      unresolvedSupportMessages,
      recentUsers,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.listing.count(),
      prisma.listing.groupBy({ by: ["type"], _count: true }),
      prisma.listing.groupBy({ by: ["status"], _count: true }),
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      prisma.supportMessage.count(),
      prisma.supportMessage.count({ where: { resolved: false } }),
      prisma.user.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
      prisma.booking.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
    ]);

    // Bucket signups/bookings by day for the last 30 days, so the
    // frontend can draw a simple bar chart without doing its own
    // date math against raw rows.
    function bucketByDay(rows) {
      const buckets = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      for (const row of rows) {
        const key = row.createdAt.toISOString().slice(0, 10);
        if (key in buckets) buckets[key] += 1;
      }
      return Object.entries(buckets).map(([date, count]) => ({ date, count }));
    }

    res.json({
      totalUsers,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      totalListings,
      listingsByType: listingsByType.map((r) => ({ type: r.type, count: r._count })),
      listingsByStatus: listingsByStatus.map((r) => ({ status: r.status, count: r._count })),
      totalBookings,
      bookingsByStatus: bookingsByStatus.map((r) => ({ status: r.status, count: r._count })),
      totalSupportMessages,
      unresolvedSupportMessages,
      signupsLast30Days: bucketByDay(recentUsers),
      bookingsLast30Days: bucketByDay(recentBookings),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Deletes a user outright — meant for genuinely abandoned/unused
 * accounts, not as a substitute for suspension. If the account has any
 * listings, bookings, saved listings, or ratings attached, the delete is
 * blocked with a clear message rather than silently cascading and
 * wiping out data other people may still care about (e.g. someone
 * else's confirmed booking against that user's listing).
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "You can't delete your own account through this panel" });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const [listingCount, bookingCount, savedCount, ratingCount] = await Promise.all([
      prisma.listing.count({ where: { ownerId: id } }),
      prisma.booking.count({ where: { userId: id } }),
      prisma.savedListing.count({ where: { userId: id } }),
      prisma.rating.count({ where: { userId: id } }),
    ]);

    if (listingCount > 0 || bookingCount > 0 || savedCount > 0 || ratingCount > 0) {
      return res.status(409).json({
        error:
          "This account has listings, bookings, saved listings, or reviews attached, so it can't be deleted directly. Suspend it instead, or remove the related records first.",
      });
    }

    await prisma.user.delete({ where: { id } });

    await recordAudit({
      actorId: req.user.id,
      action: "user.deleted",
      entityType: "user",
      entityId: id,
      metadata: { fullName: target.fullName, phoneNumber: target.phoneNumber },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getAdminListings,
  getSupportMessages,
  updateSupportMessage,
  getDocuments,
  updateDocument,
  getAnalytics,
};
