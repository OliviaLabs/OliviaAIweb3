(() => {
  try {
    if (typeof window === 'undefined') return;
    if (import.meta.env.PROD) return;

    const allowedPath = '/api/openai/multi-agent';
    const sameOriginApi = /^\/?api\//; // allow any same-origin /api/* during migration
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = (init?.method || 'GET').toUpperCase();

      const isHealth = /\/api\/health$/.test(url);
      const isAllowed = (method === 'POST' && url.includes(allowedPath)) || sameOriginApi.test(url.replace(/^https?:\/\/[\w.:\-]+\/?/, ''));

      if (!isAllowed && !isHealth) {
        console.error('NetworkGuard blocked frontend call:', { method, url });
        throw new Error(`Frontend must use backend /api/* only (no external APIs). Blocked: ${method} ${url}`);
      }
      return originalFetch(input, init);
    };

    if (window.axios?.interceptors?.request) {
      window.axios.interceptors.request.use((config) => {
        const url = config.url || '';
        const method = (config.method || 'get').toUpperCase();
        const isHealth = /\/api\/health$/.test(url);
        const isAllowed = (method === 'POST' && url.includes(allowedPath)) || sameOriginApi.test(url.replace(/^https?:\/\/[\w.:\-]+\/?/, ''));
        if (!isAllowed && !isHealth) {
          throw new Error(`Frontend must use backend /api/* only (no external APIs). Blocked: ${method} ${url}`);
        }
        return config;
      });
    }

    console.log('🛡️ NetworkGuard active: enforcing backend-only API policy');
  } catch {}
})();


