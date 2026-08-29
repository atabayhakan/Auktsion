import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  formatUser,
} from '../models/userModel.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, phone, password, city, role } = req.body;

    if (!fullName || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        error: 'Бардык милдеттүү талааларды толтуруңуз (All fields are required: fullName, email, phone, password)',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Сыр сөз 6 символдон кем болбошу керек (Password must be at least 6 characters)',
      });
      return;
    }

    // Check duplicate email
    const existingEmail = findUserByEmail(email);
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: 'Бул email дареги менен колдонуучу мурунтан катталган (Email already registered)',
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newUser = createUser({
      id: userId,
      email,
      passwordHash,
      fullName,
      phone,
      city: city || 'Бишкек',
      role: role === 'seller' ? 'seller' : 'buyer',
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret as jwt.Secret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      token,
      user: formatUser(newUser),
      data: formatUser(newUser), // for backwards-compatibility with frontend store
      message: 'Каттоо ийгиликтүү аяктады (Registration successful)',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Каттоодо ката кетти (Registration failed)',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email жана сыр сөздү жазыңыз (Email and password are required)',
      });
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Email же сыр сөз туура эмес (Invalid email or password)',
      });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({
        success: false,
        error: 'Сиздин аккаунтуңуз бөгөттөлгөн (Account is banned)',
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Email же сыр сөз туура эмес (Invalid email or password)',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret as jwt.Secret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      success: true,
      token,
      user: formatUser(user),
      data: formatUser(user),
      message: 'Ийгиликтүү кирдиңиз (Login successful)',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Кирүүдө ката кетти (Login failed)',
    });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Аутентификация талап кылынат (Authentication required)',
      });
      return;
    }

    const user = findUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Колдонуучу табылган жок (User not found)',
      });
      return;
    }

    res.json({
      success: true,
      user: formatUser(user),
      data: formatUser(user),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Маалыматты жүктөөдө ката кетти (Failed to fetch user)',
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'Ийгиликтүү чыктыңыз (Logged out successfully)',
  });
}
