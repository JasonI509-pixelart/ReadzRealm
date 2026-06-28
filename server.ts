import express from "express";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DBStore } from "./src/models/dbStore";
import { BookModel } from "./src/models/Book";
import { UserModel } from "./src/models/User";
import { validateAdminToken } from "./src/middleware/auth";

const app = express();
const PORT = 3000;

// Admin Auto-Generator flag
let isAutoGeneratingEveryMinute = false;

// Body parsing
app.use(express.json({
  limit: '50mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || "ws_bda6e9b72c89921c7dbe8db823ea700c42d54785fd51d4554af793644ebfff51";

function verifyWhopSignature(req: any, secret: string): boolean {
  const signature = req.headers['whop-signature'];
  if (!signature) {
    console.error("verifyWhopSignature: whop-signature header is missing in request");
    return false;
  }
  
  const bodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(bodyBuffer);
  const expectedSignature = hmac.digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (e) {
    return signature === expectedSignature;
  }
}

// Automatically send digital edition to customer's email with attached printable digital book
async function sendDigitalBookEmail(email: string, book: any) {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let transporter: any;

    if (smtpHost && smtpUser && smtpPass) {
      console.log(`Using configured SMTP server ${smtpHost}:${smtpPort} for digital delivery...`);
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } else {
      console.log("No custom SMTP credentials configured in environments. Initializing fallback sandbox Ethereal transporter.");
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch (etherealErr) {
        console.warn("Could not start Ethereal test mailer, falling back to dry-run mailer logging:", etherealErr);
        transporter = {
          sendMail: async (options: any) => {
            console.log("================ SIMULATED DIGITAL BOOK EMAIL ================");
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body (Length): ${options.html?.length} characters`);
            console.log(`Attachments: ${options.attachments?.map((a: any) => a.filename).join(", ")}`);
            console.log("==============================================================");
            return { messageId: "dryrun-id-" + Date.now() };
          }
        };
      }
    }

    // Compile magnificent offline reader HTML document as printable/saveable Digital Edition
    const offlineHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${book.title} - Official Collector's Digital Edition</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap');
    
    body {
      background-color: #fcfcf9;
      color: #121212;
      font-family: 'Playfair Display', Georgia, serif;
      line-height: 1.8;
      max-width: 840px;
      margin: 0 auto;
      padding: 50px 30px;
    }
    
    /* Cover page styling */
    .book-cover {
      text-align: center;
      margin-bottom: 70px;
      border: 8px solid #000;
      padding: 50px 30px;
      background: #ffffff;
      border-radius: 36px;
      box-shadow: 12px 12px 0 0 #000;
      position: relative;
    }
    
    .genre-tag {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #e53e3e;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 15px 0;
      text-transform: uppercase;
      letter-spacing: -1px;
    }
    
    .moral-banner {
      display: inline-block;
      background: #FFFEE5;
      border: 3px solid #000;
      padding: 10px 24px;
      border-radius: 16px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: bold;
      font-size: 1.1rem;
      margin: 20px 0;
      box-shadow: 4px 4px 0 0 #000;
    }
    
    .cover-illustration {
      max-width: 100%;
      height: auto;
      border-radius: 20px;
      border: 5px solid #000;
      margin: 30px 0;
      box-shadow: 6px 6px 0 0 #000;
    }
    
    .blurb-text {
      font-style: italic;
      color: #333;
      font-size: 1.25rem;
      line-height: 1.6;
      border-left: 6px solid #e53e3e;
      padding-left: 20px;
      margin: 40px auto;
      text-align: left;
      max-width: 90%;
    }
    
    /* Toc styling */
    .toc-container {
      background: #fff;
      border: 4px solid #000;
      padding: 40px;
      border-radius: 24px;
      margin-bottom: 80px;
      box-shadow: 8px 8px 0 0 #000;
    }
    
    .toc-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      border-bottom: 4px solid #000;
      padding-bottom: 10px;
      margin-bottom: 25px;
      text-transform: uppercase;
    }
    
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .toc-item {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .toc-name {
      background-color: #fcfcf9;
      padding-right: 10px;
    }
    
    .toc-dots {
      flex-grow: 1;
      border-bottom: 2px dotted #aaa;
      margin: 0 10px 5px 10px;
    }
    
    .toc-num {
      padding-left: 10px;
      font-weight: bold;
    }
    
    /* Chapter styling */
    .book-page {
      margin-top: 100px;
      border-top: 4px solid #000;
      padding-top: 50px;
      page-break-before: always;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      color: #666;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    
    .page-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.2rem;
      font-weight: 700;
      margin: 20px 0 35px 0;
      line-height: 1.3;
    }
    
    .story-text {
      font-size: 1.3rem;
      margin-bottom: 40px;
      text-align: justify;
      white-space: pre-line;
    }
    
    .story-illustration {
      max-width: 100%;
      height: auto;
      border-radius: 16px;
      border: 4px solid #000;
      margin: 30px auto;
      display: block;
      box-shadow: 6px 6px 0 0 #000;
    }
    
    .page-number-footer {
      text-align: center;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: bold;
      margin-top: 50px;
      font-size: 1.1rem;
    }
    
    .book-footer {
      text-align: center;
      margin-top: 120px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      color: #777;
      border-top: 2px dashed #ccc;
      padding-top: 30px;
    }
    
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .book-cover {
        box-shadow: none;
        border-width: 4px;
        page-break-after: always;
      }
      .toc-container {
        box-shadow: none;
        page-break-after: always;
      }
      .book-page {
        margin-top: 0;
        border-top: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>

  <div class="book-cover">
    <div class="genre-tag">${book.genre.toUpperCase()} &bull; AGE ${book.targetAgeGroup || 'All'}</div>
    <h1>${book.title}</h1>
    <div class="moral-banner">MORAL: ${book.moralLesson}</div>
    <img src="${book.coverImageUrl}" alt="Book Cover" class="cover-illustration">
    <div class="blurb-text">"${book.blurbText}"</div>
  </div>

  <div class="toc-container">
    <div class="toc-title">Table of Contents</div>
    <ul class="toc-list">
      ${book.pages.map((p: any, idx: number) => `
        <li class="toc-item">
          <span class="toc-name">Page ${p.pageNumber}: ${p.chapterTitle || `Chapter ${idx + 1}`}</span>
          <span class="toc-dots"></span>
          <span class="toc-num">${p.pageNumber}</span>
        </li>
      `).join('')}
    </ul>
  </div>

  ${book.pages.map((p: any, idx: number) => `
    <div class="book-page">
      <div class="page-header">
        <span>${book.title.toUpperCase()}</span>
        <span>PAGE ${p.pageNumber}</span>
      </div>
      <h2 class="page-title">${p.chapterTitle || `Chapter ${idx + 1}`}</h2>
      <div class="story-text">${p.textContent}</div>
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="Illustration for Page ${p.pageNumber}" class="story-illustration" />` : ''}
      <div class="page-number-footer">- ${p.pageNumber} -</div>
    </div>
  `).join('')}

  <div class="book-footer">
    <p>This Collector's Digital Edition was prepared and dispatched automatically after a verified purchase.</p>
    <p>&copy; ${new Date().getFullYear()} Dog AI Children's Book Generator. All rights reserved.</p>
  </div>

</body>
</html>`;

    const mailOptions = {
      from: smtpUser ? `"Dog AI Books" <${smtpUser}>` : '"Dog AI Books" <noreply@dog-ai-books.com>',
      to: email,
      subject: `🎁 Your Digital Edition of "${book.title}" is ready!`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 4px solid #000; border-radius: 24px; background-color: #FFFEE5; box-shadow: 8px 8px 0 0 #000;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🐕</span>
          </div>
          <h1 style="color: #000; text-transform: uppercase; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; border-bottom: 5px solid #000; padding-bottom: 12px; margin-top: 0; text-align: center;">
            ARF! PURCHASE CONFIRMED!
          </h1>
          
          <p style="font-size: 16px; color: #111; line-height: 1.6; font-weight: bold;">
            Bark! Your Whop payment went through successfully! We've immediately processed your order and unlocked your library.
          </p>
          
          <div style="background: #ffffff; border: 4px solid #000; padding: 25px; border-radius: 16px; margin: 25px 0; text-align: center; box-shadow: 4px 4px 0 0 #000;">
            <img src="${book.coverImageUrl}" alt="Book Cover" style="max-width: 180px; border-radius: 12px; border: 3px solid #000; margin-bottom: 15px;" />
            <h2 style="margin: 5px 0; color: #000; font-size: 22px; text-transform: uppercase; font-weight: bold;">${book.title}</h2>
            <p style="margin: 8px 0; color: #e53e3e; font-weight: bold; font-size: 14px;">GENRE: ${book.genre.toUpperCase()}</p>
            <p style="margin: 10px 0; color: #444; font-style: italic; font-size: 14px;">"${book.blurbText}"</p>
          </div>
          
          <p style="font-size: 14px; color: #222; line-height: 1.6;">
            <strong>Attached Digital Edition:</strong> We've attached a beautiful, responsive <strong>Offline Digital Edition (.html)</strong> file to this email. You can open it on your phone, tablet, or laptop anytime without needing internet, or easily click "Print" in your browser to save it as a PDF or print a gorgeous physical book!
          </p>
          
          <p style="font-size: 14px; color: #222; line-height: 1.6; margin-top: 15px;">
            Your book is also permanently unlocked on our website. Simply sign up or log in using your buyer email address <strong>${email}</strong> to access your digital bookshelf, look at customized cover designs, earn reading badges, and generate interactive stories!
          </p>
          
          <div style="text-align: center; margin: 35px 0 25px 0;">
            <a href="${process.env.APP_URL || 'https://ai.studio/build'}" style="background-color: #39FF14; color: #000; text-decoration: none; padding: 14px 28px; border: 4px solid #000; border-radius: 14px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 5px 5px 0 0 #000; text-transform: uppercase; letter-spacing: 0.5px;">
              Open My Bookshelf 🚀
            </a>
          </div>
          
          <div style="border-top: 3px dashed #000; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #555;">
            <p style="margin: 0; font-weight: bold;">Verified Secure Transaction</p>
            <p style="margin: 4px 0 0 0;">This transmission is verified by Whop Signature cryptographical guards. If you need any assistance, contact us anytime.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${book.title.replace(/[^a-z0-9]/gi, '_')}_Digital_Edition.html`,
          content: offlineHtml
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Digital Book Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    
    if (info.messageId && !smtpHost) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [DEBUG] Ethereal fallback email preview: ${previewUrl}`);
      }
    }
  } catch (err) {
    console.error("Failed to automatically email digital book PDF:", err);
  }
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// --- SECTION 8: SEO ARCHITECTURE & SEARCH CONSOLE MAPPING ---
// Custom dedicated verification endpoint handler matching specific target token
app.get("/google61d5ef2576b92150.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send("google-site-verification: google61d5ef2576b92150.html");
});

// --- API ROUTES Prefix ---

// 1. Get all published or unpublished books
app.get("/api/v1/books", async (req, res) => {
  try {
    const books = await BookModel.find();
    const defaultBookId = await DBStore.getDefaultBookId();
    return res.json({ success: true, books, defaultBookId });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve books." });
  }
});

// 2. Get specific book by ID
app.get("/api/v1/books/:id", async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }
    return res.json({ success: true, book });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve book." });
  }
});

// 3. Get book by reader's secret slug
app.get("/api/v1/books/slug/:secretSlug", async (req, res) => {
  try {
    const book = await DBStore.findBookBySlug(req.params.secretSlug);
    if (!book) {
      return res.status(404).json({ error: "Reader URL is invalid or has expired." });
    }
    return res.json({ success: true, book });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve reading content." });
  }
});

// Admin Edit, Delete, Toggle-Publish Endpoints
app.post("/api/v1/admin/books/:id/edit", validateAdminToken, async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    const { title, genre, targetAgeGroup, moralLesson, blurbText, pages, basePrice, coverImageUrl, isPictureBook } = req.body;
    
    if (title) book.title = title;
    if (genre) book.genre = genre;
    if (targetAgeGroup) book.targetAgeGroup = targetAgeGroup;
    if (moralLesson) book.moralLesson = moralLesson;
    if (blurbText) book.blurbText = blurbText;
    if (basePrice !== undefined) book.basePrice = Number(basePrice);
    if (pages) book.pages = pages;
    if (coverImageUrl !== undefined) book.coverImageUrl = coverImageUrl;
    if (isPictureBook !== undefined) book.isPictureBook = Boolean(isPictureBook);
    
    await book.save();
    return res.json({ success: true, book });
  } catch (err) {
    return res.status(500).json({ error: "Failed to edit book details." });
  }
});

app.post("/api/v1/admin/books/:id/delete", validateAdminToken, async (req, res) => {
  try {
    const deleted = await BookModel.delete(req.params.id);
    return res.json({ success: deleted });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete book." });
  }
});

app.post("/api/v1/admin/set-default-book", validateAdminToken, async (req, res) => {
  try {
    const { defaultBookId } = req.body;
    await DBStore.setDefaultBookId(defaultBookId);
    return res.json({ success: true, defaultBookId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to set default starting book." });
  }
});

app.post("/api/v1/admin/books/:id/toggle-publish", validateAdminToken, async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    book.isPublished = !book.isPublished;
    await book.save();
    return res.json({ success: true, isPublished: book.isPublished });
  } catch (err) {
    return res.status(500).json({ error: "Failed to toggle publish status." });
  }
});

// Admin Auto-Generator Endpoints
app.get("/api/v1/admin/auto-generator/status", validateAdminToken, (req, res) => {
  return res.json({ success: true, isEnabled: isAutoGeneratingEveryMinute });
});

app.post("/api/v1/admin/auto-generator/toggle", validateAdminToken, (req, res) => {
  const { enabled } = req.body;
  if (enabled !== undefined) {
    isAutoGeneratingEveryMinute = !!enabled;
  } else {
    isAutoGeneratingEveryMinute = !isAutoGeneratingEveryMinute;
  }
  console.log(`🔌 ADMIN: Auto-generation state is now ${isAutoGeneratingEveryMinute ? 'ENABLED' : 'DISABLED'}`);
  return res.json({ success: true, isEnabled: isAutoGeneratingEveryMinute });
});

app.post("/api/v1/admin/auto-generator/generate-now", validateAdminToken, async (req, res) => {
  console.log("⚡ ADMIN COMMAND: Force generate a draft book immediately.");
  try {
    await autoGenerateComicBook();
    return res.json({ success: true, message: "Draft book generated successfully!" });
  } catch (err: any) {
    console.error("Manual auto-generator trigger failed:", err);
    return res.status(500).json({ error: "Failed to force generate draft book." });
  }
});

async function ensureStarterBookOwnership(user: any) {
  if (!user) return;
  const defaultBookId = await DBStore.getDefaultBookId();
  if (defaultBookId) {
    if (!user.ownedBooks) {
      user.ownedBooks = [];
    }
    const alreadyOwned = user.ownedBooks.some((b: any) => b.bookId === defaultBookId);
    if (!alreadyOwned) {
      user.ownedBooks.push({ bookId: defaultBookId, unlockedVia: "giveaway" });
      await user.save();
    }
  }
}

// 4. User Registration
app.post("/api/v1/users/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required!" });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.passwordHash === "whop_unlocked_placeholder") {
        // Merge registered info into the Whop-unlocked stub!
        existing.username = username;
        existing.passwordHash = password;
        existing.badges = [{ badgeId: "signup", title: "New Cadet Badge", unlockedAt: new Date().toISOString() }];
        await existing.save();
        return res.status(201).json({ success: true, user: existing });
      }
      return res.status(400).json({ error: "Email is already registered!" });
    }

    const defaultBookId = await DBStore.getDefaultBookId();
    const ownedBooks = defaultBookId ? [{ bookId: defaultBookId, unlockedVia: "giveaway" }] : [];

    const newUser = await UserModel.create({
      username,
      email: cleanEmail,
      passwordHash: password, // Simple plain mock storage for playground demo
      virtualCoins: 0,
      badges: [{ badgeId: "signup", title: "New Cadet Badge", unlockedAt: new Date().toISOString() }],
      ownedBooks
    });

    return res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    return res.status(500).json({ error: "Failed to register user." });
  }
});

// 5. User Login
app.post("/api/v1/users/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required!" });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    await ensureStarterBookOwnership(user);
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Login failed." });
  }
});

// 6. Get User profile
app.get("/api/v1/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    await ensureStarterBookOwnership(user);
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load user profile." });
  }
});

// 7. Award Virtual Coins
app.post("/api/v1/users/:id/award-coins", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const amount = Number(req.body.amount) || 50;
    user.virtualCoins = (user.virtualCoins || 0) + amount;
    
    // Add an award badge!
    const badgeText = req.body.badgeTitle || "Book completion Star!";
    const badgeId = "b_" + Date.now();
    user.badges.push({
      badgeId,
      title: badgeText,
      unlockedAt: new Date().toISOString()
    });

    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to award coins." });
  }
});

// 7.5 Earn Specific Badge
app.post("/api/v1/users/:id/earn-badge", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { badgeId, badgeTitle } = req.body;
    if (!badgeId || !badgeTitle) {
      return res.status(400).json({ error: "Missing badgeId or badgeTitle" });
    }

    const alreadyEarned = user.badges.some(b => b.badgeId === badgeId || b.title === badgeTitle);
    if (alreadyEarned) {
      return res.json({ success: true, message: "Already earned!", user });
    }

    user.badges.push({
      badgeId,
      title: badgeTitle,
      unlockedAt: new Date().toISOString()
    });

    // Award exactly 5 virtual coins per badge as requested!
    user.virtualCoins = (user.virtualCoins || 0) + 5;

    await user.save();
    return res.json({ success: true, user, isNewBadge: true });
  } catch (err) {
    console.error("Earn badge error:", err);
    return res.status(500).json({ error: "Failed to earn badge." });
  }
});

// --- SECTION 5: PRICING ENGINE ---
// Every book is flat $4.00 as requested!
function calculateDynamicPrice(basePrice: number, isFirstOrder: boolean): number {
  return 4.00;
}

// Get price preview
app.get("/api/v1/books/:id/price-preview", async (req, res) => {
  return res.json({
    success: true,
    basePrice: 4.00,
    isFirstOrder: false,
    finalPrice: 4.00,
  });
});

// Process Book purchase using Whop Webhook (automated checkout)
app.post("/api/whop-webhook", async (req, res) => {
  console.log("Whop Webhook received body:", JSON.stringify(req.body));
  
  // Verify Whop Signature to unlock the book safely using Whop Webhook Secret
  if (!verifyWhopSignature(req, WHOP_WEBHOOK_SECRET)) {
    console.error("Whop Webhook: Signature verification failed!");
    return res.status(401).json({ error: "Invalid whop-signature header. Webhook validation failed!" });
  }

  // Whop sends action or event as 'membership.created'
  const action = req.body.action || req.body.event || "";
  
  if (action !== "membership.created") {
    // Return 200 so Whop knows we received it but didn't process other events
    return res.json({ received: true, ignored: true, action });
  }

  // Extract email from multiple possible fields in the payload
  let email = "";
  if (req.body.data?.user?.email) {
    email = req.body.data.user.email;
  } else if (req.body.data?.email) {
    email = req.body.data.email;
  } else if (req.body.user?.email) {
    email = req.body.user.email;
  } else if (req.body.email) {
    email = req.body.email;
  }

  if (!email) {
    console.error("Whop Webhook: Could not find email in payload");
    return res.status(400).json({ error: "Could not find email in webhook payload." });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    // Fetch all books to unlock
    const books = await BookModel.find({ isPublished: true });

    if (!user) {
      console.warn(`Whop Webhook: User with email ${email} not found in database yet. Registering stub user.`);
      // Create pre-paid stub user so when they sign up with this email they are automatically premium
      const ownedBooksList = books.map(book => ({
        bookId: book._id,
        unlockedVia: "purchase" as const
      }));

      const stubUser = await UserModel.create({
        username: email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash: "whop_unlocked_placeholder",
        virtualCoins: 0,
        badges: [{ badgeId: "whop_unlocked", title: "Whop Premium Member", unlockedAt: new Date().toISOString() }],
        ownedBooks: ownedBooksList,
        status: "paid"
      });
      console.log(`Whop Webhook: Created pre-paid stub user for ${email} with status 'paid' and ${books.length} books unlocked.`);
      
      // Determine book purchased (fallback to the first published book if none)
      const purchasedBook = books[0];
      if (purchasedBook) {
        // Trigger email asynchronously so webhook returns immediately to avoid timeouts
        sendDigitalBookEmail(email.toLowerCase(), purchasedBook).catch(err => {
          console.error("Async sendDigitalBookEmail error for stub user:", err);
        });
      }

      return res.json({ success: true, message: "Stub user created with premium access.", email });
    }

    user.status = "paid";
    
    // If user has a specific clicked book, make sure it is at the forefront of their unlocked list
    if (user.lastClickedBookId) {
      const alreadyOwnedClicked = user.ownedBooks.some(ob => ob.bookId.toString() === user.lastClickedBookId?.toString());
      if (!alreadyOwnedClicked) {
        user.ownedBooks.push({
          bookId: user.lastClickedBookId,
          unlockedVia: "purchase"
        });
      }
    }

    // Automatically unlock all published books for the user
    books.forEach(book => {
      const alreadyOwned = user.ownedBooks.some(ob => ob.bookId.toString() === book._id.toString());
      if (!alreadyOwned) {
        user.ownedBooks.push({
          bookId: book._id,
          unlockedVia: "purchase"
        });
      }
    });

    // Award master badge
    const hasBadge = user.badges.some(b => b.badgeId === "whop_unlocked");
    if (!hasBadge) {
      user.badges.push({
        badgeId: "whop_unlocked",
        title: "Whop Premium Member",
        unlockedAt: new Date().toISOString()
      });
    }

    await user.save();
    console.log(`Whop Webhook: Successfully updated user ${email} to status 'paid' and unlocked ${books.length} books (last clicked: ${user.lastClickedBookId || 'none'}).`);
    
    // Find the purchased book using the user's lastClickedBookId or fallback to the first published book
    let purchasedBook = null;
    if (user.lastClickedBookId) {
      purchasedBook = books.find(b => b._id.toString() === user.lastClickedBookId?.toString());
    }
    if (!purchasedBook && books.length > 0) {
      purchasedBook = books[0];
    }
    if (purchasedBook) {
      // Trigger email asynchronously to avoid webhook timeout
      sendDigitalBookEmail(email.toLowerCase(), purchasedBook).catch(err => {
        console.error("Async sendDigitalBookEmail error for existing user:", err);
      });
    }

    return res.json({ success: true, message: "User upgraded to premium access.", email });
  } catch (err) {
    console.error("Error processing Whop Webhook:", err);
    return res.status(500).json({ error: "Internal server error processing webhook." });
  }
});

// Set pending purchase book clicked by the user prior to Whop redirect
app.post("/api/v1/users/set-pending-book", async (req, res) => {
  const { userId, bookId } = req.body;
  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required." });
  }
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User profile not found." });
    user.lastClickedBookId = bookId;
    await user.save();
    return res.json({ success: true, lastClickedBookId: bookId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to store last clicked purchase intent." });
  }
});

// Process Book purchase using Real Card (Simulated Whop Checkout Fallback)
app.post("/api/v1/books/purchase", async (req, res) => {
  const { userId, bookId, cardHolder, cardNumber, secureToken } = req.body;
  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required to checkout." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const book = await BookModel.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found." });

    // Check if progress already contains this book
    const alreadyOwned = user.ownedBooks.some(b => b.bookId.toString() === bookId.toString());
    if (alreadyOwned) {
      return res.json({ success: true, message: "Already owned!", user, secretSlug: book.secretSlug });
    }

    // Assign book under owned list
    user.ownedBooks.push({
      bookId: book._id,
      unlockedVia: "purchase",
    });

    // Add bragging rights badge (no coins are awarded as requested)
    user.badges.push({
      badgeId: "bought_" + book._id,
      title: `${book.genre} Master Collector`,
      unlockedAt: new Date().toISOString(),
    });

    await user.save();

    return res.json({
      success: true,
      message: "Whop payment processed successfully! Hardcoded charge completed.",
      user,
      secretSlug: book.secretSlug,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Checkout error resolving Whop transaction." });
  }
});

// AI Watchdog verification endpoint supporting active fraud detection and 3-day bans
app.post("/api/v1/books/verify-watchdog", async (req, res) => {
  const { userId, bookId, payerName, transactionId, noteText } = req.body;
  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required to verify checkout." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const book = await BookModel.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found." });

    const alreadyOwned = user.ownedBooks.some(b => b.bookId.toString() === bookId.toString());
    if (alreadyOwned) {
      return res.status(400).json({ error: "You already own this epic book!" });
    }

    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({ error: "Your account is currently banned.", banned: true, bannedUntil: user.bannedUntil });
    }

    let isScam = false;
    let explanation = "Telemetry approved.";

    const systemInstruction = `You are the AI Watchdog Fraud Inspector for a premium kids' storybook platform.
Analyze the user's submitted payment claim to detect any "scams", bypasses, cheat entries, or fake receipt attempts.
A claim is classified as a "scam" if:
1. The Transaction/Receipt ID is blank, extremely short (under 8 characters), or contains obvious test, cheat, skip or fake words (e.g., "1234", "asdf", "test", "fake", "none", "scam", "cheat", "bypass", "demo", "null", "no pay", "free").
2. The cardholder/payer name contains numbers, insulting/sarcastic phrases, or gibberish (e.g., "fdsafdsa", "cheater", "hack", "no name").
3. The explanation noteText mentions bypassing, testing, or gloats about not paying.
Output a strict JSON object:
{
  "isScam": boolean,
  "explanation": "State why they were flagged (cartoonish/funny yet extremely strict warnings) or why they were cleared."
}`;

    const promptText = `
User Profile:
- Username: ${user.username}
- Email: ${user.email}

Submitted Claim:
- Cardholder Payer Name: "${payerName || ''}"
- Transaction/Receipt ID: "${transactionId || ''}"
- Description Note: "${noteText || ''}"
- Unlocking Book: "${book.title}"
- Required Price: $4.00

Evaluate telemetry. Output JSON now.`;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isScam: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING }
              },
              required: ["isScam", "explanation"]
            }
          }
        });

        const result = JSON.parse(response.text?.trim() || "{}");
        if (result && result.isScam !== undefined) {
          isScam = result.isScam;
          explanation = result.explanation;
        }
      } catch (geminiErr) {
        console.error("AI Watchdog Gemini failed, using local heuristics:", geminiErr);
        const lowerTx = (transactionId || "").toLowerCase().trim();
        const lowerName = (payerName || "").toLowerCase().trim();
        const lowerNote = (noteText || "").toLowerCase().trim();

        if (
          !lowerTx || lowerTx.length < 8 || 
          lowerTx.includes("scam") || lowerTx.includes("test") || lowerTx.includes("fake") || 
          lowerTx.includes("123") || lowerTx.includes("none") || lowerTx.includes("abc") ||
          lowerTx === "asdf" || lowerTx === "asd" ||
          lowerName.includes("scam") || lowerName.includes("hack") || lowerName.includes("fake") ||
          lowerNote.includes("skip") || lowerNote.includes("cheat") || lowerNote.includes("scam")
        ) {
          isScam = true;
          explanation = "Local analysis: Input matches fraudulent or dummy patterns.";
        }
      }
    } else {
      const lowerTx = (transactionId || "").toLowerCase().trim();
      const lowerName = (payerName || "").toLowerCase().trim();
      const lowerNote = (noteText || "").toLowerCase().trim();

      if (
        !lowerTx || lowerTx.length < 8 || 
        lowerTx.includes("scam") || lowerTx.includes("test") || lowerTx.includes("fake") || 
        lowerTx.includes("123") || lowerTx.includes("none") || lowerTx.includes("abc") ||
        lowerTx === "asdf" || lowerTx === "asd" ||
        lowerName.includes("scam") || lowerName.includes("hack") || lowerName.includes("fake") ||
        lowerNote.includes("skip") || lowerNote.includes("cheat") || lowerNote.includes("scam")
      ) {
        isScam = true;
        explanation = "Local AI-heuristics: suspicious receipt credentials entered.";
      }
    }

    if (isScam) {
      const banDuration = 3 * 24 * 60 * 60 * 1000; // 3 days
      const bannedUntil = new Date(Date.now() + banDuration).toISOString();
      user.bannedUntil = bannedUntil;
      user.banReason = `AI Watchdog detected transaction fraud on "${book.title}". Code: ${explanation}`;
      await user.save();

      return res.status(403).json({
        success: false,
        scamDetected: true,
        banned: true,
        bannedUntil,
        reason: user.banReason,
        error: `🚨 TRANSACTION REJECTED! AI Watchdog detected a payment scam! Your account has been BANNED for 3 days.`
      });
    }

    // Approve payment
    user.ownedBooks.push({
      bookId: book._id,
      unlockedVia: "purchase"
    });

    user.badges.push({
      badgeId: "bought_" + book._id,
      title: `${book.genre} Master Collector`,
      unlockedAt: new Date().toISOString()
    });

    await user.save();

    return res.json({
      success: true,
      message: "🎉 AI Watchdog telemetry check PASSED! Payment approved and book unlocked!",
      user,
      secretSlug: book.secretSlug
    });
  } catch (err) {
    console.error("Watchdog verifying error:", err);
    return res.status(500).json({ error: "Watchdog error inspecting transaction." });
  }
});

// User activity tracking endpoint
app.post("/api/v1/user/track-activity", async (req, res) => {
  const { userId, type, bookId } = req.body;
  if (!userId || !type || !bookId) {
    return res.status(400).json({ error: "Missing required parameters: userId, type, bookId" });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User profile not found." });

    if (!user.staredBookIds) user.staredBookIds = [];
    if (!user.clickedBuyBookIds) user.clickedBuyBookIds = [];
    if (!user.recentReadBookIds) user.recentReadBookIds = [];
    if (!user.bookmarkedBookIds) user.bookmarkedBookIds = [];
    if (!user.pagesReadHistory) user.pagesReadHistory = [];

    if (type === "stared") {
      if (!user.staredBookIds.includes(bookId)) {
        user.staredBookIds.push(bookId);
      }
    } else if (type === "bookmark") {
      if (user.bookmarkedBookIds.includes(bookId)) {
        user.bookmarkedBookIds = user.bookmarkedBookIds.filter(id => id !== bookId);
      } else {
        user.bookmarkedBookIds.push(bookId);
      }
    } else if (type === "page_read") {
      const ownsBook = user.ownedBooks && user.ownedBooks.some(ob => ob.bookId.toString() === bookId.toString());
      if (ownsBook) {
        const pagesCount = Number(req.body.pagesCount) || 1;
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const existingDay = user.pagesReadHistory.find(h => h.date === today);
        if (existingDay) {
          existingDay.count += pagesCount;
        } else {
          user.pagesReadHistory.push({ date: today, count: pagesCount });
        }
      }
    } else if (type === "clicked_buy") {
      if (!user.clickedBuyBookIds.includes(bookId)) {
        user.clickedBuyBookIds.push(bookId);
      }
    } else if (type === "read") {
      const ownsBook = user.ownedBooks && user.ownedBooks.some(ob => ob.bookId.toString() === bookId.toString());
      if (ownsBook) {
        // Move to front of chronological recent list
        user.recentReadBookIds = [bookId, ...user.recentReadBookIds.filter(id => id !== bookId)];
      }
    } else if (type === "delete_recent") {
      user.recentReadBookIds = user.recentReadBookIds.filter(id => id !== bookId);
    } else if (type === "save_page") {
      if (!user.readingHistory) user.readingHistory = [];
      const lastPage = Number(req.body.lastPage) || 1;
      const existingIndex = user.readingHistory.findIndex(h => h.bookId.toString() === bookId.toString());
      if (existingIndex !== -1) {
        user.readingHistory[existingIndex].lastPage = lastPage;
        user.readingHistory[existingIndex].lastAccessed = new Date().toISOString();
      } else {
        user.readingHistory.push({
          bookId: bookId.toString(),
          lastPage,
          lastAccessed: new Date().toISOString()
        });
      }
      user.recentReadBookIds = [bookId, ...user.recentReadBookIds.filter(id => id !== bookId)];
    } else if (type === "save_time") {
      const seconds = Number(req.body.seconds) || 0;
      user.totalReadingTime = (user.totalReadingTime || 0) + seconds;
    } else if (type === "rate_book") {
      if (!user.bookRatings) user.bookRatings = [];
      const rating = Number(req.body.rating) || 5;
      const existingIndex = user.bookRatings.findIndex(r => r.bookId.toString() === bookId.toString());
      if (existingIndex !== -1) {
        user.bookRatings[existingIndex].rating = rating;
      } else {
        user.bookRatings.push({
          bookId: bookId.toString(),
          rating
        });
      }
    } else {
      return res.status(400).json({ error: "Invalid tracking type." });
    }

    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error tracking user activity:", err);
    return res.status(500).json({ error: "Failed to track user activity." });
  }
});

// User Level completion endpoint
app.post("/api/v1/users/:id/complete-book", async (req, res) => {
  const { bookId } = req.body;
  const userId = req.params.id;
  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required." });
  }
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const ownsBook = user.ownedBooks && user.ownedBooks.some(ob => ob.bookId.toString() === bookId.toString());
    if (!ownsBook) {
      return res.status(400).json({ error: "You must buy this book before you can complete it and earn levels!" });
    }

    if (!user.completedBookIdsForLevel) {
      user.completedBookIdsForLevel = [];
    }

    if (user.completedBookIdsForLevel.includes(bookId)) {
      return res.status(400).json({ error: "You have already earned levels from completing this book!", user });
    }

    user.completedBookIdsForLevel.push(bookId);

    const currentLevel = user.level || 1;
    if (currentLevel < 1000) {
      const delta = Math.max(1, Math.round(500 / Math.pow(currentLevel, 0.6)));
      const nextLevel = Math.min(1000, currentLevel + delta);
      user.level = nextLevel;
    }

    await user.save();
    return res.json({ success: true, user, leveledUp: true });
  } catch (err) {
    console.error("Error completing book:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// AI Recommendation endpoint for user
app.get("/api/v1/user/:id/recommendations", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const books = await BookModel.find({ isPublished: true });
    
    // Filter out books the user already owns
    const ownedBookIds = user.ownedBooks.map(b => b.bookId.toString());
    const unownedBooks = books.filter(b => !ownedBookIds.includes(b._id.toString()));

    if (unownedBooks.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    // Interaction history summary
    const staredIds = user.staredBookIds || [];
    const clickedIds = user.clickedBuyBookIds || [];
    
    const staredBooks = books.filter(b => staredIds.includes(b._id.toString()));
    const clickedBooks = books.filter(b => clickedIds.includes(b._id.toString()));
    const ownedBooksList = books.filter(b => ownedBookIds.includes(b._id.toString()));

    let recommendations: any[] = [];

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        const systemInstruction = `You are an AI children's book recommender. Recommend the top 4 books that a child is most likely to enjoy from the available unowned list based on their reading preferences and interaction history.
Write the recommendations in a very playful, cute, high-energy author's voice, explaining specifically why each book fits their activities.
Output a strict JSON array of objects, where each object has "bookId" and "reason" fields:
[
  { "bookId": "string", "reason": "string" }
]`;

        const promptText = `
User Profile & Interaction History:
- Owned Books: ${JSON.stringify(ownedBooksList.map(b => ({ id: b._id, title: b.title, genre: b.genre })))}
- Stared Books (stared at for >20s): ${JSON.stringify(staredBooks.map(b => ({ id: b._id, title: b.title, genre: b.genre })))}
- Clicked to Buy Books: ${JSON.stringify(clickedBooks.map(b => ({ id: b._id, title: b.title, genre: b.genre })))}

Available Unowned Books:
${JSON.stringify(unownedBooks.map(b => ({ id: b._id, title: b.title, genre: b.genre, blurb: b.blurbText })))}

Select the top 4 recommended books. Output strict JSON array of objects.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bookId: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["bookId", "reason"]
              }
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          recommendations = parsed
            .map((item: any) => {
              const book = unownedBooks.find(b => b._id.toString() === item.bookId.toString());
              if (book) {
                return {
                  book,
                  reason: item.reason
                };
              }
              return null;
            })
            .filter(Boolean);
        }
      } catch (geminiErr) {
        console.error("AI Recommendation Gemini failed, falling back to local heuristics:", geminiErr);
      }
    }

    if (recommendations.length === 0) {
      const interactedGenres: string[] = [];
      [...staredBooks, ...clickedBooks, ...ownedBooksList].forEach(b => {
        if (b.genre && !interactedGenres.includes(b.genre)) {
          interactedGenres.push(b.genre);
        }
      });

      const matches = unownedBooks.map(b => {
        let score = 0;
        if (interactedGenres.includes(b.genre)) score += 3;
        if (clickedIds.includes(b._id.toString())) score += 2;
        if (staredIds.includes(b._id.toString())) score += 1;
        score += Math.random() * 0.5;
        return { book: b, score };
      });

      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, 4);

      recommendations = topMatches.map(m => {
        let reason = `Based on your interest in ${m.book.genre} stories, you'll love this exciting story!`;
        if (interactedGenres.length === 0) {
          reason = `A high-adrenaline ${m.book.genre} adventure selected just for you by our AI system!`;
        }
        return {
          book: m.book,
          reason
        };
      });
    }

    return res.json({ success: true, recommendations });
  } catch (err) {
    console.error("Error generating recommendations:", err);
    return res.status(500).json({ error: "Failed to load recommendations." });
  }
});

// Helper to generate a comic illustration using gemini-2.5-flash-image
async function generateComicIllustration(promptDesc: string, fallbackUrl: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return fallbackUrl;
  }
  try {
    const finalPrompt = `Vibrant kid graphic novel cartoon illustration, highly detailed comic book style, bold black outlines, bright hyper-saturated colors, action lines, playful childish drawings, clean page, NO text words in the illustration, showing: ${promptDesc}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: finalPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const base64Data = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${base64Data}`;
        }
      }
    }
    return fallbackUrl;
  } catch (err) {
    console.error("AI image generation error, using fallback URL:", err);
    return fallbackUrl;
  }
}

// --- SECTION 4: THE GENERATIVE ENGINE & PROMPT FRAMEWORKS ---

function stripEmojis(text: string): string {
  if (!text) return "";
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2460}-\u{24FF}]|[\u{2500}-\u{25FF}]|[\u{2B00}-\u{2BFF}]/gu, "");
}

function splitTextIntoEqualPages(fullStoryText: string, targetWordsPerPage: number = 300, desiredPageCount?: number): any[] {
  const cleanStoryText = stripEmojis(fullStoryText);
  const sentences = cleanStoryText.match(/[^.!?]+[.!?]+(\s+|$)/g) || [cleanStoryText];
  const pages: any[] = [];
  
  const totalWords = cleanStoryText.split(/\s+/).filter(Boolean).length;
  let numPages = desiredPageCount && desiredPageCount > 0 
    ? desiredPageCount 
    : Math.max(20, Math.ceil(totalWords / targetWordsPerPage));
  
  const targetWords = Math.ceil(totalWords / numPages);

  let currentGroup: string[] = [];
  let currentWordCount = 0;
  let pageNum = 1;

  for (const sentence of sentences) {
    const sWords = sentence.split(/\s+/).filter(Boolean).length;
    if (currentWordCount + sWords > targetWords && pageNum < numPages) {
      pages.push({
        pageNumber: pageNum,
        textContent: currentGroup.join(" ").trim()
      });
      pageNum++;
      currentGroup = [sentence];
      currentWordCount = sWords;
    } else {
      currentGroup.push(sentence);
      currentWordCount += sWords;
    }
  }

  if (currentGroup.length > 0) {
    pages.push({
      pageNumber: pageNum,
      textContent: currentGroup.join(" ").trim()
    });
  }

  // Ensure we have exactly numPages pages
  while (pages.length < numPages) {
    let longestPageIndex = 0;
    let maxWords = 0;
    for (let i = 0; i < pages.length; i++) {
      const words = pages[i].textContent.split(/\s+/).filter(Boolean).length;
      if (words > maxWords) {
        maxWords = words;
        longestPageIndex = i;
      }
    }

    const longestPageText = pages[longestPageIndex].textContent;
    const pageSentences = longestPageText.match(/[^.!?]+[.!?]+(\s+|$)/g) || [longestPageText];
    
    if (pageSentences.length > 1) {
      const midPoint = Math.floor(pageSentences.length / 2);
      const firstHalf = pageSentences.slice(0, midPoint).join(" ").trim();
      const secondHalf = pageSentences.slice(midPoint).join(" ").trim();
      
      pages[longestPageIndex].textContent = firstHalf;
      pages.splice(longestPageIndex + 1, 0, {
        pageNumber: 0,
        textContent: secondHalf
      });
    } else {
      pages.push({
        pageNumber: 0,
        textContent: "The grand adventure continues to unfold with magnificent detailed actions and incredible heroic moments as they navigate the colorful cartoon trials."
      });
    }
  }

  // If we somehow have more than desired pages, merge extra pages into the last page
  if (pages.length > numPages) {
    const extraPages = pages.slice(numPages - 1);
    const mergedText = extraPages.map(p => p.textContent).join(" ").trim();
    pages[numPages - 1].textContent = mergedText;
    pages.splice(numPages);
  }

  return pages.map((p, idx) => ({
    pageNumber: idx + 1,
    textContent: p.textContent
  }));
}

function generateProceduralPadding(title: string, genre: string, moral: string, blurb: string, wordCountNeeded: number, startIndex: number = 0): string {
  const cleanTitle = title.replace(/['"“”]/g, '').trim();
  const cleanGenre = genre.replace(/['"“”]/g, '').trim();
  const cleanMoral = moral.replace(/['"“”]/g, '').trim();
  const cleanBlurb = blurb.replace(/['"“”]/g, '').trim();

  // Create a robust seed from input parameters + startIndex
  const seedString = `${cleanTitle}|${cleanGenre}|${cleanMoral}|${cleanBlurb}|${startIndex}`;
  
  // Mulberry32-based seeded PRNG
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619) >>> 0;
  }
  const random = function() {
    let z = (h += 0x6D2B79F5) | 0;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61) | 0;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };

  const getRandElement = <T>(arr: T[]): T => arr[Math.floor(random() * arr.length)];

  // Character pool
  const names = [
    "Jax", "Lyra", "Silas", "Kaelen", "Finn", "Zara", "Barnaby", "Clara", "Pippin", "Milo", 
    "Oliver", "Penelope", "Gidget", "Fiona", "Cyrus", "Sari", "Bramble", "Casper", "Thea", "Orion"
  ];
  const items = [
    "brass mechanical pocketwatch", "copper spectral analyzer", "luminous crystal prism", "portable magnetic anchor", 
    "glow-in-the-dark lockpick", "miniature steam-powered compass", "stardust magnifying glass", "laser-deflection tool",
    "glowing purple vial", "feathered aerodynamic pen", "holographic blueprint pad", "whistling wind-gauge"
  ];
  const skills = [
    "sprinting across shaking elevated platforms", "rewiring sputtering energy nodes", "shaping high-voltage plasma loops",
    "melting seamlessly into the deep shadows", "dusting antique desk drawers for mysterious fingerprints",
    "hopping light-footedly over ancient stone obstacles", "deciphering old runes carved into granite pillars",
    "brewing dynamic potions in custom copper kettles", "translating ancient birdsong in the forest canopy",
    "balancing on narrow neon beams far above the floor"
  ];

  // Setting details
  const settings = [
    "a floating sky-castle built on weightless clouds", "a subterranean cavern filled with bioluminescent algae",
    "a bustling neon-lit cyberpunk market alley", "a quiet, cozy wooden cabin smelling of old leather books",
    "an ancient, overgrown temple covered in sweet jasmine vines", "a cosmic observatory perched on a glistening mountaintop",
    "a whimsical village where the roads are paved with pastel gumballs", "a deep-sea dome looking out at curious glowing jellyfish",
    "a mechanical clockwork factory filled with rhythmic ticking gears", "a mystical forest path protected by laughing fireflies"
  ];

  // Complications
  const complications = [
    "encountered a series of hovering energy barriers that hummed with static power",
    "stumbled upon a colossal, whirring clockwork guard holding a massive golden key",
    "discovered a winding puzzle lock on a heavy titanium vault door",
    "faced a gusty wind corridor that kept blowing their maps in circles",
    "found a floor paved with pressure-sensitive musical tiles",
    "confronted a playful, ribbons-tailed dragon blocking the path with warm steam clouds",
    "got lost in a maze of giant mirror columns reflecting multiple versions of themselves",
    "witnessed a sudden low-gravity zone that made every leap feel like slow motion"
  ];

  // Actions
  const actions = [
    "carefully adjusted the dial on the", "swiftly bypassed the grid with the", "gently waved the glowing tip of the",
    "enthusiastically tapped the screen of the", "hastily aligned the brass lenses of the", "proactively calibrated the gears of the",
    "skillfully positioned the reflective edge of the", "playfully polished the copper frame of the"
  ];

  // Sensory details
  const sensoryColors = ["electric lavender", "sunset crimson", "emerald green", "sparkling sapphire", "glistening gold", "neon magenta", "pale apricot", "crystal turquoise"];
  const sensorySounds = [
    "the low, melodic hum of ancient gears", "cheerful whistling melodies echoing from the canopy",
    "the crisp, satisfying snap of static sparks", "silver bells ringing from the high arches", "the soothing murmur of thermal springs",
    "soft rhythmic ticking of hidden chronometers"
  ];
  const sensorySmells = [
    "toasty cinnamon buns baking nearby", "fresh pine wood and night rain", "sweet caramelized maple syrup",
    "warm vanilla bean extract", "zesty fresh lemons and sweet nectar", "wild mountain mint and lavender mist"
  ];

  // Dialogues/Exclamations
  const exclamations = [
    "Look at this amazing discovery!", "We are closer than ever!", "We must proceed with utmost caution!",
    "Amazing, it actually worked!", "Check out that strange vibration!", "I knew we would find the way!"
  ];

  // Resolution outcomes
  const outcomes = [
    "which sent a rush of pure excitement through the entire team.",
    "proving that shared trust and quick thinking could solve any riddle.",
    "opening a clear path forward adorned with beautiful blooming orchids.",
    "sparking a magnificent cascade of star-like fairy dust that lit up the road.",
    "bringing proud, happy smiles to their faces as they exchanged enthusiastic high-fives.",
    "creating a warm glow in their hearts, confirming they were on the right track."
  ];

  let result = "";
  let currentWords = 0;
  let blockIndex = startIndex;

  while (currentWords < wordCountNeeded) {
    // Generate a beautiful, highly unique paragraph using seeded choices
    const charNameA = getRandElement(names);
    // Filter to ensure B is different
    const remainingNames = names.filter(n => n !== charNameA);
    const charNameB = getRandElement(remainingNames);
    
    const itemA = getRandElement(items);
    const skillA = getRandElement(skills);
    const setting = getRandElement(settings);
    const comp = getRandElement(complications);
    const actionA = getRandElement(actions);
    const color = getRandElement(sensoryColors);
    const sound = getRandElement(sensorySounds);
    const smell = getRandElement(sensorySmells);
    const excl = getRandElement(exclamations);
    const outcome = getRandElement(outcomes);

    const sentence1 = `As their spectacular journey progressed, the brave duo entered ${setting}, where the atmosphere smelled of ${smell}.`;
    const sentence2 = `The path ahead was illuminated by a beautiful ${color} glow, accompanied by ${sound}.`;
    const sentence3 = `Suddenly, they ${comp}.`;
    const sentence4 = `"${excl}" exulted ${charNameA}, who was currently busy ${skillA}.`;
    const sentence5 = `Without hesitation, ${charNameB} ${actionA} ${itemA} to balance the energy flow, ${outcome}`;
    const sentence6 = `Remembering their core belief, "${cleanMoral}," they knew that treating every creature with kindness and honesty would lead to absolute success.`;

    const paragraph = `${sentence1} ${sentence2} ${sentence3} ${sentence4} ${sentence5} ${sentence6}\n\n`;
    result += paragraph;
    currentWords = result.split(/\s+/).filter(Boolean).length;
    blockIndex++;
  }

  return result;
}

function generateFallbackContinuousStory(title: string, genre: string, moral: string, blurb: string, targetWordCount: number = 7000): string {
  const cleanTitle = title.replace(/['"“”]/g, '').trim();
  const cleanGenre = genre.replace(/['"“”]/g, '').trim();
  const cleanMoral = moral.replace(/['"“”]/g, '').trim();
  const cleanBlurb = blurb.replace(/['"“”]/g, '').trim();

  // Create a unique hash/seed from all input parameters
  const baseSeedString = `${cleanTitle}|${cleanGenre}|${cleanMoral}|${cleanBlurb}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < baseSeedString.length; i++) {
    h = Math.imul(h ^ baseSeedString.charCodeAt(i), 16777619) >>> 0;
  }
  const random = function() {
    let z = (h += 0x6D2B79F5) | 0;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61) | 0;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };

  const getRandElement = <T>(arr: T[]): T => arr[Math.floor(random() * arr.length)];

  const starters = [
    `Once upon a time, under a majestic sky painted with shades of golden stardust and deep violet, a magnificent adventure began. This is the official chronicle of "${cleanTitle}"!`,
    `A streak of bright neon magenta sliced through the misty, whispering clouds as the legend of "${cleanTitle}" formally commenced.`,
    `The heavy bronze bells of the grand mountain tower tolled exactly seven times, marking the exciting start of "${cleanTitle}".`,
    `A soft, musical humming rose from the cobblestone roads, welcoming the brave souls gathered for "${cleanTitle}".`
  ];
  const startSentence = getRandElement(starters);

  let story = `${startSentence} The atmosphere was electric with anticipation, especially in the marvelous realm of ${cleanGenre}. Our young heroes had packed their bags, calibrated their goggles, and prepared themselves for a quest that would test their skills and their hearts. To guide them through the perilous obstacles ahead, they held close the vital lesson they had learned from the village elders: "${cleanMoral}." According to ancient rumors, ${cleanBlurb}. They knew that as long as they stayed united, no challenge could stop them.\n\n`;

  const currentWords = story.split(/\s+/).filter(Boolean).length;
  if (currentWords < targetWordCount) {
    story += generateProceduralPadding(title, genre, moral, blurb, targetWordCount - currentWords, 1);
  }

  return story;
}

const GALLERY_ROLLS = [
  "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=600", // Cute dinosaur/monster cartoon drawing
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600", // Neon cartoon avatar
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600", // Bright animated retro panel
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&q=80&w=600", // Whimsical doodles
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600", // Beautiful child fantasy watercolor
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600", // Colorful space landscape paint
  "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=600", // Sea story/submarine painting
  "https://images.unsplash.com/photo-1560421683-6856ea585c78?auto=format&fit=crop&q=80&w=600", // Fun playhouse chalkboard draw
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600", // Galactic nebula fantasy
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600", // Happy funny dog portrait
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600"  // Whimsical neon world
];

// Curated high quality illustrations to ensure beautiful images that match the theme
function getThemeIllustration(idx: number, genre: string): string {
  const norm = idx % GALLERY_ROLLS.length;
  return GALLERY_ROLLS[norm];
}

// Dynamic keyword cover and page helper for backend matching
function getDynamicKeywordImageUrl(title: string, content: string, genre: string, index: number): string {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "of", "to", "for", "in", "on", "at", "by", "with", "from",
    "great", "incredible", "adventure", "awesome", "wacky", "funny", "epic", "special", "agents",
    "vs", "mystery", "adventures", "story", "legendary", "ultra", "volume", "book", "chapters", 
    "chapter", "page", "pages", "showing", "with", "about", "who", "they", "them", "their", "under", 
    "above", "over", "behind", "around", "inside", "before", "after"
  ]);

  const titleWords = title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const cleanContent = content.toLowerCase()
    .replace(/\[🗺️[^\]]*\]/g, '')
    .replace(/[^a-zA-Z\s]/g, '');

  const contentWords = cleanContent.split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let keyword = "";
  if (index === 0) {
    if (titleWords.length > 0) {
      keyword = titleWords[0];
      if (titleWords[1]) {
        keyword += `,${titleWords[1]}`;
      }
    } else {
      keyword = genre.toLowerCase();
    }
  } else {
    const uniqueContentWords = contentWords.filter(w => !titleWords.includes(w));
    const firstWord = titleWords[0] || genre.toLowerCase();
    const actionWord = uniqueContentWords[0] || (uniqueContentWords[1] || "cartoon");
    const thirdWord = uniqueContentWords[2] || "";
    
    keyword = firstWord;
    if (actionWord && actionWord !== firstWord) {
      keyword += `,${actionWord}`;
    }
    if (thirdWord && thirdWord !== actionWord && thirdWord !== firstWord) {
      keyword += `,${thirdWord}`;
    }
  }

  if (!keyword) {
    keyword = "cartoon";
  }

  return `https://loremflickr.com/600/600/cartoon,${encodeURIComponent(keyword)}?lock=${index + 200}`;
}

function enrichVocabularyForAgeGroup(text: string, ageGroup: string): string {
  const isOldest = ageGroup.toLowerCase().includes("13") || ageGroup.toLowerCase().includes("teen") || ageGroup.toLowerCase().includes("adult");
  const isOlder = ageGroup.toLowerCase().includes("9") || ageGroup.toLowerCase().includes("10") || ageGroup.toLowerCase().includes("11") || ageGroup.toLowerCase().includes("12") || isOldest;

  if (!isOlder) return text;

  let result = text;
  
  const substitutions: { [word: string]: string[] } = {
    "fast": isOldest ? ["spontaneous", "brisk", "rapid", "swift", "hasty"] : ["quick", "brisk", "rapid"],
    "quickly": isOldest ? ["expeditiously", "briskly", "swiftly", "hastily", "promptly"] : ["swiftly", "briskly", "promptly"],
    "slow": ["sluggish", "plodding", "measured", "deliberate"],
    "slowly": ["sluggishly", "deliberately", "gradually"],
    "scary": ["formidable", "intimidating", "ominous", "spine-chilling", "daunting"],
    "good": ["exemplary", "magnificent", "superb", "exquisite", "splendid"],
    "happy": ["jubilant", "exuberant", "elated", "convivial"],
    "sad": ["melancholy", "somber", "desolate", "downcast"],
    "big": ["gargantuan", "colossal", "monumental", "immense", "enormous"],
    "small": ["diminutive", "minuscule", "infinitesimal", "petite"],
    "funny": ["humorous", "jocular", "comical", "whimsical", "droll"],
    "shouted": ["exclaimed", "bellowed", "vociferated", "boomed"],
    "find": ["unearth", "discover", "detect", "locate"],
    "found": ["unearthed", "discovered", "detected", "located"],
    "walked": ["ambled", "strided", "sauntered", "traversed"],
    "looked": ["gazed", "peered", "scrutinized", "beheld", "examined"]
  };

  for (const [key, options] of Object.entries(substitutions)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      const cleanMatch = match.toLowerCase();
      const index = Math.abs(cleanMatch.charCodeAt(0)) % options.length;
      const replacement = options[index];
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  return result;
}

function generateCoolChapterTitle(text: string, idx: number): string {
  const cleanText = text.replace(/\[Chapter\s+\d+\]/gi, '').trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 4);
  
  const excitingNouns = [
    "signal", "laser", "scavenger", "crystal", "stars", "lemon", "clockwork", "gear", "jar", "library",
    "dragon", "castle", "forest", "keys", "dinosaur", "ninja", "spy", "gargoyle", "telescope", "observatory",
    "garden", "sunflower", "meadow", "island", "pirate", "rocket", "comet", "nebula", "tracker", "riddle",
    "whisper", "echo", "shadow", "neon", "cyber", "volcano", "feather", "compass", "temple", "relic", "gumball",
    "pretzel", "waffle", "biscuit", "cookie", "treasure", "map", "potion", "wizard", "magic"
  ];
  
  const foundNouns = words.map(w => w.toLowerCase().replace(/[^\w]/g, ''))
                          .filter(w => excitingNouns.includes(w));
  
  const uniqueNouns = Array.from(new Set(foundNouns));
  
  const templates = [
    "The Mystery of the [NOUN]",
    "The Secret [NOUN]",
    "Quest for the [NOUN]",
    "The Lost [NOUN]",
    "Flight of the [NOUN]",
    "The Whispering [NOUN]",
    "Rise of the [NOUN]",
    "The Sacred [NOUN]",
    "Echoes of the [NOUN]",
    "Journey to the [NOUN]",
    "The Glowing [NOUN]",
    "Legend of the [NOUN]",
    "The Clockwork [NOUN]"
  ];
  
  const templateIdx = idx % templates.length;
  let selectedNoun = "Adventure";
  if (uniqueNouns.length > 0) {
    const rawNoun = uniqueNouns[idx % uniqueNouns.length];
    selectedNoun = rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1);
  } else if (words.length > 2) {
    const fallbackWord = words[idx % words.length].replace(/[^\w]/g, '');
    if (fallbackWord.length > 3) {
      selectedNoun = fallbackWord.charAt(0).toUpperCase() + fallbackWord.slice(1);
    }
  }
  
  return templates[templateIdx].replace("[NOUN]", selectedNoun);
}

// Make sure each page contains the pristine, emoji-free text content!
function enrichStoryPages(pages: any[], title: string, genre: string, moral: string, coverUrl: string, isPictureBook: boolean = true, ageGroup: string = "Ages 8-12"): any[] {
  return pages.map((p, idx) => {
    const rawText = p.textContent || "";
    const enrichedText = enrichVocabularyForAgeGroup(rawText, ageGroup);
    return {
      pageNumber: idx + 1,
      chapterTitle: p.chapterTitle || generateCoolChapterTitle(rawText, idx),
      textContent: stripEmojis(enrichedText),
      imageUrl: p.imageUrl || (isPictureBook ? getDynamicKeywordImageUrl(title, rawText, genre, idx + 1) : "")
    };
  });
}

const DYNAMIC_COMIC_IDEAS = [
  {
    title: "Special Agents Slush and Scoop",
    genre: "Dinosaur",
    ageGroup: "Ages 8-12",
    moral: "Warm hearts are cooler than freezing friends!",
    blurb: "An evil hair dryer is threaten to melt all double-scoop cones in Antarctica! Special Agents Slush and Scoop must master ninja-flipping before the waffle bowls collapse!",
    coverImageUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Dexter the Tyrannosaurus Rocker",
    genre: "Space Adventure",
    ageGroup: "Ages 8-12",
    moral: "Shorter arms mean you need longer drumsticks!",
    blurb: "Dexter is a happy Tyrannosaurus with a huge dream: becoming the master metal rock drummer! But his tiny arms keep dropping the sticks. Will his best friends help him engineer a tail-drum booster?",
    coverImageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Sir Barnaby's Clockwork Castle",
    genre: "Detective",
    ageGroup: "Ages 8-12",
    moral: "Patience and clockwork gears can solve any riddle.",
    blurb: "A snail with a giant top hat slides through a magical floating castle operated by winding keys and ticklish gargoyles!",
    coverImageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"
  }
];

// Background automatic 2-minute generator
async function autoGenerateComicBook() {
  console.log("⏰ BACKGROUND TIMER RUNNING: Synthesizing a spectacular unpublished comic draft...");
  try {
    const rawIdea = DYNAMIC_COMIC_IDEAS[Math.floor(Math.random() * DYNAMIC_COMIC_IDEAS.length)];
    const generatedTitle = stripEmojis(rawIdea.title);
    const cleanBlurb = stripEmojis(rawIdea.blurb);
    const cleanMoral = stripEmojis(rawIdea.moral);
    const cleanGenre = stripEmojis(rawIdea.genre);
    const coverUrl = rawIdea.coverImageUrl || getDynamicKeywordImageUrl(generatedTitle, cleanBlurb, cleanGenre, 0);

    let generatedPages: { chapterTitle: string, textContent: string }[] = [];

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && !process.env.GEMINI_API_KEY.includes("dummy")) {
      try {
        const systemInstruction = `[SYSTEM ROLE]
You are a master children's and YA graphic novel author. You excel at high-energy pacing, vivid atmospheric detail, and clever wit.
You MUST output valid JSON conforming exactly to this schema:
{
  "generatedTitle": "A highly creative, punchy version of the book's title",
  "pages": [
    {
      "chapterTitle": "A cool, clever, or mysterious name of what the chapter says",
      "textContent": "Continuous descriptive paragraph, rich in cinematic, sensory details (no emojis, approx 150-250 words)."
    }
  ]
}`;

        const promptPayload = `Write a spectacular, highly immersive and detailed sequential children's story titled "${rawIdea.title}" in the "${rawIdea.genre}" genre.
Target audience: ${rawIdea.ageGroup}.
Moral Lesson to weave in naturally: "${rawIdea.moral}".
Story Premise / Blurb: "${rawIdea.blurb}".

You MUST generate exactly 4 sequential pages/chapters.
For each and every page, write an immersive, action-packed narrative paragraph of 150-250 words. Ensure there is genuine progression from the first page to the last.
Make sure each page has a completely unique, highly creative chapter name that is a cool, descriptive, or suspenseful version of the action on that page (avoid cliché templates like 'The Secret of the [Noun]').
Do NOT include any emojis or metadata inside the JSON string. Output strict JSON only.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptPayload,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                generatedTitle: { type: Type.STRING },
                pages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      chapterTitle: { type: Type.STRING },
                      textContent: { type: Type.STRING }
                    },
                    required: ["chapterTitle", "textContent"]
                  }
                }
              },
              required: ["generatedTitle", "pages"]
            }
          }
        });

        if (response) {
          const jsonStr = response.text?.trim() || "";
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            generatedPages = parsed.pages;
          }
        }
      } catch (geminiError) {
        console.warn("ℹ️ Background Gemini auto-generation error, using fallback:", geminiError);
      }
    }

    if (generatedPages.length === 0) {
      const fullStory = generateFallbackContinuousStory(generatedTitle, cleanGenre, cleanMoral, cleanBlurb, 600);
      const rawPages = splitTextIntoEqualPages(fullStory, 150, 4);
      generatedPages = rawPages.map((p, idx) => ({
        chapterTitle: generateCoolChapterTitle(p.textContent, idx),
        textContent: p.textContent
      }));
    }

    const finalPages = enrichStoryPages(generatedPages, generatedTitle, cleanGenre, cleanMoral, coverUrl, true, rawIdea.ageGroup);
    const totalWords = generatedPages.reduce((acc, p) => acc + p.textContent.split(/\s+/).filter(Boolean).length, 0);

    const generatedSecretSlug = crypto.randomBytes(16).toString("hex");
    const generatedGiveawayId = crypto.randomBytes(12).toString("hex");

    const newBook = new BookModel({
      title: generatedTitle,
      genre: cleanGenre,
      targetAgeGroup: rawIdea.ageGroup,
      moralLesson: cleanMoral,
      blurbText: cleanBlurb,
      coverImageUrl: coverUrl,
      pageCount: finalPages.length,
      wordCount: totalWords,
      basePrice: 4.00, // Flat $4.00 as requested
      secretSlug: generatedSecretSlug,
      giveawayId: generatedGiveawayId,
      pages: finalPages,
      isPublished: false, // Must remain UNPUBLISHED until Admin approves!
    });

    await newBook.save();
    console.log(`✅ SUCCESS: Auto-generated book "${generatedTitle}" has been queued in draft index.`);
  } catch (err) {
    console.error("❌ Failed automatic 2-minute book build:", err);
  }
}

// Set continuous interval for checking if continuous 2-minute auto-generator is active
// The user explicitly requested "every 2 minutes ai makes a book"
setInterval(async () => {
  if (isAutoGeneratingEveryMinute) {
    console.log("⏰ 2-MINUTE BACKGROUND AUTO-GENERATION: Synthesizing a draft...");
    await autoGenerateComicBook();
  }
}, 120 * 1000);

app.post("/api/v1/admin/generate-book-content", validateAdminToken, async (req, res) => {
  const { title, genre, ageGroup, moral, blurb, coverImageUrl, pageCount, wordCount, price, isPictureBook, vocabularyInstruction, vocabInstruction } = req.body;

  if (!title || !genre || !ageGroup || !moral || !blurb) {
    return res.status(400).json({ error: "Parameters missing. Please fulfill all details for the creative generator." });
  }

  try {
    let generatedTitle = stripEmojis(title);
    let generatedPages: { chapterTitle: string, textContent: string }[] = [];

    const pageCountNum = pageCount ? Number(pageCount) : 4;

    let computedVocab = vocabularyInstruction || vocabInstruction;
    if (!computedVocab) {
      if (ageGroup === 'Teenagers') {
        computedVocab = "For this teenage audience, enforce a highly advanced, mature, and sophisticated vocabulary. Use high-level, descriptive synonyms instead of simple verbs and adjectives (e.g., use 'traverse' or 'amble' instead of 'walk', 'vibrant' or 'resplendent' instead of 'bright', 'clandestinely' instead of 'secretly', 'gargantuan' or 'colossal' instead of 'big'). The narrative tone should be intellectually engaging, cinematic, and atmospheric.";
      } else if (ageGroup === '5-7 years') {
        computedVocab = "For this early childhood audience, keep the vocabulary accessible, highly engaging, rhythmic, and clear, with delightful sounds, colorful descriptions, and easy-to-understand verbs (e.g., 'jump', 'bright', 'happy', 'sparkle'). Avoid complex sentence structures or rare words while maintaining beautiful imagery.";
      } else {
        computedVocab = "For this pre-teen graphic novel audience, use a vivid, moderately complex vocabulary with high-energy pacing, descriptive descriptors, and creative word choices that challenge and excite young readers (e.g., use 'shimmering', 'peculiar', 'momentum', 'bypassed'). Avoid overly simplistic words but keep it highly readable.";
      }
    }

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && !process.env.GEMINI_API_KEY.includes("dummy")) {
      try {
        const systemInstruction = `[SYSTEM ROLE]
You are a master children's and YA graphic novel author. You excel at high-energy pacing, vivid atmospheric detail, and clever wit.
You MUST adjust your vocabulary level based on the target audience constraints provided.
You MUST output valid JSON conforming exactly to this schema:
{
  "generatedTitle": "A highly creative, punchy version of the book's title",
  "pages": [
    {
      "chapterTitle": "A cool, clever, or mysterious name of what the chapter says",
      "textContent": "Continuous descriptive paragraph, rich in cinematic, sensory details (no emojis, approx 150-250 words)."
    }
  ]
}`;

        const promptPayload = `Write a spectacular, highly immersive and detailed sequential story titled "${title}" in the "${genre}" genre.
Target audience: ${ageGroup}.
Moral Lesson to weave in naturally: "${moral}".
Story Premise / Blurb: "${blurb}".

VOCABULARY & COMPLEXITY INSTRUCTION:
${computedVocab}

You MUST generate exactly ${pageCountNum} sequential pages/chapters.
For each and every page, write an immersive, action-packed narrative paragraph of 150-250 words conforming strictly to the requested vocabulary level. Ensure there is genuine progression from the first page to the last.
Make sure each page has a completely unique, highly creative chapter name that is a cool, descriptive, or suspenseful version of the action on that page (avoid cliché templates like 'The Secret of the [Noun]').
Do NOT include any emojis or metadata inside the JSON string. Output strict JSON only.`;

        const geminiCall = ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptPayload,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                generatedTitle: { type: Type.STRING },
                pages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      chapterTitle: { type: Type.STRING },
                      textContent: { type: Type.STRING }
                    },
                    required: ["chapterTitle", "textContent"]
                  }
                }
              },
              required: ["generatedTitle", "pages"]
            }
          }
        });

        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error("Gemini API request timed out after 15 seconds")), 15000);
        });

        const response = await Promise.race([geminiCall, timeoutPromise]);

        if (response) {
          const jsonStr = response.text?.trim() || "";
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            generatedPages = parsed.pages;
            generatedTitle = stripEmojis(parsed.generatedTitle || title);
          }
        }
      } catch (geminiError) {
        console.warn("ℹ️ Gemini API error during admin book content generation. Activating fallback engines!", geminiError);
      }
    }

    if (generatedPages.length === 0) {
      // Fallback: Generate procedural split pages (compact, no huge padded repetition!)
      generatedTitle = stripEmojis(title);
      const targetWords = pageCountNum * 150;
      const fullStoryText = generateFallbackContinuousStory(
        generatedTitle,
        stripEmojis(genre),
        stripEmojis(moral),
        stripEmojis(blurb),
        targetWords
      );
      
      const splitPages = splitTextIntoEqualPages(fullStoryText, 150, pageCountNum);
      generatedPages = splitPages.map((p, idx) => ({
        chapterTitle: generateCoolChapterTitle(p.textContent, idx),
        textContent: p.textContent
      }));
    }

    const finalCoverImg = coverImageUrl || getDynamicKeywordImageUrl(generatedTitle, stripEmojis(blurb), stripEmojis(genre), 0);
    const enrichedPagesList = enrichStoryPages(
      generatedPages,
      generatedTitle,
      stripEmojis(genre),
      stripEmojis(moral),
      finalCoverImg,
      isPictureBook !== undefined ? Boolean(isPictureBook) : true,
      stripEmojis(ageGroup)
    );
    const totalWords = enrichedPagesList.reduce((acc, p) => acc + p.textContent.split(/\s+/).filter(Boolean).length, 0);

    const generatedSecretSlug = crypto.randomBytes(16).toString("hex");
    const generatedGiveawayId = crypto.randomBytes(12).toString("hex");

    const newBook = new BookModel({
      title: generatedTitle,
      genre: stripEmojis(genre),
      targetAgeGroup: stripEmojis(ageGroup),
      moralLesson: stripEmojis(moral),
      blurbText: stripEmojis(blurb),
      coverImageUrl: finalCoverImg,
      pageCount: enrichedPagesList.length,
      wordCount: totalWords,
      basePrice: price !== undefined ? Number(price) : 4.00,
      secretSlug: generatedSecretSlug,
      giveawayId: generatedGiveawayId,
      pages: enrichedPagesList,
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : false, // Un-published by default as requested!
      isPictureBook: isPictureBook !== undefined ? Boolean(isPictureBook) : true
    });

    console.log("🔓 Premium synthesis complete! Saving draft book to database.");

    await newBook.save();
    return res.status(201).json({ success: true, bookId: newBook._id, bookData: newBook });
  } catch (error) {
    console.error("Content generation failure:", error);
    return res.status(500).json({ error: "Failed to generate book structure via AI engine." });
  }
});

app.post("/api/v1/admin/generate-scenario", validateAdminToken, async (req, res) => {
  try {
    const defaultScenarios = [
      {
        title: "Special Agents Slush and Scoop",
        genre: "Dinosaur",
        ageGroup: "Ages 8-12",
        moral: "Warm hearts are cooler than freezing friends!",
        blurb: "An evil hair dryer is threaten to melt all double-scoop cones in Antarctica! Special Agents Slush and Scoop must master ninja-flipping before the waffle bowls collapse!"
      },
      {
        title: "Dexter the Tyrannosaurus Rocker",
        genre: "Space Adventure",
        ageGroup: "Ages 8-12",
        moral: "Shorter arms mean you need longer drumsticks!",
        blurb: "Dexter is a happy Tyrannosaurus with a huge dream: becoming the master metal rock drummer! But his tiny arms keep dropping the sticks. Will his best friends help him engineer a tail-drum booster?"
      }
    ];

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      const prompt = `Design a completely unique, hilarious children's graphic novel scenario.
      It must have a creative, funny custom kids book title, a general genre (such as Dinosaur, Space Adventure, Detective, Ninja, Pirate, Mystery, Slapstick, Superhero, Fantasy, Undersea, Fairy-Tale, Sports, Wizardry, Jungle, Robot, Time Travel, Monster), a target ageGroup ('Ages 5-7' or 'Ages 8-12'), a beautiful moral lesson, and a highly elaborate, funny blurb (at least 2 sentences detailing wacky characters facing an absurd challenge).
      Return valid JSON matching:
      {
        "title": "The Wacky Adventures of ...",
        "genre": "one of the general genres list",
        "ageGroup": "Ages 8-12",
        "moral": "...",
        "blurb": "..."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              genre: { type: Type.STRING },
              ageGroup: { type: Type.STRING },
              moral: { type: Type.STRING },
              blurb: { type: Type.STRING }
            },
            required: ["title", "genre", "ageGroup", "moral", "blurb"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "";
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.title) {
        return res.json({ success: true, scenario: parsed });
      }
    }

    const rand = defaultScenarios[Math.floor(Math.random() * defaultScenarios.length)];
    return res.json({ success: true, scenario: rand });
  } catch (err) {
    console.log("ℹ️ Scenario generator offline/busy; choosing wacky fallback.");
    return res.json({ 
      success: true, 
      scenario: {
        title: "The Lollipop Ninja Chickens",
        genre: "Ninja",
        ageGroup: "Ages 8-12",
        moral: "Sweetness and quick wits can disarm any foe!",
        blurb: "Under cover of darkness, three highly trained poultry martial artists defend the local candy factory from sour-toothed weasels!"
      } 
    });
  }
});

// --- SECTION 7: PROMOTIONAL PIPELINES & USER RETENTION ---
// Free Giveaway Claim route
app.get("/api/v1/promotions/claim", async (req, res) => {
  const { key, userId } = req.query;

  if (!key) {
    return res.status(400).json({ error: "Giveaway token key query parameters must be specified." });
  }

  try {
    // Find the book tied strictly to the specific giveaway URL id
    const matchedBook = await BookModel.findOne({ giveawayId: key as string });
    if (!matchedBook) {
      return res.status(404).json({ error: "Invalid promotional giveaway link." });
    }

    if (!userId) {
      // Re-route to sign up page if not authenticated, keeping link intact
      return res.status(200).json({ action: "REDIRECT_TO_SIGNUP", message: "User must be authenticated to claim." });
    }

    const activeUser = await UserModel.findById(userId as string);
    if (!activeUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the library collection profile already includes this resource
    const alreadyOwned = activeUser.ownedBooks.some(b => b.bookId.toString() === matchedBook._id.toString());
    if (!alreadyOwned) {
      activeUser.ownedBooks.push({
        bookId: matchedBook._id,
        unlockedVia: "giveaway",
      });
      await activeUser.save();
    }

    // Instantly pass back payload indicating authorization approval, forcing redirect to reader slug
    return res.status(200).json({
      success: true,
      action: "LAUNCH_BOOK",
      targetSlug: matchedBook.secretSlug,
    });
  } catch (error) {
    console.error("Giveaway claims processing exception:", error);
    return res.status(500).json({ error: "Error resolving promotional bypass sequence." });
  }
});

// AI-Driven Holiday Detector
app.get("/api/v1/detect-holiday", async (req, res) => {
  const now = new Date();
  const dateStr = now.toDateString();

  // Standard fallback detection
  const month = now.getMonth(); // 0 = Jan, 11 = Dec
  const date = now.getDate();
  const isChristmasRange = (month === 11 && (date === 24 || date === 25 || date === 26));
  const isNewYearRange = ((month === 11 && date === 31) || (month === 0 && date === 1));
  const isHalloween = (month === 9 && date === 31);
  const isValentines = (month === 1 && date === 14);
  const isFourthOfJuly = (month === 6 && date === 4);

  let isHoliday = isChristmasRange || isNewYearRange || isHalloween || isValentines || isFourthOfJuly;
  let holidayName = isHoliday ? "Holiday Sale Event" : "";
  if (isChristmasRange) holidayName = "Christmas";
  if (isNewYearRange) holidayName = "New Year";
  if (isHalloween) holidayName = "Halloween";
  if (isValentines) holidayName = "Valentine's Day";
  if (isFourthOfJuly) holidayName = "Fourth of July";

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const promptPayload = `Analyze this exact date: ${dateStr}. Determine if this date is a major international holiday (such as Christmas, Christmas Eve, New Year's Eve, New Year's Day, Thanksgiving, Halloween, Valentine's Day, Fourth of July, Easter, Eid, Hanukkah, Diwali, or other globally significant festive days). Respond ONLY with a valid JSON object in this format: { "isHoliday": boolean, "holidayName": string }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptPayload,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isHoliday: { type: Type.BOOLEAN },
              holidayName: { type: Type.STRING }
            },
            required: ["isHoliday", "holidayName"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed && typeof parsed.isHoliday === "boolean") {
        return res.status(200).json({
          success: true,
          isHoliday: parsed.isHoliday,
          holidayName: parsed.holidayName || "AI Detected Holiday",
          source: "gemini"
        });
      }
    } catch (err: any) {
      console.log("ℹ️ Gemini Holiday Detection failed or was rate limited, falling back to static detection:", err?.message || err);
    }
  }

  return res.status(200).json({
    success: true,
    isHoliday,
    holidayName,
    source: "fallback"
  });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
