// scripts/checkUsers.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const run = async () => {
  const db = await open({
    filename: 'novo.db',
    driver: sqlite3.Database
  });

  const users = await db.all('SELECT id, username, role, password FROM users');
  console.log('👥 Users:', users);
};

run();
