const prisma = require("../config/prisma");

/**
 * Records an accountability entry. Never throws — a failed audit write
 * should never block the actual action it's recording; it's logged to
 * the console instead so it's still visible without breaking the request.
 */
async function recordAudit({ actorId, action, entityType, entityId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, metadata: metadata ?? undefined },
    });
  } catch (err) {
    console.error("Failed to write audit log entry:", err.message);
  }
}

module.exports = { recordAudit };
