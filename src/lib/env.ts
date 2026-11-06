import 'server-only';

// Reads the first non-empty variable. The REACT_APP_ names are the ones the old
// CRA build used, so existing local and Netlify settings keep working.
function read(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function required(label: string, ...names: string[]): string {
  const value = read(...names);
  if (!value) throw new Error(`Missing env var ${label} (looked for ${names.join(', ')})`);
  return value;
}

export const env = {
  get sanityProjectId() {
    return required('Sanity project id', 'SANITY_PROJECT_ID', 'REACT_APP_SANITY_PROJECT_ID');
  },
  get sanityDataset() {
    return read('SANITY_DATASET') ?? 'production';
  },
  // Server only. Never import this module from a client component.
  get sanityWriteToken() {
    return required('Sanity write token', 'SANITY_WRITE_TOKEN', 'REACT_APP_SANITY_EDITOR_TOKEN');
  },
  get googleClientId() {
    return required('Google client id', 'GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_API_TOKEN');
  },
  get adminSub() {
    return read('ADMIN_SUB', 'REACT_APP_ADM_TOKEN');
  },
  get sessionSecret() {
    const secret = required('session secret', 'SESSION_SECRET');
    if (secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
    return new TextEncoder().encode(secret);
  },
};
