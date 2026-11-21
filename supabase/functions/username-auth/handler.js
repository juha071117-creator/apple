const encoder = new TextEncoder();

async function digest(key, value) {
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createUsernameHandler({exchange, origins, namespace, secret}) {
  const signingKey = crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );

  return async (request) => {
    const origin = request.headers.get('origin');
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Vary': 'Origin'
    });
    if (origin && origins.has(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Headers', 'content-type, apikey');
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    const reply = (status, data) => Response.json(data, {status, headers});
    if (origin && !origins.has(origin)) return reply(403, {code: 'invalid_origin'});
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    if (request.method !== 'POST') return reply(405, {code: 'invalid_method'});

    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400, {code: 'invalid_input'});
      const chunks = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          void reader.cancel();
          return reply(413, {code: 'invalid_input'});
        }
        chunks.push(value);
      }
      let input;
      try { input = JSON.parse(await new Blob(chunks).text()); }
      catch { return reply(400, {code: 'invalid_input'}); }
      const { action, password } = input ?? {};
      const displayName = typeof input?.username === 'string' ? input.username.trim().normalize('NFKC') : '';
      const username = displayName.toLowerCase();
      if (!['signup', 'login'].includes(action) || !/^[a-z0-9가-힣_.-]{3,60}$/u.test(username) ||
          typeof password !== 'string' || !password || encoder.encode(password).length > 72) {
        return reply(400, {code: 'invalid_input'});
      }
      if (action === 'signup' && password.length < 8) return reply(400, {code: 'weak_password'});

      const key = await signingKey;
      const accountHash = await digest(key, 'username:' + username);
      for (const [scope, max] of [
        ['global', 150], [action + ':' + accountHash, action === 'signup' ? 3 : 8]
      ]) {
        const limit = await exchange('/rest/v1/rpc/studymate_take_auth_attempt',
          {input_scope: scope, max_attempts: max}, true);
        if (!limit.ok) return reply(503, {code: 'auth_unavailable'});
        if (limit.data !== true) return reply(429, {code: 'auth_rate_limit'});
      }

      const legacy = await exchange('/rest/v1/rpc/studymate_legacy_identity',
        {input_username: username}, true);
      if (!legacy.ok) return reply(503, {code: 'auth_unavailable'});
      const alias = legacy.data[0];
      const email = alias?.login_email || accountHash.slice(0, 56) + '@' + namespace;
      if (action === 'signup') {
        if (alias?.reserved) return reply(409, {code: 'username_taken'});
        if (typeof input.schoolName !== 'string' || input.schoolName.length > 120 ||
            !['대학교', '고등학교', '중학교', '자격증/취준', 'N수생/수능', '자율학습'].includes(input.schoolType)) {
          return reply(400, {code: 'invalid_input'});
        }
        const claim = {input_hash: accountHash, input_claim: crypto.randomUUID()};
        const reservation = await exchange('/rest/v1/rpc/studymate_reserve_signup', claim, true);
        if (!reservation.ok) return reply(503, {code: 'auth_unavailable'});
        if (reservation.data !== true) return reply(409, {code: 'username_taken'});

        try {
          const created = await exchange('/auth/v1/admin/users', {
            email, password, email_confirm: true,
            user_metadata: {display_name: displayName, school_name: input.schoolName.trim() || '소속 미입력',
              school_type: input.schoolType}
          }, true);
          if (!created.ok) {
            const code = created.data?.error_code || created.data?.code;
            if (code === 'email_exists' || code === 'user_already_exists') return reply(409, {code: 'username_taken'});
            if (code === 'weak_password') return reply(400, {code});
            return reply(503, {code: 'auth_unavailable'});
          }
          return reply(201, {created: true});
        } finally {
          await exchange('/rest/v1/rpc/studymate_release_signup', claim, true).catch(() => {});
        }
      }
      if (alias && !alias.login_email) return reply(401, {code: 'invalid_credentials'});
      const result = await exchange('/auth/v1/token?grant_type=password', {email, password});
      if (!result.ok) {
        if (result.status === 429) return reply(429, {code: 'auth_rate_limit'});
        if (result.status >= 500) return reply(503, {code: 'auth_unavailable'});
        return reply(401, {code: 'invalid_credentials'});
      }
      return reply(200, {access_token: result.data.access_token, refresh_token: result.data.refresh_token});
    } catch {
      return reply(503, {code: 'auth_unavailable'});
    }
  };
}
