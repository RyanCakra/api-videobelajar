import express from 'express';

import { getUsers, getUser, createUser, updateUser, deleteUser } from './database.js';

const app = express();

app.use(express.json());

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
app.post('/users', async (req, res) => {
  try {
    const { name, email, phone, gender } = req.body;
    const user = await createUser(name, email, phone, gender);
    res.status(201).send(user);
  } catch (err) {
    res.status.send('Error creating user.');
  }
});

// Update a user
app.put('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone, gender } = req.body;
    const user = await updateUser(id, name, email, phone, gender);
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
app.delete('/users/:id', async (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('server is running on port 8080!');
});
