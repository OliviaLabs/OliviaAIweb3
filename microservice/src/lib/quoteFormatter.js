// microservice/src/lib/quoteFormatter.js
import { formatUnits } from "viem";

// Safe number formatting
const nf = (n, dp = 6) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: dp });

export function formatSwapFrom0x({ quoteOrPrice, sellInfo, buyInfo, chainLabel }) {
  if (!quoteOrPrice) throw new Error("Missing 0x response");

  // 0x v2 fields we care about (handle both /price and /quote shapes)
  const sellAmountWei = quoteOrPrice.sellAmount ?? quoteOrPrice.sellAmountBaseUnits ?? "0";
  const buyAmountWei  = quoteOrPrice.buyAmount  ?? quoteOrPrice.buyAmountBaseUnits  ?? "0";
  const gasUnits      = quoteOrPrice.gas ?? quoteOrPrice.estimatedGas ?? quoteOrPrice.transaction?.gas;
  const gasPriceWei   = quoteOrPrice.gasPrice ?? quoteOrPrice.gasPriceWei ?? quoteOrPrice.transaction?.gasPrice;
  
  // v2 specific fields
  const issues = quoteOrPrice.issues || null;
  const allowanceTarget = quoteOrPrice.allowanceTarget || null;
  const value = quoteOrPrice.value || null; // Required for native ETH sells
  const to = quoteOrPrice.to || null; // Settler address
  const liquidityAvailable = quoteOrPrice.liquidityAvailable !== false; // v2 signal

  // Convert to human units using token decimals
  const sellHuman = Number(formatUnits(BigInt(sellAmountWei), sellInfo.decimals));
  const buyHuman  = Number(formatUnits(BigInt(buyAmountWei),  buyInfo.decimals));

  // Exec price (buy per 1 sell)
  const px = sellHuman > 0 ? buyHuman / sellHuman : NaN;

  // Protocol fee (if present) — convert with buy token decimals
  let protoFeeHuman = null;
  const protoFeeWei =
    quoteOrPrice.zeroExFee ?? quoteOrPrice.buyTokenPercentageFee ?? quoteOrPrice.fee ?? null;
  if (protoFeeWei != null) {
    try {
      protoFeeHuman = Number(formatUnits(BigInt(protoFeeWei), buyInfo.decimals));
    } catch (_) {}
  }

  // Network fee (if fields exist): feeWei = gas * gasPrice
  let feeEth = null, gasPriceGwei = null;
  if (gasUnits && gasPriceWei) {
    const feeWei = BigInt(gasUnits) * BigInt(gasPriceWei);
    feeEth = Number(formatUnits(feeWei, 18));           // ETH
    gasPriceGwei = Number(formatUnits(BigInt(gasPriceWei), 9)); // Gwei
  }

  // Build a friendly message (no hallucinations)
  const lines = [];
  lines.push(
    `Swap ${nf(sellHuman)} ${sellInfo.symbol} → ~${nf(buyHuman)} ${buyInfo.symbol}`
  );
  if (isFinite(px)) {
    lines.push(
      `Chain: ${chainLabel} • Exec. price: ~${nf(px, buyInfo.decimals === 6 ? 6 : 8)} ${buyInfo.symbol}/${sellInfo.symbol}`
    );
  } else {
    lines.push(`Chain: ${chainLabel}`);
  }
  if (feeEth != null && gasPriceGwei != null) {
    lines.push(`Network fee: ~${nf(feeEth, 6)} ETH (${nf(gasPriceGwei, 2)} Gwei)`);
  } else {
    lines.push(`Network fee: estimating…`);
  }
  if (protoFeeHuman != null) {
    lines.push(`0x protocol fee: ${nf(protoFeeHuman, buyInfo.decimals)} ${buyInfo.symbol}`);
  }

  // Add issues information to the message if present
  if (issues) {
    lines.push("⚠️ Transaction Issues:");
    if (issues.balance) {
      lines.push(`  • Insufficient balance`);
    }
    if (issues.allowance) {
      lines.push(`  • Token approval required for ${issues.allowance.spender || allowanceTarget}`);
    }
  }
  
  // Add liquidity warning if not available
  if (!liquidityAvailable) {
    lines.push("❌ No liquidity available for this route");
  }

  return {
    // structured values for UI
    amounts: {
      sellHuman, buyHuman,
      sellAmountWei: String(sellAmountWei),
      buyAmountWei:  String(buyAmountWei),
      execPrice: px
    },
    gas: {
      gasUnits: gasUnits ?? null,
      gasPriceWei: gasPriceWei ?? null,
      gasPriceGwei,
      feeEth
    },
    protocolFee: {
      raw: protoFeeWei ?? null,
      human: protoFeeHuman
    },
    // v2 specific fields
    issues: issues,
    allowanceTarget: allowanceTarget,
    value: value,
    to: to,
    liquidityAvailable: liquidityAvailable,
    message: lines.join("\n")
  };
}
