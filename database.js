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

// Get all users
export async function getUsers() {
  const [rows] = await pool.query('SELECT * FROM `user`');
  return rows;
}

// Get a user by ID
export async function getUser(id) {
  const [rows] = await pool.query('SELECT * FROM `user` WHERE `user_id` = ?', [id]);
  return rows[0];
}

// Get a user by email
export async function getUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM `user` WHERE `email` = ?', [email]);
  return rows[0];
}

// Fungsi getUserByToken
export const getUserByToken = async (token) => {
  const result = await pool.query('SELECT * FROM `user` WHERE verification_token = ?', [token]);
  return result[0]?.[0]; // Ambil elemen pertama dari array data
};

// Fungsi verifyUser
export const verifyUser = async (userId) => {
  return await pool.query('UPDATE `user` SET is_verified = 1, verification_token = NULL WHERE user_id = ?', [userId]);
};

// Fungsi createUser
export const createUser = async (fullname, email, password, phone, country, gender, verificationToken, role) => {
  // Sesuaikan dengan query ke database untuk menyimpan data pengguna
  return await pool.query('INSERT INTO `user` (fullname, email, password, phone, country, gender, verification_token, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [fullname, email, password, phone, country, gender, verificationToken, role]);
};

// Delete a user
export async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM `user` WHERE `user_id` = ?', [id]);
  return result.affectedRows > 0;
}

// Update a user
export async function updateUser(id, fullname, email, phone, gender, country) {
  const [result] = await pool.query('UPDATE `user` SET fullname = ?, email = ?, phone = ?, gender = ?, country = ? WHERE user_id = ?', [fullname, email, phone, gender, country, id]);
  return getUser(id);
}

// Get all products
export const getProducts = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM product');
    return rows;
  } catch (error) {
    console.error('Database error fetching products:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProduct = async (id) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Database error fetching product:', error);
    throw error;
  }
};

export const createProduct = async (bannerImg, judul, desc, profileImg, author, pekerjaan, harga, discount, hargaDisc, rate, category, durasi) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO product 
      (bannerImg, judul, \`desc\`, profileImg, author, pekerjaan, harga, discount, hargaDisc, rate, category, durasi) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bannerImg || null, judul, desc, profileImg || null, author || null, pekerjaan || null, harga, discount || null, hargaDisc || null, rate || null, category, durasi]
    );
    return result.insertId;
  } catch (error) {
    console.error('Database error creating product:', error);
    throw error;
  }
};

// Update product by ID
export const updateProduct = async (id, judul, desc, harga, discount, hargaDisc, rateAvg, rateCount, category, durasi) => {
  try {
    const rate = JSON.stringify({ rateAvg, rateCount });
    await pool.query('UPDATE product SET judul = ?, `desc` = ?, harga = ?, discount = ?, hargaDisc = ?, rate = ?, category = ?, durasi = ? WHERE id = ?', [judul, desc, harga, discount, hargaDisc, rate, category, durasi, id]);
  } catch (error) {
    console.error('Database error updating product:', error);
    throw error;
  }
};

// Delete product by ID
export const deleteProduct = async (id) => {
  try {
    const [result] = await pool.query('DELETE FROM product WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database error deleting product:', error);
    throw error;
  }
};
