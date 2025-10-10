import express from 'express';
import { getPluginManifests } from './registry.js';

// Route wrappers per plugin (co-located in each plugin folder)
import coingeckoRoutes from './coingecko/routes.js';
import coinstatsRoutes from './coinstats/routes.js';
import zeroxRoutes from './zerox/routes.js';
import okxRoutes from './okx/routes.js';
import toncenterRoutes from './toncenter/routes.js';
import lurkyRoutes from './lurky/routes.js';
import chainbaseRoutes from './chainbase/routes.js';
import protokolsRoutes from './protokols/routes.js';
import changenowRoutes from './changenow/routes.js';
import alchemyRoutes from './alchemy/routes.js';
import twitterRoutes from './twitter/routes.js';
import icpRoutes from './icp/routes.js';
import binanceRoutes from './binance/routes.js';

const router = express.Router();

const routesMap = {
  coingecko: coingeckoRoutes,
  coinstats: coinstatsRoutes,
  zerox: zeroxRoutes,
  okx: okxRoutes,
  toncenter: toncenterRoutes,
  lurky: lurkyRoutes,
  chainbase: chainbaseRoutes,
  protokols: protokolsRoutes,
  changenow: changenowRoutes,
  alchemy: alchemyRoutes,
  twitter: twitterRoutes,
  icp: icpRoutes,
  binance: binanceRoutes
};

router.get('/plugins', (req, res) => {
  const plugins = getPluginManifests().map(p => ({
    name: p.name,
    version: p.version,
    description: p.description,
    routesBase: p.routesBase,
    enabled: p.enabled !== false
  }));
  res.json({ success: true, plugins });
});

for (const manifest of getPluginManifests()) {
  const name = manifest.name;
  const base = (manifest.routesBase || `/${name}`).replace(/^\/api/, '');
  const r = routesMap[name];
  if (r) router.use(base, r);
}

export default router;


