import sessionless from 'sessionless-node';
import fetch from 'node-fetch';

const get = async (url) => {
  return await fetch(url);
};

const post = async (url, payload) => {
  return await fetch(url, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
};

const put = async (url, payload) => {
  return await fetch(url, {
    method: 'put',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
};

const _delete = async (url, payload) => {
  return await fetch(url, {
    method: 'delete',
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'}
  });
};

const joan = {
  baseURL: 'https://dev.joan.allyabase.com/',

  createUser: async (appHash, userHash, saveKeys, getKeys) => {
    const keys = (await getKeys()) || (await sessionless.generateKeys(saveKeys, getKeys))
    sessionless.getKeys = getKeys;

    const payload = {
      timestamp: new Date().getTime() + '',
      pubKey: keys.pubKey,
      appHash,
      userHash
    };

    payload.signature = await sessionless.sign(payload.timestamp + payload.hash + payload.pubKey);

    const res = await put(`${joan.baseURL}user/create`, payload);
    const user = await res.json();
    const uuid = user.uuid;

    return uuid;
  },

  reenter: async (appHash, userHash, saveKeys, getKeys) => {
    const keys = await sessionless.generateKeys(saveKeys, getKeys);
    const newPubKey = keys.pubKey;

    const timestamp = new Date().getTime() + '';

    const signature = await sessionless.sign(timestamp + hash + newPubKey);

    const res = await get(`${joan.baseURL}user/userHash/${userHash}/appHash/${appHash}?timestamp=${timestamp}&pubKey=${newPubKey}&signature=${signature}`);
    const user = await res.json();
console.log(user);
    
    return user;
  },

  updateHash: async (uuid, appHash, userHash, newHash) => {
    const timestamp = new Date().getTime() + '';

    const signature = await sessionless.sign(timestamp + uuid + hash + newHash);
    const payload = {timestamp, uuid, appHash, userHash, newHash, signature};


    const res = await put(`${joan.baseURL}user/update-hash`, payload);
    return res.status === 202;
  },

  deleteUser: async (uuid, appHash) => {
    const timestamp = new Date().getTime() + '';

    const signature = await sessionless.sign(timestamp + uuid + hash);
    const payload = {timestamp, uuid, appHash, signature};

    const res = await _delete(`${joan.baseURL}user/${uuid}/delete/appHash/${appHash}`, payload);
    return res.status === 200;
  }
};

export default joan;
