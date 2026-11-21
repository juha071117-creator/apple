import {createUsernameHandler} from './handler.js';

const url = Deno.env.get('SUPABASE_URL');
const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
const origins = new Set((Deno.env.get('STUDYMATE_AUTH_ORIGINS') || 'http://127.0.0.1:4183').split(',').map(origin => origin.trim()).filter(Boolean));
const projectHost = url && new URL(url).hostname;
const namespace = Deno.env.get('STUDYMATE_AUTH_NAMESPACE') || 'users.' + projectHost;
if (!url || !adminKey || !publicKey || !origins.size ||
    !/^users\.[a-z0-9]{20}\.supabase\.co$/.test(namespace)) {
  throw new Error('Missing username-auth configuration');
}

async function exchange(path, data, elevated) {
  const key = elevated ? adminKey : publicKey;
  const response = await fetch(url + path, {
    method: 'POST',
    headers: {apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json'},
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000)
  });
  return {ok: response.ok, status: response.status, data: await response.json()};
}

let pendingHandler;
async function loadHandler() {
  const secret = await exchange('/rest/v1/rpc/studymate_username_key', {}, true);
  if (!secret.ok || typeof secret.data !== 'string' || secret.data.length < 32) {
    throw new Error('Username key unavailable');
  }
  return createUsernameHandler({secret: secret.data, origins, namespace, exchange});
}

Deno.serve(async request => {
  pendingHandler ??= loadHandler().catch(error => {
    pendingHandler = undefined;
    throw error;
  });
  try {
    return await (await pendingHandler)(request);
  } catch {
    return Response.json({code: 'auth_unavailable'}, {status: 503});
  }
});
