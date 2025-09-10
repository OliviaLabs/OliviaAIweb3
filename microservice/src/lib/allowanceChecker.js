// On-chain allowance checker for robust approval verification
import { createPublicClient, http, getContract, erc20Abi } from 'viem';
import { mainnet, polygon, optimism, arbitrum, base } from 'viem/chains';

// Chain configurations
const chains = {
  1: mainnet,
  137: polygon,
  10: optimism,
  42161: arbitrum,
  8453: base,
};

// Create clients for each chain
const clients = {};
for (const [chainId, chain] of Object.entries(chains)) {
  const rpcUrl = process.env[`RPC_URL_${chainId}`] || process.env.RPC_URL;
  if (rpcUrl) {
    clients[chainId] = createPublicClient({
      chain,
      transport: http(rpcUrl)
    });
  }
}

/**
 * Check if owner has sufficient allowance for spender
 * @param {Object} params
 * @param {string} params.token - Token contract address
 * @param {string} params.owner - Token owner address
 * @param {string} params.spender - Spender address (AllowanceHolder)
 * @param {string} params.sellAmountBase - Amount to sell in base units
 * @param {number} params.chainId - Chain ID
 * @returns {Promise<boolean>} True if allowance is sufficient
 */
export async function hasSufficientAllowance({ token, owner, spender, sellAmountBase, chainId = 1 }) {
  try {
    const client = clients[chainId];
    if (!client) {
      console.warn(`No RPC client for chain ${chainId}, assuming approval needed`);
      return false;
    }
    
    const contract = getContract({
      address: token,
      abi: erc20Abi,
      client
    });
    
    const current = await contract.read.allowance([owner, spender]);
    const sufficient = BigInt(current) >= BigInt(sellAmountBase);
    
    console.log('📊 On-chain allowance check:', {
      token,
      owner,
      spender,
      current: current.toString(),
      required: sellAmountBase,
      sufficient
    });
    
    return sufficient;
  } catch (error) {
    console.error('Error checking allowance on-chain:', error);
    // Be conservative - assume approval needed if check fails
    return false;
  }
}

/**
 * Robust allowance check that handles all cases
 * @param {Object} params
 * @param {Object} params.quote - Quote response from 0x
 * @param {string} params.sellAmountBase - Sell amount in base units
 * @param {string} params.taker - User's wallet address
 * @param {number} params.chainId - Chain ID
 * @returns {Promise<boolean>} True if approval is needed
 */
export async function needsAllowance({ quote, sellAmountBase, taker, chainId = 1, rpcClient }) {
  const amount = BigInt(String(sellAmountBase ?? '0'));

  // Skip allowance check for native ETH
  if (quote.sellToken === 'ETH' || 
      quote.sellToken?.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return false;
  }

  const issues = quote?.issues;
  const actualStr = issues?.allowance?.actual;
  const requiredStr = issues?.allowance?.required;
  const spender = issues?.allowance?.spender || quote?.allowanceTarget;

  // Prefer 0x v2 issues first when present (strict gate)
  if (actualStr != null) {
    try {
      const actual = BigInt(actualStr);
      const required = requiredStr != null ? BigInt(requiredStr) : amount;
      return actual < required; // true -> approval needed
    } catch {
      // fall through
    }
  }

  // No hint from 0x; only do on-chain check if rpcClient exists
  if (!rpcClient) {
    // Unknown → do NOT block the flow (no-check)
    return false;
  }

  // On-chain fallback (only when we have a client)
  try {
    if (!spender) return false;
    const allowance = await rpcClient.readContract({
      address: quote.sellToken,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [taker, spender],
      chainId
    });
    return BigInt(allowance) < amount;
  } catch {
    // If we can’t read, don’t block
    return false;
  }
}

/**
 * Check if balance is insufficient
 * @param {Object} issues - Issues object from quote
 * @param {string} sellAmountBase - Sell amount in base units
 * @returns {boolean} True if balance is insufficient
 */
export function hasInsufficientBalance(issues, sellAmountBase) {
  const b = issues?.balance;
  if (!b) return false;
  
  // If API provided 'required', use it
  if (b.required != null) {
    try {
      return BigInt(b.actual || 0) < BigInt(b.required || 0);
    } catch {
      return true; // Be conservative
    }
  }
  
  // If only 'actual' provided, compare with sellAmount
  if (b.actual != null && sellAmountBase) {
    try {
      return BigInt(b.actual || 0) < BigInt(sellAmountBase);
    } catch {
      return true;
    }
  }
  
  return false;
}
