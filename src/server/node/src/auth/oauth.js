import { createHash, randomBytes } from 'node:crypto';

// In-memory state storage (use Redis/BDO for production)
const oauthStateStore = new Map();
const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// GitHub OAuth configuration
const getGitHubConfig = () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3004/auth/github/callback',
  scope: 'read:user user:email'
});

// Generate secure random state for CSRF protection
const generateState = () => {
  return randomBytes(32).toString('hex');
};

// Initiate GitHub OAuth flow
export const initiateGitHubOAuth = (redirectUrl) => {
  const config = getGitHubConfig();

  if (!config.clientId) {
    throw new Error('GITHUB_CLIENT_ID not configured');
  }

  // Generate and store state
  const state = generateState();
  const expiresAt = Date.now() + STATE_EXPIRY;
  oauthStateStore.set(state, { redirectUrl, expiresAt });

  // Build GitHub authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);

  return { authUrl: authUrl.toString(), state };
};

// Exchange code for access token
export const exchangeGitHubCode = async (code, state) => {
  const config = getGitHubConfig();

  // Verify state
  const storedState = oauthStateStore.get(state);
  if (!storedState) {
    throw new Error('Invalid or expired state parameter');
  }

  if (Date.now() > storedState.expiresAt) {
    oauthStateStore.delete(state);
    throw new Error('State expired');
  }

  // Clean up state
  oauthStateStore.delete(state);

  // Exchange code for token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error);
  }

  return {
    accessToken: tokenData.access_token,
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
    redirectUrl: storedState.redirectUrl
  };
};

// Fetch GitHub user info
export const getGitHubUser = async (accessToken) => {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Joan-Auth'
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user');
  }

  const userData = await userResponse.json();

  // Fetch primary email
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Joan-Auth'
    }
  });

  let primaryEmail = null;
  if (emailResponse.ok) {
    const emails = await emailResponse.json();
    const primary = emails.find(e => e.primary && e.verified);
    primaryEmail = primary?.email || emails[0]?.email;
  }

  return {
    githubId: userData.id,
    githubUsername: userData.login,
    githubName: userData.name,
    githubEmail: primaryEmail,
    githubAvatarUrl: userData.avatar_url,
    githubBio: userData.bio,
    githubLocation: userData.location,
    githubBlog: userData.blog,
    githubPublicRepos: userData.public_repos,
    githubFollowers: userData.followers,
    githubFollowing: userData.following,
    githubCreatedAt: userData.created_at
  };
};

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (now > data.expiresAt) {
      oauthStateStore.delete(state);
    }
  }
}, 60000); // Clean up every minute

export default { initiateGitHubOAuth, exchangeGitHubCode, getGitHubUser };
