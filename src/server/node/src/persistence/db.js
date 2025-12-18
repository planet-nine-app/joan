import { createClient } from './client.js';
import sessionless from 'sessionless-node';
  
const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();
    
const db = {
  getUserByUserHash: async (appHash, userHash) => {
    const user = await client.get(`user:${appHash}:${userHash}`);
    const parsedUser = JSON.parse(user);
    return parsedUser; 
  },

  getUserByUserUUID: async (appHash, uuid) => {
    const userPath = await client.get(`user:${user.uuid}`);
    const userString = await client.get(userPath);
    const parsedUser = JSON.parse(user);
    return parsedUser;
  },

  putUser: async (user) => {
    const uuid = sessionless.generateUUID();
    user.uuid = uuid;
    await client.set(`user:${user.appHash}:${user.userHash}`, JSON.stringify(user));
    await client.set(`user:${user.uuid}`, {user: `user:${user.appHash}:${user.userHash}`});
    const userToReturn = JSON.parse(JSON.stringify(user));
    return userToReturn;
  },

  saveUser: async (user) => {
    await client.set(`user:${user.appHash}:${user.userHash}`, JSON.stringify(user));
    const userToReturn = JSON.parse(JSON.stringify(user));
    return userToReturn;
  },

  updateHash: async (appHash, oldHash, newHash) => {
    const user = await db.getUser(appHash, oldHash);
    user.userHash = newHash;
    const updatedUser = await db.saveUser(user);
    await db.deleteUser(appHash, user.uuid);
    return updatedUser;
  },

  deleteUser: async (appHash, uuid) => {
    const user = db.getUserByUUID(appHash, uuid);
    const uuidGone = await client.del(`user:${user.uuid}`);
    const userGone = await client.del(`user:${user.appHash}:${user.userHash}`);

    return uuidGone && userGone;
  },

  saveKeys: async (keys) => {
    await client.set(`keys`, JSON.stringify(keys));
  },

  getKeys: async () => {
    const keyString = await client.get('keys');
    return JSON.parse(keyString);
  }

};

export default db;
