// microservice/src/routes/portfolio.js
import express from "express";
import { getPortfolioAlchemy } from "../lib/portfolioAlchemy.js";
const router = express.Router();

// GET /api/portfolio/:address - scans ALL chains automatically
router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    console.log(`💰 Scanning complete portfolio for ${address} across all chains`);
    const data = await getPortfolioAlchemy(address);
    console.log(`💰 Found ${data.length} total tokens across all chains for ${address}`);
    res.json({ success: true, data, totalTokens: data.length });
  } catch (e) {
    console.error('Portfolio error:', e);
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
