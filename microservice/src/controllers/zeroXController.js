// 0x Protocol Controller — uses 0x v2 Allowance‑Holder Swap API
// CRITICAL v2 Requirements:
// 1. taker is REQUIRED for /quote endpoint
// 2. Must check and handle issues field (allowance/balance)
// 3. Approve issues.allowance.spender or allowanceTarget (never Settler)
// 4. Re-quote after approval to clear issues
// 5. Include value for native ETH sells
import axios from 'axios';
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

// Proper base units conversion (no floats) - production-grade
function toBaseUnits(human, decimals) {
  const humanStr = String(human).trim().replace(/^\+/, '');
  
  // Validate decimal format
  if (!/^\d*(\.\d*)?$/.test(humanStr)) {
    throw new Error('Invalid decimal amount');
  }
  
  // Split into integer and fraction parts
  const [iRaw, fRaw = ""] = humanStr.includes('.') ? humanStr.split('.') : [humanStr, ""];
  
  // Normalize integer part (remove leading zeros but keep at least one)
  const integer = iRaw === "" ? "0" : iRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fRaw;
  
  // Pad or truncate fraction to match decimals
  const frac = (fraction + "0".repeat(decimals)).slice(0, decimals);
  
  // Combine integer and fraction parts
  const baseUnitsStr = integer + (decimals ? frac : "");
  
  // Use BigInt to ensure no precision loss
  return BigInt(baseUnitsStr || "0").toString();
}

// Improved amount validation without float conversion
function sanitizeAmountOr400(res, amount) {
  const s = String(amount).trim();
  
  // Check valid decimal format
  if (!/^\d+(\.\d+)?$/.test(s)) {
    res.status(400).json({ 
      success: false, 
      error: 'sellAmount must be a positive decimal string (e.g., "1.5", "100", "0.001")' 
    });
    return null;
  }
  
  // Check for zero
  if (s === '0' || /^0+(\.0+)?$/.test(s)) {
    res.status(400).json({ 
      success: false, 
      error: 'sellAmount must be greater than zero' 
    });
    return null;
  }
  
  return s; // return the sanitized string
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
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required: sellToken, buyToken, sellAmount' 
      });
    }
    
    const sanitizedAmount = sanitizeAmountOr400(res, sellAmount);
    if (sanitizedAmount === null) return;

    const cid = Number(chainId);
    const sellInfo = resolveTokenStrict(cid, sellToken);
    const buyInfo  = resolveTokenStrict(cid, buyToken);

    const sellAmountWei = toBaseUnits(sanitizedAmount, sellInfo.decimals);

    // Use ETH sentinel when native; do NOT force WETH — 0x will handle wrap/unwrap
    const sellParam = normalizeFor0x(sellInfo.address);
    const buyParam  = normalizeFor0x(buyInfo.address);

    const qs = new URLSearchParams({
      chainId: String(cid),
      sellToken: String(sellParam),
      buyToken: String(buyParam),
      sellAmount: sellAmountWei,
    });
    
    // Include taker if provided for better validation context
    if (taker) qs.set('taker', String(taker));

    const url = `${API}/swap/allowance-holder/price?${qs.toString()}`;
    const r = await axios.get(url, { headers: headers() });

    // v2 may return transaction object even in /price endpoint
    const tx = r.data.transaction ?? {};
    
    // Build response with proper field mapping
    const responseData = {
      ...r.data,
      // If transaction object exists, map fields from it
      to: tx.to ?? r.data.to ?? null,
      data: tx.data ?? r.data.data ?? null,
      value: tx.value ?? r.data.value ?? null,
      gas: tx.gas ?? r.data.gas ?? null,
      gasPrice: tx.gasPrice ?? r.data.gasPrice ?? null,
      chainId: cid
    };
    
    return res.json({ 
      success: true, 
      data: responseData
    });
  } catch (error) {
    console.error('[0x Price] Error', error.response?.data || error.message);
    
    const errorData = error.response?.data;
    let errorMessage = error.message;
    
    if (errorData?.validationErrors) {
      errorMessage = errorData.validationErrors.map(e => e.reason).join(', ');
    } else if (errorData?.reason) {
      errorMessage = errorData.reason;
    } else if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: errorData,
    });
  }
}

export async function getSwapQuote(req, res) {
  try {
    const { sellToken, buyToken, sellAmount, chainId = 1, taker } = req.query;
    
    // Handle slippage parameters - accept either slippageBps or slippagePercentage
    const slippageBps = req.query.slippageBps ?? undefined;
    const slippagePercentage = req.query.slippagePercentage ?? undefined;
    
    if (slippageBps && slippagePercentage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provide either slippageBps or slippagePercentage, not both' 
      });
    }

    // In v2, taker is REQUIRED for /quote (not optional)
    if (!sellToken || !buyToken || !sellAmount || !taker) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: sellToken, buyToken, sellAmount, and taker (v2 requires taker for /quote)' 
      });
    }
    
    const sanitizedAmount = sanitizeAmountOr400(res, sellAmount);
    if (sanitizedAmount === null) return;

    const cid = Number(chainId);
    const sellInfo = resolveTokenStrict(cid, sellToken);
    const buyInfo  = resolveTokenStrict(cid, buyToken);

    const sellAmountWei = toBaseUnits(sanitizedAmount, sellInfo.decimals);

    const sellParam = normalizeFor0x(sellInfo.address);
    const buyParam  = normalizeFor0x(buyInfo.address);

    // Build query params with proper slippage handling
    const base = {
      chainId: String(cid),
      sellToken: String(sellParam),
      buyToken: String(buyParam),
      sellAmount: sellAmountWei,
      taker: String(taker), // REQUIRED in v2
    };
    
    // Add slippage parameter if provided
    if (slippageBps != null) base['slippageBps'] = String(slippageBps);
    if (slippagePercentage != null) base['slippagePercentage'] = String(slippagePercentage);
    
    // Default slippage if none provided
    if (!slippageBps && !slippagePercentage) {
      base['slippageBps'] = '50'; // 0.5% default
    }
    
    const qs = new URLSearchParams(base);
    const url = `${API}/swap/allowance-holder/quote?${qs.toString()}`;
    
    console.log('[0x Quote] Request URL:', url);
    const r = await axios.get(url, { headers: headers() });
    
    // Log quote ID for support if present
    if (r.data.id) {
      console.log('[0x Quote] Quote ID:', r.data.id);
    }

    // Check for liquidity availability (v2 signal)
    if (r.data.liquidityAvailable === false) {
      return res.status(400).json({
        success: false,
        error: 'No liquidity available for this route',
        details: r.data
      });
    }

    // CRITICAL FIX: v2 returns executable fields inside 'transaction' object
    const tx = r.data.transaction ?? {};
    
    // Build response with correct field mapping
    const responseData = {
      ...r.data,
      // Ensure these critical fields are always present
      issues: r.data.issues ?? null,
      allowanceTarget: r.data.allowanceTarget ?? null,
      
      // CRITICAL: Pull executable fields from transaction object
      to: tx.to ?? null,           // This is the contract to call (AllowanceHolder)
      data: tx.data ?? null,        // The calldata to execute
      value: tx.value ?? null,      // ETH value to send (for native sells)
      gas: tx.gas ?? null,          // Gas limit
      gasPrice: tx.gasPrice ?? null, // Gas price
      
      // Additional useful fields
      minBuyAmount: r.data.minBuyAmount ?? null, // Minimum amount after slippage
      totalNetworkFee: r.data.totalNetworkFee ?? null, // Total network fee in ETH
      liquidityAvailable: r.data.liquidityAvailable !== false,
      chainId: cid, // Include for consistency checks
      
      // Add deterministic flags for easier branching
      needsAllowance: Boolean(
        r.data?.issues?.allowance && 
        BigInt(r.data.issues.allowance.actual || 0) < BigInt(r.data.issues.allowance.required || 0)
      ),
      insufficientBalance: Boolean(
        r.data?.issues?.balance && 
        BigInt(r.data.issues.balance.actual || 0) < BigInt(r.data.issues.balance.required || 0)
      ),
      
      // Keep the original transaction object for reference
      transaction: r.data.transaction ?? null
    };
    
    // CRITICAL GUARD: Never proceed without valid calldata
    if (!responseData.to || !responseData.data) {
      console.error('[0x Quote] Malformed response - missing transaction.to or transaction.data:', {
        hasTransaction: !!r.data.transaction,
        hasTo: !!tx.to,
        hasData: !!tx.data,
        rawResponse: r.data
      });
      
      return res.status(502).json({
        success: false,
        error: 'Malformed 0x response: missing transaction.to/data fields required for execution',
        details: r.data,
        hint: 'The 0x API did not return executable transaction data. This may be a temporary issue.'
      });
    }

    return res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[0x Quote] Error', error.response?.data || error.message);
    
    // Better error handling for common v2 issues
    const errorData = error.response?.data;
    let errorMessage = error.message;
    
    if (errorData?.validationErrors) {
      // Handle validation errors from 0x API
      errorMessage = errorData.validationErrors.map(e => e.reason).join(', ');
    } else if (errorData?.reason) {
      errorMessage = errorData.reason;
    } else if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    // Build helpful hints based on what's missing
    const hints = [];
    if (error.response?.status === 400) {
      if (!req.query.taker) hints.push('taker address is required on /quote');
      if (!req.query.sellToken) hints.push('missing sellToken');
      if (!req.query.buyToken) hints.push('missing buyToken');
      if (!req.query.sellAmount) hints.push('missing sellAmount');
      if (errorMessage.includes('Invalid address')) hints.push('check that taker address is valid');
      if (errorMessage.includes('Insufficient liquidity')) hints.push('try a smaller amount or different token pair');
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: errorData,
      hint: hints.length > 0 ? hints.join('; ') : undefined
    });
  }
}

// Optional: Simulate transaction before execution
export async function simulateSwap(req, res) {
  try {
    const { to, data, value, from, chainId = 1 } = req.body;
    
    if (!to || !data || !from) {
      return res.status(400).json({
        success: false,
        error: 'Missing required: to, data, from'
      });
    }
    
    // This would require an RPC provider setup
    // For now, return a placeholder
    return res.json({
      success: false,
      error: 'Simulation endpoint not yet implemented',
      hint: 'Would use eth_call to preflight the transaction'
    });
    
    // Future implementation:
    // const provider = getProvider(chainId);
    // const result = await provider.call({
    //   to,
    //   data,
    //   value: value || '0x0',
    //   from
    // });
    // return res.json({ success: true, result });
    
  } catch (error) {
    console.error('[Simulate] Error', error);
    return res.status(500).json({
      success: false,
      error: error.message
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