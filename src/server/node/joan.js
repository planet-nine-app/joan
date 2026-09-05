import config from './config/local.js';
import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import user from './src/user/user.js';
import MAGIC from './src/magic/magic.js';
import fount from 'fount-js';
import bdo from 'bdo-js';
import sessionless from 'sessionless-node';
import db from './src/persistence/db.js';
import { sendOTP, verifyOTP } from './src/auth/otp.js';
import { initiateGitHubOAuth, exchangeGitHubCode, getGitHubUser } from './src/auth/oauth.js';

const app = express();
app.use(cors());
app.use(express.json());

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
fount.baseURL = process.env.LOCALHOST ? 'http://localhost:3006/' : `${SUBDOMAIN}.fount.allyabase.com/`;
bdo.baseURL = process.env.LOCALHOST ? 'http://localhost:3003/' : `${SUBDOMAIN}.bdo.allyabase.com/`;

const bdoHashInput = `${SUBDOMAIN}continuebee`;

const bdoHash = createHash('sha256').update(bdoHashInput).digest('hex');

const repeat = (func) => {
  setTimeout(func, 2000);
};

const bootstrap = async () => {
  try {
    const fountUser = await fount.createUser(db.saveKeys, db.getKeys);
    const bdoUUID = await bdo.createUser(bdoHash, {}, () => {}, db.getKeys);
console.log(bdoUUID);
    const spellbooks = await bdo.getSpellbooks(bdoUUID, bdoHash);
    const joan = {
      uuid: 'joan',
      hash: 'joan',
      fountUUID: fountUser.uuid,
      fountPubKey: fountUser.pubKey,
      bdoUUID,
      ordinal: 0,
      spellbooks
    };

    if(!joan.fountUUID || !joan.bdoUUID || !spellbooks) {
      throw new Error('bootstrap failed');
    }

    await db.saveUser(joan);
  } catch(err) {
    repeat(bootstrap);
  }
};

repeat(bootstrap);

app.use((req, res, next) => {
  const requestTime = +req.query.timestamp || +req.body.timestamp;
  const now = new Date().getTime();
  if(Math.abs(now - requestTime) > config.allowedTimeDifference) {
    return res.send({error: 'no time like the present'});
  }
  next();
});

// ========================================
// Authentication Endpoints (OTP + OAuth)
// ========================================

// Send OTP to email
app.post('/auth/email/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400);
      return res.send({ error: 'Valid email required' });
    }

    console.log(`Sending OTP to ${email}`);
    const result = await sendOTP(email);

    res.send({
      success: true,
      message: 'OTP sent to email',
      emailHash: result.emailHash
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500);
    res.send({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and create/return user
app.post('/auth/email/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      return res.send({ error: 'Email and OTP required' });
    }

    console.log(`Verifying OTP for ${email}`);
    const verifyResult = verifyOTP(email, otp);

    if (!verifyResult.valid) {
      res.status(403);
      return res.send({ error: verifyResult.error });
    }

    // Generate or retrieve Joan user for this email
    // Use email hash as the "hash" for Joan's user system
    const emailHash = verifyResult.emailHash;

    // Check if user exists
    let joanUser;
    try {
      joanUser = await user.getUser(emailHash);
      console.log('Existing user found:', joanUser);
    } catch (err) {
      // User doesn't exist, create new one
      console.log('Creating new user for email:', email);

      // Generate keys for the user
      const keys = sessionless.generateKeys(db.saveKeys, db.getKeys);

      const userToPut = {
        pubKey: keys.publicKey,
        hash: emailHash
      };

      joanUser = await user.putUser(userToPut);
      joanUser.privateKey = keys.privateKey; // Include private key for new users
    }

    res.send({
      success: true,
      userUUID: joanUser.uuid,
      pubKey: joanUser.pubKey,
      privateKey: joanUser.privateKey, // Only set for new users
      email
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500);
    res.send({ error: 'Failed to verify OTP' });
  }
});

// Initiate GitHub OAuth flow
app.get('/auth/github/initiate', async (req, res) => {
  try {
    const redirectUrl = req.query.redirectUrl || 'http://localhost:3004/auth-success';

    console.log('Initiating GitHub OAuth');
    const result = initiateGitHubOAuth(redirectUrl);

    // Redirect to GitHub
    res.redirect(result.authUrl);
  } catch (error) {
    console.error('GitHub OAuth initiate error:', error);
    res.status(500);
    res.send({ error: error.message });
  }
});

// GitHub OAuth callback
app.get('/auth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect('/?error=no_code_or_state');
    }

    console.log('GitHub OAuth callback received');

    // Exchange code for token
    const tokenResult = await exchangeGitHubCode(code, state);
    console.log('Token exchanged successfully');

    // Fetch GitHub user info
    const githubUser = await getGitHubUser(tokenResult.accessToken);
    console.log('GitHub user fetched:', githubUser.githubUsername);

    // Create hash from GitHub ID
    const githubHash = createHash('sha256')
      .update(`github:${githubUser.githubId}`)
      .digest('hex');

    // Check if user exists
    let joanUser;
    try {
      joanUser = await user.getUser(githubHash);
      console.log('Existing GitHub user found');
    } catch (err) {
      // User doesn't exist, create new one
      console.log('Creating new user for GitHub:', githubUser.githubUsername);

      const keys = sessionless.generateKeys(db.saveKeys, db.getKeys);

      const userToPut = {
        pubKey: keys.publicKey,
        hash: githubHash
      };

      joanUser = await user.putUser(userToPut);
      joanUser.privateKey = keys.privateKey;
    }

    // Build success redirect with user data
    const successUrl = new URL(tokenResult.redirectUrl);
    successUrl.searchParams.set('userUUID', joanUser.uuid);
    successUrl.searchParams.set('pubKey', joanUser.pubKey);
    if (joanUser.privateKey) {
      successUrl.searchParams.set('privateKey', joanUser.privateKey);
    }
    successUrl.searchParams.set('githubUsername', githubUser.githubUsername);
    successUrl.searchParams.set('githubId', githubUser.githubId);
    successUrl.searchParams.set('githubAvatar', githubUser.githubAvatarUrl || '');

    res.redirect(successUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

// ========================================
// Existing Joan Endpoints
// ========================================

app.put('/user/create', async (req, res) => {
console.log('got create user req');
  try {
    const body = req.body;
console.log(body);
    const pubKey = body.pubKey;
    const hash = body.hash;
    const message = body.timestamp + hash + pubKey;
console.log('joan verifying', message);

    const signature = req.body.signature;
   
    if(!signature || !sessionless.verifySignature(signature, message, pubKey)) {
console.log("auth error");
      res.status(403);
      return res.send({error: 'auth error'});
    }
console.log('putting user');
    const userToPut = {
      pubKey,
      hash
    };

    const foundUser = await user.putUser(userToPut);
console.log(foundUser);
    res.send(foundUser);
  } catch(err) {
    res.status(404);
    res.send({ error: 'Not Found' });
  }
});

app.get('/user/:hash/pubKey/:pubKey', async (req, res) => {
  try {
    const hash = req.params.hash;
    const pubKey = req.params.pubKey;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;
    const message = timestamp + hash + pubKey;
   
    const foundUser = await user.getUser(hash);

    if(!signature || !sessionless.verifySignature(signature, message, pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    foundUser.pubKey = pubKey;
    await user.saveUser(foundUser);

    res.send(foundUser);
  } catch(err) {
    res.status(404);
    res.send({ error: 'Not Found' });
  }
});

app.put('/user/:uuid/update-hash', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const body = req.body;
    const timestamp = body.timestamp;
    const hash = body.hash;
    const newHash = body.newHash;
    const signature = body.signature;
    const message = timestamp + uuid + hash + newHash;

    const foundUser = await user.getUser(hash);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const updatedUser = await user.updateHash(hash, newHash);

    res.status(202);
    res.send(updatedUser);
  } catch(err) {
    res.status(404);
    res.send({ error: 'Not Found' });
  }
});

app.post('/magic/spell/:spellName', async (req, res) => {
console.log('got spell req');
  try {
    const spellName = req.params.spellName;
    const spell = req.body;
    
    if(!MAGIC[spellName]) {
console.log('sending this back');
      res.status(404); 
      res.send({error: 'spell not found'});
    }
    
    let spellResp = {};
    spellResp = await MAGIC[spellName](spell);
console.log('spellResp', spellResp);
    res.status(spellResp.success ? 200 : 900);
    return res.send(spellResp);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.delete('/user/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const body = req.body;

console.log(body);
    const timestamp = body.timestamp;
    const hash = body.hash;
    const signature = body.signature;
    const message = timestamp + uuid + hash;
console.log("vars consted");

    const foundUser = await user.getUser(hash);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }
console.log('about to delete');
    const success = await user.deleteUser(hash);
console.log('success: ', success);
    res.send({ success });
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({ error: 'Not Found' });
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3004);

  console.log('server listening for credentials on port 3004');
}

export default app;
