(() => {
  const { url, publishableKey, usernameAuthUrl } = window.studyMateSupabaseConfig || {};
  if (!url || !publishableKey || !window.supabase) return;
  const client = window.supabase.createClient(url, publishableKey, { auth: { detectSessionInUrl: false } });
  const authFragment = new URLSearchParams(location.hash.slice(1));
  if (authFragment.has('access_token') || authFragment.has('error_code')) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }

  function checked({ data, error }) {
    if (error) throw error;
    return data;
  }

  const plans = client.from('studymate_plans');
  const items = client.from('studymate_items');
  const profiles = client.from('studymate_profiles');
  const attachments = client.storage.from('studymate-attachments');

  window.studyMatePlans = {
    async list() {
      return checked(await plans.select().order('id', { ascending: false }));
    },
    async create(plan, file) {
      if (file) {
        const { user } = checked(await client.auth.getUser());
        const path = user.id + '/' + crypto.randomUUID();
        checked(await attachments.upload(path, file, {contentType: 'application/octet-stream'}));
        plan.attachment_path = path;
      }
      return checked(await plans.insert(plan).select().single());
    },
    async update(id, changes) {
      return checked(await plans.update(changes).eq('id', id).select().single());
    },
    async download(path) {
      return checked(await attachments.download(path));
    }
  };

  async function authenticate(action, credentials) {
    const response = await fetch(usernameAuthUrl || url + '/functions/v1/username-auth', {
      method: 'POST',
      headers: {apikey: publishableKey, 'Content-Type': 'application/json'},
      body: JSON.stringify({action, ...credentials}),
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error('Authentication failed'), {code: data.code});
    return data;
  }

  window.studyMateData = {
    async session() {
      return checked(await client.auth.getSession()).session;
    },
    async guest() {
      return checked(await client.auth.signInAnonymously()).user;
    },
    async signup(username, password, profile) {
      await authenticate('signup', {username, password, ...profile});
    },
    async login(username, password) {
      const {access_token, refresh_token} = await authenticate('login', {username, password});
      return checked(await client.auth.setSession({access_token, refresh_token})).user;
    },
    async logout() {
      checked(await client.auth.signOut({ scope: 'local' }));
    },
    async profile(user) {
      const existing = checked(await profiles.select().eq('owner_id', user.id).maybeSingle());
      if (existing) return existing;
      const { display_name, school_name, school_type } = user.user_metadata || {};
      return this.saveProfile(user.id, {
        display_name: String(display_name || '스터디메이트').slice(0, 60),
        school_name: String(school_name || '소속 미입력'),
        school_type: String(school_type || '자율학습')
      });
    },
    async saveProfile(owner_id, fields) {
      return checked(await profiles.upsert({ owner_id, ...fields }).select().single());
    },
    async items() {
      return checked(await items.select('kind,item_id,data').order('item_id', { ascending: false }));
    },
    async saveItem(owner_id, kind, item) {
      checked(await items.upsert({ owner_id, kind, item_id: item.id, data: item }));
    },
    async rpc(name, args) {
      return checked(await client.rpc('studymate_' + name, args));
    }
  };
})();
