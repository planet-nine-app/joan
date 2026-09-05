import sessionless from 'sessionless-node';
  
// esbuild's CJS output target (used by Netlify's function bundler) doesn't
// support top-level await, so the client is now a lazily-resolved promise -
// call sites now do `(await client).get(...)` instead of `client.get(...)`.
const client = (async () => {
  const { createClient } = process.env.PERSISTENCE_BACKEND === 'netlify-blobs'
    ? await import('./client.netlify-blobs.js')
    : await import('./client.js');

  return createClient()
    .on('error', err => console.log('Redis Client Error', err))
    .connect();
})();
    
const db = {
  getUser: async (hash) => {
    const user = await (await client).get(`user:${hash}`);
    const parsedUser = JSON.parse(user);
    return parsedUser; 
  },

  putUser: async (user) => {
    const uuid = sessionless.generateUUID();
    user.uuid = uuid;
    await (await client).set(`user:${user.hash}`, JSON.stringify(user));
    const userToReturn = JSON.parse(JSON.stringify(user));
    return userToReturn;
  },

  saveUser: async (user) => {
    await (await client).set(`user:${user.hash}`, JSON.stringify(user));
    const userToReturn = JSON.parse(JSON.stringify(user));
    return userToReturn;
  },

  updateHash: async (oldHash, newHash) => {
    const user = await db.getUser(oldHash);
    user.hash = newHash;
    const updatedUser = await db.putUser(user);
    await db.deleteUser(oldHash);
    return updatedUser;
  },

  deleteUser: async (hash) => {
    const resp = await (await client).del(`user:${hash}`);

    return true;
  },

  saveKeys: async (keys) => {
    await (await client).set(`keys`, JSON.stringify(keys));
  },

  getKeys: async () => {
    const keyString = await (await client).get('keys');
    return JSON.parse(keyString);
  }

};

export default db;
