import db from '../persistence/db.js';

const user = {
  getUser: async (hash) => {
    const foundUser = await db.getUser(hash);
    return foundUser;
  }, 

  putUser: async (newUser) => {
    const userToReturn = await db.putUser(newUser);

    return userToReturn;
  },

  saveUser: async (userToUpdate) => {
    const updatedUser = await db.saveUser(userToUpdate);

    return updatedUser;
  },

  updateHash: async (appHash, oldHash, newHash) => {
    const updatedUser = db.updateHash(appHash, oldHash, newHash);
    return updatedUser;
  },
  
  deleteUser: async (hash) => {
    return (await db.deleteUser(hash));
  }
};

export default user;
