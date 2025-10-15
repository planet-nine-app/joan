import sessionless from 'sessionless-node';
import user from '../user/user.js';
import db from '../persistence/db.js';

sessionless.generateKeys(() => {}, db.getKeys);

const fountURL = 'http://localhost:3006/';

const MAGIC = {
  joinup: async (spell) => {
console.log(spell);
    const spellName = spell.spell;
    const gateway = await MAGIC.gatewayForSpell(spellName);
    spell.gateways.push(gateway);

    const joan = await db.getUser('joan');
    const spellbooks = joan.spellbooks;
    const spellbook = spellbooks.filter(spellbook => spellbook[spellName]).pop();
    if(!spellbook) {
console.log('spellbooks', spellbooks);
      throw new Error('spellbook not found');
    }

    const spellEntry = spellbook[spellName];
    const currentIndex = spellEntry.destinations.indexOf(spellEntry.destinations.find(($) => $.stopName === 'joan'));
    const nextDestination = spellEntry.destinations[currentIndex + 1].stopURL + spellName;

console.log('nextDestination', nextDestination);

    const res = await MAGIC.forwardSpell(spell, nextDestination);
    const body = await res.json();
 
    if(!body.success) {
      return body;
    }

    const foundUser = await user.putUser(spell.user);
    if(!body.uuids) {
      body.uuids = [];
    }
    body.uuids.push({
      service: 'joan',
      uuid: foundUser.uuid
    });

    return body;
  },

  linkup: async (spell) => {
    const foundUser = await user.getUser(spell.casterUUID);

    if(coordinatingKeys.filter(keys => keys).length !== spell.gateways.length) {
      throw new Error('missing coordinating key');
    }

    const gateway = await MAGIC.gatewayForSpell(spell.spellName);
    gateway.coordinatingKey = {
      serviceURL: 'http://localhost:3004/', // Once hedy is built, this will be dynamic
      uuid: spell.casterUUID,
      pubKey: foundUser.pubKey
    };
    spell.gateways.push(gateway);

    const res = await MAGIC.forwardSpell(spell, fountURL);
    const body = await res.json();
    return body;
  },

  gatewayForSpell: async (spellName) => {
    const joan = await db.getUser('joan');
    const uuid = joan.fountUUID;
    const ordinal = joan.ordinal;
    const gateway = {
      timestamp: new Date().getTime() + '',
      uuid, 
      minimumCost: 20,
      ordinal
    };      

    const message = gateway.timestamp + gateway.uuid + gateway.minimumCost + gateway.ordinal;

    gateway.signature = await sessionless.sign(message);

    return gateway;
  },

  forwardSpell: async (spell, destination) => {
console.log('forwarding spell to: ', destination);
    return await fetch(destination, {
      method: 'post',
      body: JSON.stringify(spell),
      headers: {'Content-Type': 'application/json'}
    });
  },

  // 🪄 MAGIC-ROUTED ENDPOINTS (No auth needed - resolver authorizes)

  joanUserCreate: async (spell) => {
    try {
      const { pubKey, hash } = spell.components;

      if (!pubKey || !hash) {
        return {
          success: false,
          error: 'Missing required fields: pubKey, hash'
        };
      }

      const userToPut = { pubKey, hash };
      const foundUser = await user.putUser(userToPut);

      return {
        success: true,
        user: foundUser
      };
    } catch (err) {
      console.error('joanUserCreate error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  joanUserUpdateHash: async (spell) => {
    try {
      const { uuid, hash, newHash } = spell.components;

      if (!uuid || !hash || !newHash) {
        return {
          success: false,
          error: 'Missing required fields: uuid, hash, newHash'
        };
      }

      // Verify user exists
      const foundUser = await user.getUser(hash);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const updatedUser = await user.updateHash(hash, newHash);

      return {
        success: true,
        user: updatedUser
      };
    } catch (err) {
      console.error('joanUserUpdateHash error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  joanUserDelete: async (spell) => {
    try {
      const { uuid, hash } = spell.components;

      if (!uuid || !hash) {
        return {
          success: false,
          error: 'Missing required fields: uuid, hash'
        };
      }

      // Verify user exists
      const foundUser = await user.getUser(hash);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const success = await user.deleteUser(hash);

      return {
        success: success
      };
    } catch (err) {
      console.error('joanUserDelete error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
};

export default MAGIC;
