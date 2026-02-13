function verifyAdmin(req, res, next) {
  const providedSecret = req.body?.adminSecret;
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    return res.status(500).json({ message: "Server admin secret is not configured" });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return res.status(403).json({ message: "Invalid admin secret" });
  }

  next();
}

module.exports = verifyAdmin;
