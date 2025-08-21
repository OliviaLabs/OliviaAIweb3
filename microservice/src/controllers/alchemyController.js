import { Alchemy, Network } from 'alchemy-sdk';

class AlchemyController {
  constructor() {
    // Your API key that works for all networks
    const apiKey = process.env.ALCHEMY_API_KEY || '_pGB49JjZobNT7IahUuqg';
    
    // Initialize Alchemy instances for different networks
    this.alchemyInstances = {
      'eth-mainnet': new Alchemy({
        apiKey: apiKey,
        network: Network.ETH_MAINNET
      }),
      'polygon-mainnet': new Alchemy({
        apiKey: apiKey,
        network: Network.MATIC_MAINNET
      }),
      'arb-mainnet': new Alchemy({
        apiKey: apiKey,
        network: Network.ARB_MAINNET
      }),
      'opt-mainnet': new Alchemy({
        apiKey: apiKey,
        network: Network.OPT_MAINNET
      })
    };
  }

  async getTokenBalances(req, res) {
    try {
      const { address, network = 'eth-mainnet' } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      console.log(`📊 Fetching token balances for ${address} on ${network}`);
      
      // Get the Alchemy instance for the network
      const alchemy = this.alchemyInstances[network];
      
      if (!alchemy) {
        return res.status(400).json({ error: `Unsupported network: ${network}` });
      }

      // Fetch token balances using Alchemy SDK
      const balances = await alchemy.core.getTokenBalances(address);
      
      // Filter out zero balances
      const nonZeroBalances = balances.tokenBalances.filter(
        token => token.tokenBalance !== '0x0' && token.tokenBalance !== '0x00'
      );
      
      // Get token metadata for non-zero balances
      const tokenDetails = await Promise.all(
        nonZeroBalances.slice(0, 20).map(async (token) => {
          try {
            const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
            return {
              contractAddress: token.contractAddress,
              tokenBalance: token.tokenBalance,
              ...metadata
            };
          } catch (err) {
            console.error(`Error fetching metadata for ${token.contractAddress}:`, err.message);
            return {
              contractAddress: token.contractAddress,
              tokenBalance: token.tokenBalance,
              symbol: 'Unknown',
              name: 'Unknown Token',
              decimals: 18
            };
          }
        })
      );

      res.json({
        jsonrpc: '2.0',
        id: 1,
        result: {
          address: address,
          tokenBalances: tokenDetails
        }
      });
      
    } catch (error) {
      console.error('Error fetching token balances:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch token balances',
        message: error.message 
      });
    }
  }

  async getTokenMetadata(req, res) {
    try {
      const { contractAddress, network = 'eth-mainnet' } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({ error: 'Contract address is required' });
      }

      console.log(`🪙 Fetching token metadata for ${contractAddress} on ${network}`);
      
      // Get the Alchemy instance for the network
      const alchemy = this.alchemyInstances[network];
      
      if (!alchemy) {
        return res.status(400).json({ error: `Unsupported network: ${network}` });
      }

      // Fetch token metadata using Alchemy SDK
      const metadata = await alchemy.core.getTokenMetadata(contractAddress);

      res.json({
        jsonrpc: '2.0',
        id: 1,
        result: metadata
      });
      
    } catch (error) {
      console.error('Error fetching token metadata:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch token metadata',
        message: error.message 
      });
    }
  }
}

export default new AlchemyController();