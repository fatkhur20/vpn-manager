import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// The key used to store the full proxy list in the KV namespace.
const KV_PROXIES_KEY = 'all_proxies_list';

// Main event listener for all incoming requests.
addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});

/**
 * Routes incoming requests to either the API handler or the static asset handler.
 * @param {FetchEvent} event The fetch event
 */
async function handleEvent(event) {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(event.request);
  }
  return handleStaticAssetRequest(event);
}

/**
 * Handles all requests to /api/ routes.
 * @param {Request} request The incoming request
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // We only have one API route for now: /api/proxies
  if (url.pathname !== '/api/proxies') {
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ensure the KV namespace is bound and available.
  if (typeof PROXY_STATUS === 'undefined') {
    return new Response(JSON.stringify({ error: 'KV Namespace is not bound. Please check your wrangler.toml configuration.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle GET requests to fetch proxy data from KV.
  if (request.method === 'GET') {
    const proxiesJson = await PROXY_STATUS.get(KV_PROXIES_KEY);
    if (proxiesJson === null) {
      // If no data exists in KV yet, return an empty array.
      return new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(proxiesJson, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle POST requests to update the proxy data in KV.
  if (request.method === 'POST') {
    try {
      const updatedProxies = await request.json();
      // Overwrite the entire list in KV with the new data from the client.
      await PROXY_STATUS.put(KV_PROXIES_KEY, JSON.stringify(updatedProxies));
      return new Response(JSON.stringify({ success: true, message: 'Proxies updated successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: `Failed to parse or update proxies: ${e.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Disallow other HTTP methods.
  return new Response('Method Not Allowed', { status: 405 });
}

/**
 * Serves static assets (HTML, CSS, JS) from the KV namespace.
 * This is the default handler for any request that is not an API call.
 * @param {FetchEvent} event The fetch event
 */
async function handleStaticAssetRequest(event) {
  try {
    return await getAssetFromKV(event, {
      // Caching options can be configured here if needed.
    });
  } catch (e) {
    // If an asset is not found, attempt to serve the 404.html page.
    try {
      let notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
      });
      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
    } catch (e) {}

    return new Response('Not Found', { status: 404 });
  }
}
