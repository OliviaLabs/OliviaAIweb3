// Central plugin registry

import coingecko from './coingecko/manifest.js';
import coinstats from './coinstats/manifest.js';
import zerox from './zerox/manifest.js';
import okx from './okx/manifest.js';
import toncenter from './toncenter/manifest.js';
import lurky from './lurky/manifest.js';
import chainbase from './chainbase/manifest.js';
import protokols from './protokols/manifest.js';
import changenow from './changenow/manifest.js';
import alchemy from './alchemy/manifest.js';
import twitter from './twitter/manifest.js';
import icp from './icp/manifest.js';

const manifests = [
  coingecko,
  coinstats,
  zerox,
  okx,
  toncenter,
  lurky,
  chainbase,
  protokols,
  changenow,
  alchemy,
  twitter,
  icp
];

export const getPluginManifests = () => manifests.filter(p => p.enabled !== false);


