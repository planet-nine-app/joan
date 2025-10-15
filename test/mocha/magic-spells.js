import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import fount from 'fount-js';
import { createHash } from 'crypto';

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.fount.allyabase.com/` : 'http://127.0.0.1:3006/';
fount.baseURL = baseURL;

const hash = createHash('sha256');
const hash2 = createHash('sha256');

hash.update('magic-test@foo.bar:PASSWORD');
hash2.update('magic-test@foo.bar:NEWPASSWORD');

const digest = hash.digest('hex');
const digest2 = hash2.digest('hex');

let savedUser = {};
let keys = {};
let fountUser = {};

describe('Joan MAGIC Spell Tests', () => {

  before(async () => {
    // Generate keys for testing
    keys = await sessionless.generateKeys(() => { return keys; }, () => { return keys; });

    // Create fount user for spell casting
    fountUser = await fount.createUser(() => keys, () => keys);
    console.log('Created fount user:', fountUser.uuid);
  });

  it('should create user via joanUserCreate spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'joanUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 0,
      components: {
        pubKey: keys.pubKey,
        hash: digest
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('joanUserCreate', spell);

    console.log('joanUserCreate result:', result);

    result.should.have.property('success', true);
    result.should.have.property('user');
    result.user.should.have.property('uuid');
    result.user.uuid.length.should.equal(36);

    savedUser = result.user;
  });

  it('should update hash via joanUserUpdateHash spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'joanUserUpdateHash',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 1,
      components: {
        uuid: savedUser.uuid,
        hash: digest,
        newHash: digest2
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('joanUserUpdateHash', spell);

    console.log('joanUserUpdateHash result:', result);

    result.should.have.property('success', true);
    result.should.have.property('user');
    result.user.should.have.property('hash', digest2);
  });

  it('should delete user via joanUserDelete spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'joanUserDelete',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 2,
      components: {
        uuid: savedUser.uuid,
        hash: digest2
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('joanUserDelete', spell);

    console.log('joanUserDelete result:', result);

    result.should.have.property('success', true);
  });

  it('should fail to create user with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'joanUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 3,
      components: {
        // Missing pubKey and hash
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('joanUserCreate', spell);

    console.log('joanUserCreate (missing fields) result:', result);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to update non-existent user', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'joanUserUpdateHash',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 4,
      components: {
        uuid: 'non-existent-uuid',
        hash: 'non-existent-hash',
        newHash: digest2
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('joanUserUpdateHash', spell);

    console.log('joanUserUpdateHash (non-existent) result:', result);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

});
