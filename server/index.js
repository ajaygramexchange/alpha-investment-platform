const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// --- Prisma 7 Setup ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- AUTH ROUTES ---
app.post('/auth/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: hashedPassword,
        wallets: { create: { currency: 'USD', balance: 0 } }
      },
      include: { wallets: true }
    });
    res.status(201).json({ message: "User created successfully", userId: newUser.id });
  } catch (error) {
    res.status(400).json({ error: "Email already exists or data invalid" });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role || 'USER' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- USER DATA ROUTES ---
app.get('/user/portfolio/:userId', async (req, res) => {
  try {
    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.params.userId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } }
    });
    const investments = await prisma.investment.findMany({
      where: { userId: req.params.userId }
    });
    res.json({ wallet, investments });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch portfolio" });
  }
});

// --- NEW: PUBLIC RECENT PAYOUTS ROUTE (For Ticker) ---
app.get('/api/recent-payouts', async (req, res) => {
  try {
    const payouts = await prisma.transaction.findMany({
      where: { 
        status: 'success',
        type: 'withdrawal' 
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: { user: true }
        }
      }
    });

    const formattedPayouts = payouts.map(p => ({
      name: p.wallet.user.fullName.split(' ')[0], // Only first name for social proof privacy
      amount: p.amount
    }));

    res.json(formattedPayouts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// --- INVESTMENT & WITHDRAWAL ROUTES ---
app.post('/invest', async (req, res) => {
  const { userId, planName, amount, dailyRoi, durationDays } = req.body;
  try {
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    const result = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } }),
      prisma.investment.create({
        data: {
          userId,
          planName,
          principalAmount: amount,
          dailyRoi,
          maturityDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.transaction.create({
        data: { walletId: wallet.id, type: 'investment', amount: -amount, status: 'success' }
      })
    ]);
    res.status(201).json({ message: "Investment started!", investment: result[1] });
  } catch (error) {
    res.status(500).json({ error: "Transaction failed" });
  }
});

app.post('/api/withdraw-request', async (req, res) => {
  const { userId, amount, fullName } = req.body;
  try {
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: 'pending'
      }
    });

    const mailOptions = {
      from: `"AlphaInvest Alerts" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, 
      subject: '🚨 New Withdrawal Request!',
      html: `
        <div style="font-family:sans-serif; background:#050810; color:white; padding:20px; border-radius:10px;">
          <h2 style="color:#3b82f6;">Withdrawal Request Details</h2>
          <p><strong>Investor:</strong> ${fullName}</p>
          <p><strong>Amount:</strong> <span style="color:#22c55e;">$${amount}</span></p>
          <p style="font-size:12px; color:#64748b;">Process this request in the Admin Terminal.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Request sent." });
  } catch (error) {
    console.error("Withdrawal mail error:", error);
    res.status(500).json({ error: "Could not process withdrawal request" });
  }
});

// --- ADMIN ROUTES ---

app.get('/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { wallets: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get('/admin/transactions/pending', async (req, res) => {
  try {
    const pending = await prisma.transaction.findMany({
      where: { status: 'pending' },
      include: { 
        wallet: { 
          include: { user: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

app.post('/admin/transaction/update', async (req, res) => {
  const { txId, status } = req.body;
  try {
    // 1. Get the transaction details first
    const tx = await prisma.transaction.findUnique({
      where: { id: txId },
      include: { wallet: true }
    });

    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    // 2. Use a transaction to update status AND subtract balance if approved
    const result = await prisma.$transaction(async (p) => {
      const updatedTx = await p.transaction.update({
        where: { id: txId },
        data: { status }
      });

      // If withdrawal is approved, we must actually deduct the money from the wallet balance
      if (status === 'success' && tx.type === 'withdrawal') {
        await p.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { decrement: tx.amount } }
        });
      }

      return updatedTx;
    });

    res.json({ message: `Transaction marked as ${status}`, transaction: result });
  } catch (error) {
    console.error("Transaction update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.post('/admin/deposit/confirm', async (req, res) => {
  const { userId, amount } = req.body;
  const parsedAmount = parseFloat(amount);
  if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid entity ID or liquidity amount" });
  }

  try {
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) return res.status(404).json({ error: "Entity wallet not found" });

    const result = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: parsedAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'deposit',
          amount: parsedAmount,
          status: 'success'
        }
      })
    ]);

    res.json({ 
      message: "Liquidity Injected Successfully", 
      newBalance: result[0].balance 
    });
  } catch (error) {
    console.error("Admin Manual Deposit Error:", error);
    res.status(500).json({ error: "Manual confirmation failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Terminal Core online at http://localhost:${PORT}`));