import mysql from 'mysql2';

import dotenv from 'dotenv';
dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .promise();

export async function getUsers() {
  const [rows] = await pool.query('SELECT * FROM `user`');
  return rows;
}

export async function getUser(id) {
  const [rows] = await pool.query('SELECT * FROM `user` WHERE `user_id` = ?', [id]);
  return rows[0];
}

export async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM `user` WHERE `user_id` = ?', [id]);
  return result.affectedRows > 0;
}

export async function createUser(name, email, phone, gender) {
  const [result] = await pool.query('INSERT INTO `user` (name, email, phone, gender) VALUES (?, ?, ?, ?)', [name, email, phone, gender]);
  const id = result.insertId;
  return getUser(id);
}

export async function updateUser(id, name, email, phone, gender) {
  const [result] = await pool.query('UPDATE `user` SET `name` = ?, `email` = ?, `phone` = ?, `gender` = ? WHERE `user_id` = ?', [name, email, phone, gender, id]);
  return getUser(id);
}

// const result = await createUser('wicked john', 'Y7Gp7@example.com', '081234567890', 'male');
// console.log(result);
