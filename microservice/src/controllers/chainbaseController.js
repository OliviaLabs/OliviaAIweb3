import chainbaseService from '../services/chainbaseService.js';

class ChainbaseController {
  // Get latest block number
  async getLatestBlock(req, res) {
    try {
      const { chainId } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID is required'
        });
      }

      const data = await chainbaseService.getLatestBlockNumber(chainId);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch latest block',
        details: error.message
      });
    }
  }

  // Get transactions
  async getTransactions(req, res) {
    try {
      const { chainId, address, limit } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID is required'
        });
      }

      const data = await chainbaseService.getTransactions(chainId, address, limit);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions',
        details: error.message
      });
    }
  }

  // Get token price
  async getTokenPrice(req, res) {
    try {
      const { chainId, contractAddress } = req.query;
      
      if (!chainId || !contractAddress) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID and contract address are required'
        });
      }

      const data = await chainbaseService.getTokenPrice(chainId, contractAddress);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch token price',
        details: error.message
      });
    }
  }

  // Get supported chains
  async getSupportedChains(req, res) {
    try {
      const data = await chainbaseService.getSupportedChains();
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch supported chains',
        details: error.message
      });
    }
  }

  // Get network statistics
  async getNetworkStats(req, res) {
    try {
      const { chainId } = req.params;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID is required'
        });
      }

      const data = await chainbaseService.getNetworkStats(chainId);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch network statistics',
        details: error.message
      });
    }
  }

  // Get account balance
  async getAccountBalance(req, res) {
    try {
      const { chainId, address } = req.params;
      
      if (!chainId || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID and address are required'
        });
      }

      const data = await chainbaseService.getAccountBalance(chainId, address);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch account balance',
        details: error.message
      });
    }
  }

  // Get NFT data
  async getNFTData(req, res) {
    try {
      const { chainId, contractAddress, limit } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID is required'
        });
      }

      const data = await chainbaseService.getNFTData(chainId, contractAddress, limit);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch NFT data',
        details: error.message
      });
    }
  }

  // Get DeFi data
  async getDeFiData(req, res) {
    try {
      const { chainId, protocol } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Chain ID is required'
        });
      }

      const data = await chainbaseService.getDeFiData(chainId, protocol);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch DeFi data',
        details: error.message
      });
    }
  }

  // Get cross-chain data
  async getCrossChainData(req, res) {
    try {
      const { fromChainId, toChainId } = req.query;
      
      if (!fromChainId || !toChainId) {
        return res.status(400).json({
          success: false,
          error: 'From Chain ID and To Chain ID are required'
        });
      }

      const data = await chainbaseService.getCrossChainData(fromChainId, toChainId);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Chainbase Controller Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cross-chain data',
        details: error.message
      });
    }
  }
}

export default new ChainbaseController();
