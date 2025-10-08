// 0x Protocol Controller — uses 0x Allowance‑Holder Swap API
import axios from 'axios';
import { parseUnits } from 'viem';
import { TOKENS, resolveTokenStrict } from '../lib/tokens.js';

const API = 'https://api.0x.org';
const VERSION = 'v2';

function headers() {
  const key = process.env.ZERO_EX_API_KEY; // set in .env
  if (!key) throw new Error('Missing ZERO_EX_API_KEY');
  return {
    'Content-Type': 'application/json',
    '0x-api-key': key,
    '0x-version': VERSION,
  };
}

function toBaseUnits(amount, decimals) {
  return parseUnits(String(amount), Number(decimals)).toString();
}

function sanitizeAmountOr400(res, amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    res.status(400).json({ success: false, error: 'sellAmount must be a positive number' });
    return null;
  }
  return n;
}

function normalizeFor0x(addrOrEth) {
  // 0x expects 'ETH' sentinel for native; return as-is for ERC‑20 addresses
  if (String(addrOrEth).toUpperCase() === 'ETH') return 'ETH';
  return addrOrEth;
}

export async function getSwapPrice(req, res) {
  try {
    const { sellToken, buyToken, sellAmount, chainId = 1, taker } = req.query;

    if (!sellToken || !buyToken || !sellAmount) {
      return res.status(400).json({ success: false, error: 'Missing required: sellToken, buyToken, sellAmount' });
    }
    const n = sanitizeAmountOr400(res, sellAmount); if (n === null) return;

    const cid = Number(chainId);
    const sellInfo = resolveTokenStrict(cid, sellToken);
    const buyInfo  = resolveTokenStrict(cid, buyToken);

    const sellAmountWei = toBaseUnits(sellAmount, sellInfo.decimals);

    // Use ETH sentinel when native; do NOT force WETH — 0x will handle wrap/unwrap
    const sellParam = normalizeFor0x(sellInfo.address);
    const buyParam  = normalizeFor0x(buyInfo.address);

    const qs = new URLSearchParams({
      chainId: String(cid),
      sellToken: String(sellParam),
      buyToken: String(buyParam),
      sellAmount: sellAmountWei,
    });
    if (taker) qs.set('taker', String(taker));

    const url = `${API}/swap/allowance-holder/price?${qs.toString()}`;
    const r = await axios.get(url, { headers: headers() });

    return res.json({ success: true, data: r.data });
  } catch (error) {
    console.error('[0x Price] Error', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
    });
  }
}

export async function getSwapQuote(req, res) {
  try {
    const { sellToken, buyToken, sellAmount, chainId = 1, taker, takerAddress, slippageBps = 50 } = req.query;

    if (!sellToken || !buyToken || !sellAmount) {
      return res.status(400).json({ success: false, error: 'Missing required: sellToken, buyToken, sellAmount' });
    }
    const n = sanitizeAmountOr400(res, sellAmount); if (n === null) return;

    const cid = Number(chainId);
    const sellInfo = resolveTokenStrict(cid, sellToken);
    const buyInfo  = resolveTokenStrict(cid, buyToken);

    const sellAmountWei = toBaseUnits(sellAmount, sellInfo.decimals);

    const sellParam = normalizeFor0x(sellInfo.address);
    const buyParam  = normalizeFor0x(buyInfo.address);

    const qs = new URLSearchParams({
      chainId: String(cid),
      sellToken: String(sellParam),
      buyToken: String(buyParam),
      sellAmount: sellAmountWei,
      slippageBps: String(slippageBps),
    });
    const takerParam = taker || takerAddress;
    if (takerParam) qs.set('taker', String(takerParam));

    const url = `${API}/swap/allowance-holder/quote?${qs.toString()}`;
    const r = await axios.get(url, { headers: headers() });

    return res.json({ success: true, data: r.data });
  } catch (error) {
    console.error('[0x Quote] Error', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
    });
  }
}

/**
 * GET /api/zerox/prepare-transaction
 * Returns a wallet-ready transaction object from 0x quote
 * Required params: sellToken, buyToken, sellAmount
 * Optional params: chainId, taker or takerAddress, slippageBps
 */
export async function getPreparedTransaction(req, res) {
  try {
    const { sellToken, buyToken, sellAmount, chainId = 1, taker, takerAddress, slippageBps = 50 } = req.query;

    if (!sellToken || !buyToken || !sellAmount) {
      return res.status(400).json({ success: false, error: 'Missing required: sellToken, buyToken, sellAmount' });
    }
    const n = sanitizeAmountOr400(res, sellAmount); if (n === null) return;

    const cid = Number(chainId);
    const sellInfo = resolveTokenStrict(cid, sellToken);
    const buyInfo  = resolveTokenStrict(cid, buyToken);

    const sellAmountWei = toBaseUnits(sellAmount, sellInfo.decimals);

    const sellParam = normalizeFor0x(sellInfo.address);
    const buyParam  = normalizeFor0x(buyInfo.address);

    const qs = new URLSearchParams({
      chainId: String(cid),
      sellToken: String(sellParam),
      buyToken: String(buyParam),
      sellAmount: sellAmountWei,
      slippageBps: String(slippageBps),
    });
    const takerParam = taker || takerAddress;
    if (takerParam) qs.set('taker', String(takerParam));

    const url = `${API}/swap/allowance-holder/quote?${qs.toString()}`;
    const r = await axios.get(url, { headers: headers() });

    const payload = r.data || {};
    const tx = payload.transaction || payload;

    return res.json({
      success: true,
      data: {
        to: tx.to,
        data: tx.data,
        value: tx.value ?? '0x0',
        gas: tx.gas,
        gasPrice: tx.gasPrice,
      },
      quote: payload,
    });
  } catch (error) {
    console.error('[0x Prepare Tx] Error', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
    });
  }
}

export async function getTokens(req, res) {
  const cid = Number(req.query.chainId || 1);
  const reg = TOKENS[cid] || {};
  return res.json({ success: true, data: Object.values(reg) });
}

export async function getGasPrice(req, res) {
  return res.json({ success: false, error: 'Not implemented yet' });
}

export async function getOrderBook(req, res) {
  return res.json({ success: false, error: 'Not implemented yet' });
}