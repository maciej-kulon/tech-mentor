export const up = async (db) => {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
};

export const down = async (db) => {
  await db.collection('users').dropIndex('email_1');
};
