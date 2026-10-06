import mongoose from 'mongoose';
import argon2 from 'argon2';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await argon2.hash('Password123!', { type: argon2.argon2id });
  
  // 1. Upsert Super Admin for shiv@embtelsolutions.com
  const res1 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'shiv@embtelsolutions.com' },
    {
      $set: {
        name: 'Shivraj Singh',
        username: 'shivraj',
        email: 'shiv@embtelsolutions.com',
        phone: '+91 9876543210',
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        avatar: '',
        status: 'ACTIVE',
        permissions: ['*'],
        passwordHistory: [hash],
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0,
        twoFactorEnabled: false,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Upserted shiv in users:', res1.upsertedId || 'updated');

  // 2. Ensure admin@arriveatorigin.com has Password123!
  const res2 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@arriveatorigin.com' },
    {
      $set: {
        passwordHash: hash,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        lockUntil: null,
        lockoutUntil: null,
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated admin@arriveatorigin.com in users:', res2.modifiedCount);

  // 3. Update customer shiv@embtelsolutions.com passwordHash to Password123!
  const res3 = await mongoose.connection.db.collection('customers').updateOne(
    { email: 'shiv@embtelsolutions.com' },
    {
      $set: {
        passwordHash: hash,
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated shiv in customers:', res3.modifiedCount);

  // 4. Update customer admin@arriveatorigin.com passwordHash to Password123!
  const res4 = await mongoose.connection.db.collection('customers').updateOne(
    { email: 'admin@arriveatorigin.com' },
    {
      $set: {
        passwordHash: hash,
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated admin in customers:', res4.modifiedCount);

  // Test logins for both users via argon2
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  for (const u of users) {
    const ok = await argon2.verify(u.passwordHash, 'Password123!');
    console.log(`User ${u.email} (${u.role}) -> Password123! valid:`, ok);
  }

  await mongoose.disconnect();
}
seed().catch(console.error);
