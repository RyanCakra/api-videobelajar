import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUsers, getUser, getUserByEmail, getUserByToken, createUser, verifyUser, updateUser, deleteUser } from './database.js';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from './database.js';
import dotenv from 'dotenv';
import sendVerificationEmail from './emailService.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// import nodemailer from 'nodemailer';
// import { randomBytes } from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

// Mengaktifkan CORS
app.use(
  cors({
    origin: 'http://localhost:5173', // Sesuaikan dengan origin frontend Anda
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Jika Anda menggunakan cookies atau token yang dikirim dengan permintaan
  })
);

// JWT Secret Key from environment variables
// const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');

// Function to create an admin user
// async function createAdminUser() {
//   try {
//     const fullname = 'Admin User';
//     const email = 'admin@example.com';
//     const password = 'adminpassword';
//     const phone = '1234567890';
//     const country = 'Indonesia';
//     const gender = 'male';
//     const verificationToken = 'adminverificationtoken';
//     const role = 'admin';

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const adminUser = await createUser(fullname, email, hashedPassword, phone, country, gender, verificationToken, role);
//     console.log('Admin user created:', adminUser);
//   } catch (err) {
//     console.error('Error creating admin user:', err);
//   }
// }
// createAdminUser();

// Token to authenticate using JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send('Access denied. No token provided.');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = decoded; // Store the decoded user data in req.user
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set lokasi penyimpanan file
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Menggunakan timestamp untuk nama file
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed.'));
    }
  },
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

const isAdmin = async (req, res, next) => {
  try {
    // Use the user ID from the JWT token
    const user = await getUser(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).send('Access denied. Admins only.');
    }
    next();
  } catch (err) {
    res.status(500).send('Error checking admin privileges.');
  }
};

// User login route (authenticate user and return a JWT token)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials.');
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).send('Error during login.');
  }
});

// Register route
app.post('/register', async (req, res) => {
  const { fullName, email, password, phone, country } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4(); // Generate token

    // Save user with is_verified = 0
    await createUser(fullName, email, hashedPassword, phone, country, verificationToken);

    const verificationLink = `http://localhost:8080/verify/${verificationToken}`;
    await sendVerificationEmail(email, verificationLink); // Send verification email
    res.json({ success: true, message: 'User registered successfully. Please verify your email.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration.' });
  }
});

// Verification route
app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await getUserByToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }
    await verifyUser(user.user_id);

    res.json({ success: true, message: 'Account verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during verification.' });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.send(users);
  } catch (err) {
    res.status(500).send('Error fetching users.');
  }
});

// Get a single user
app.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await getUser(id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send('User not found.');
    }
  } catch (err) {
    res.status(500).send('Error fetching user.');
  }
});

// Create a new user
app.post('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { fullname, username, email, password, phone, gender } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(fullname, username, email, hashedPassword, phone, gender);
    res.status(201).send(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Error creating user.');
  }
});

// Update a user
app.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { fullname, username, email, phone, gender } = req.body;
    const user = await updateUser(id, fullname, username, email, phone, gender);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send('User not found.');
    }
  } catch (err) {
    res.status(500).send('Error updating user.');
  }
});

// Delete a user
app.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const success = await deleteUser(id);
    if (success) {
      res.send('User deleted successfully.');
    } else {
      res.status(404).send('User not found.');
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send('Error deleting user.');
  }
});

// Get all products (with search, filter, and sort functionality)
app.get('/products', async (req, res) => {
  try {
    // Extract query parameters
    const { search, category, sortBy = 'createdAt', order = 'desc' } = req.query;
    let products = await getProducts();
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((product) => product.judul.toLowerCase().includes(searchLower));
    }

    if (category) {
      products = products.filter((product) => product.category.toLowerCase() === category.toLowerCase());
    }

    if (sortBy) {
      products = products.sort((a, b) => {
        let fieldA = a[sortBy];
        let fieldB = b[sortBy];

        if (sortBy === 'harga' || sortBy === 'hargaDisc') {
          fieldA = parseFloat(fieldA);
          fieldB = parseFloat(fieldB);
        } else if (typeof fieldA === 'string') {
          fieldA = fieldA.toLowerCase();
          fieldB = fieldB.toLowerCase();
        }

        if (order === 'asc') {
          return fieldA > fieldB ? 1 : -1;
        } else {
          return fieldA < fieldB ? 1 : -1;
        }
      });
    }

    // Parse rate field and return the products
    const parsedProducts = products.map((product) => {
      let parsedRate = product.rate;
      try {
        if (typeof parsedRate === 'string') {
          parsedRate = JSON.parse(parsedRate);
        }
      } catch (e) {
        console.error('Error parsing rate field:', e);
      }
      return { ...product, rate: parsedRate };
    });

    res.send(parsedProducts);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Error fetching products.');
  }
});

// Get a single product (public route)
app.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await getProduct(id);

    if (product) {
      try {
        product.rate = JSON.parse(product.rate);
      } catch (e) {
        console.error('Error parsing rate field:', e);
      }
      res.send(product);
    } else {
      res.status(404).send('Product not found.');
    }
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).send('Error fetching product.');
  }
});

// upload bannerimage
app.post('/products', verifyToken, isAdmin, upload.single('bannerImg'), async (req, res) => {
  try {
    // Ambil file yang di-upload
    const bannerImg = req.file?.filename;

    // Buat URL lengkap untuk gambar
    const bannerImgUrl = `${req.protocol}://${req.get('host')}/uploads/${bannerImg}`;

    const { judul, desc, profileImg, author, pekerjaan, harga, discount, rateAvg, rateCount, category, durasi } = req.body;
    let hargaDisc = null;

    // Hitung harga diskon jika ada
    if (discount) {
      const hargaNumeric = parseFloat(harga.replace('Rp ', '').replace('k', '')) * 1000;
      const diskonNumeric = parseFloat(discount.replace('%', '')) / 100;
      hargaDisc = `Rp ${((hargaNumeric * (1 - diskonNumeric)) / 1000).toFixed(0)}k`;
    }

    const rate = JSON.stringify({ rateAvg, rateCount });

    // Simpan produk baru ke dalam database dengan bannerImgUrl
    const product = await createProduct(bannerImgUrl, judul, desc, profileImg, author, pekerjaan, harga, discount, hargaDisc, rate, category, durasi);
    res.status(201).send({ productId: product, bannerImgUrl });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).send('Error creating product.');
  }
});

//update the bannerimg
app.put('/products/:id', verifyToken, isAdmin, upload.single('bannerImg'), async (req, res) => {
  try {
    const id = req.params.id;
    const { judul, desc, harga, discount, category, durasi, rateAvg, rateCount } = req.body;

    // Ambil file yang di-upload, jika ada
    let bannerImgUrl;
    if (req.file) {
      const bannerImg = req.file.filename;
      bannerImgUrl = `${req.protocol}://${req.get('host')}/uploads/${bannerImg}`;
    }

    let hargaDisc = null;
    if (discount) {
      const hargaNumeric = parseFloat(harga.replace('Rp ', '').replace('k', '')) * 1000;
      const diskonNumeric = parseFloat(discount.replace('%', '')) / 100;
      hargaDisc = `Rp ${((hargaNumeric * (1 - diskonNumeric)) / 1000).toFixed(0)}k`;
    }

    const rate = JSON.stringify({ rateAvg, rateCount });

    // Update product data including banner image if provided
    await updateProduct(id, judul, desc, harga, discount, hargaDisc, rate, category, durasi, bannerImgUrl);

    res.send('Product updated successfully.');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Error updating product.');
  }
});

// Delete a product (requires authentication)
app.delete('/products/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const success = await deleteProduct(id);

    if (success) {
      res.send('Product deleted successfully.');
    } else {
      res.status(404).send('Product not found.');
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Error deleting product.');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('server is running on port 8080!');
});
