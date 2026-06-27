import express from "express";
import path from "path";
import crypto from "crypto";
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const existing = await UserModel.findOne({ email });
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
      email,
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
    const user = await UserModel.findOne({ email });
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

function generateFallbackContinuousStory(title: string, genre: string, moral: string, blurb: string, targetWordCount: number = 7000): string {
  const cleanTitle = title.replace(/['"“”]/g, '');
  const cleanGenre = genre.replace(/['"“”]/g, '');
  const cleanMoral = moral.replace(/['"“”]/g, '');

  let story = `Once upon a time, under a sky glowing with beautiful pink and golden clouds, a grand adventure began. In a wonderful place filled with ${cleanGenre}, everything was buzzing with happy excitement. This was the legendary tale of "${cleanTitle}"! Houses made of colorful blocks lined the cobblestone pathways, and sweet-smelling flowers bloomed in every garden. Tiny clockwork butterflies flitted from blossom to blossom, casting warm glowing sparkles. Today, our bright young heroes gathered at the town square, preparing for their greatest journey yet. They stood on the steps of the giant library, looking out at the friendly, welcoming valley. The sun was shining warmly, and a gentle breeze brought the scent of fresh cinnamon buns from the bakery. Every single person in the community had gathered to cheer them on, handing them a wooden compass painted with bright stars. To succeed, they knew they must remember their grandfather's wise words: "${cleanMoral}." `;

  const paragraphs = [
    `With a cheerful wave to the crowd, the adventurers set off. Their path led them through the heart of the magical valley of ${cleanGenre}, where the trees grew tall like candy canes and the streams bubbled with strawberry soda. 'Let's stick together!' shouted the leader, their boots bouncing on the soft, mossy earth. Every corner of this wonderful land presented a beautiful surprise. Giant colorful bubbles floated down from the mountaintops, gently carrying little clockwork toys that would whistle friendly tunes as they floated past. One bubble had a tiny wooden boat inside, spinning happily. Our heroes timed their hops, bouncing lightly from one giant bubble to another with spectacular agility. They worked together beautifully, holding hands and helping each other cross the sparkling streams just as the friendly turtles came out to swim.`,
    `The trail soon wound into a magical forest where glowing paper lanterns hung from the branches, illuminating the path with soft, warm light. In this mystical place, they discovered a path made of giant, musical piano keys painted with funny cartoon characters. Each key made a delightful sound when stepped on—plink, plank, plunk! 'Follow the rhythm of the blue puppy keys!' the partner giggled, pointing to a key that was glowing with a friendly sky-blue light. Together, they danced across the keyboard, composing a beautiful, happy melody that made the forest trees sway and rustle. A group of fluffy, sleepy sloths poked their heads out of the branches, clapping their hands in slow, cozy rhythm. The adventurers laughed, throwing their hands in the air as they completed the musical puzzle, unlocking a hidden gate decorated with bright yellow sunflowers.`,
    `Just as they reached the sunlit meadow, they met a giant, gentle clockwork dragon decorated with colorful gears and spinning paper windmills. It wasn't scary at all; it had big, friendly green eyes and a tail made of soft ribbons. 'Welcome, brave travelers!' the dragon hummed in a deep, cozy voice that sounded like a purring cat. 'To climb the mountain, you must show me your best teamwork and the kindness in your hearts.' Our heroes smiled warmly. Remembering their guiding star, "${cleanMoral}," they didn't run away or get upset. Instead, they stepped forward to offer the dragon a basket of sweet, shiny berries they had gathered along the way. The gentle giant let out a happy puff of strawberry-scented steam, its gears whirring with cheerful clicks. It lowered its soft, mossy wing, inviting them to climb aboard for a magnificent ride up to the sky-castle.`,
    `Soaring high above the clouds on the dragon's back, they watched the beautiful valley of ${cleanGenre} glow in the golden evening light. They reached the top of the mountain just as the stars began to twinkle like diamonds. The village elders were waiting at the gate with a magnificent feast of double-scoop ice cream cones, dancing gingerbread cookies, and warm apple cider. The brave adventurers had completed their quest, showing everyone that with patience, friendship, and teamwork, they could turn any big challenge into a beautiful, town-wide festival of joy. The wise words of "${cleanMoral}" were celebrated by all, and they lived happily ever after, ready for the next spectacular story!`,
    `As they entered the grand hallway of the ancient castle, they noticed that the walls were decorated with glowing paintings of past heroes who had mastered the art of ${cleanGenre}. Each painting seemed to whisper encouraging words, urging them forward. They walked on soft, velvet carpets that felt like stepping on fluffy clouds. Suddenly, a friendly clockwork owl flapped down from a high rafter, landing gracefully on the leader's shoulder. It blinked its shiny brass eyes and offered them a brass key decorated with a tiny sparkling ruby. 'This key unlocks the cabinet of infinite story pages,' the owl hooted softly. Our heroes thanked the owl warmly, understanding that every step forward brought them closer to uncovering the ultimate secret of the realm, proving that their dedication was indeed the key to unlocking the true potential of their hearts.`,
    `Continuing deeper into the castle, they discovered a grand observatory with a massive brass telescope pointing towards the starlit sky. The ceiling was a dome of deep blue velvet, decorated with thousands of twinkling crystal stars that shifted and aligned themselves as the adventurers moved. Through the lens, they could see the distant spinning worlds of the ${cleanGenre} galaxy, glowing with vibrant shades of teal, neon pink, and bright yellow. It was a sight of breathtaking beauty. They felt so tiny yet so connected to the vast universe around them, realizing that their small adventure was part of a much larger, beautiful cosmic dance of joy and imagination that would continue for generations to come.`,
    `In the next room, they found a glowing garden under a glass dome, where the plants were made of sparkling glass fibers that hummed with a soft, musical tone. Golden pollen drifted like fireflies through the air, casting gentle shadows on the stone floor. Here grew the legendary sunflower of courage, its petals made of warm, glowing gold. The adventurers stood in awe, feeling the warm energy radiating from the magnificent flower. They realized that the courage they sought was already within them, nurtured by their experiences and their shared commitment to helping each other succeed through every single hurdle they faced.`,
    `They climbed a winding spiral staircase made of solid white marble, each step decorated with beautiful carvings of playful animals. As they ascended, the air became crisp and clear, filled with the fresh scent of mountain pine and sparkling starlight. They could hear the distant sound of silver bells ringing, celebrating their journey and guiding their path upward. When they finally reached the top balcony, they looked out over the entire land, their hearts filled with a profound sense of gratitude and accomplishment, ready to share their incredible story of "${cleanTitle}" with the world.`
  ];

  let currentWords = story.split(/\s+/).filter(Boolean).length;
  let counter = 0;

  while (currentWords < targetWordCount) {
    const baseParagraph = paragraphs[counter % paragraphs.length];
    const variation = ` [Saga Chapter ${Math.floor(counter / paragraphs.length) + 1}, Episode ${counter + 1}]: Furthermore, during this phase of the grand saga, the adventurers encountered more wonders of ${cleanGenre}. They learned that every single obstacle could be overcome when keeping their core promise: "${cleanMoral}". They navigated through sparkling rivers of orange juice and climbed tall chocolate hills, singing happy songs that echoed through the canyons. Each step they took was filled with magical energy and laughter. `;
    const paragraphWithVariation = baseParagraph + variation;
    story += paragraphWithVariation;
    currentWords = story.split(/\s+/).filter(Boolean).length;
    counter++;
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

// Make sure each page contains the pristine, emoji-free text content!
function enrichStoryPages(pages: any[], title: string, genre: string, moral: string, coverUrl: string, isPictureBook: boolean = true): any[] {
  return pages.map((p, idx) => ({
    pageNumber: idx + 1,
    textContent: stripEmojis(p.textContent || ""),
    imageUrl: isPictureBook 
      ? (p.imageUrl || getDynamicKeywordImageUrl(title, p.textContent || "", genre, idx + 1))
      : ""
  }));
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

    const fullStory = generateFallbackContinuousStory(generatedTitle, cleanGenre, cleanMoral, cleanBlurb, 15000);
    const rawPages = splitTextIntoEqualPages(fullStory, 150);
    const finalPages = enrichStoryPages(rawPages, generatedTitle, cleanGenre, cleanMoral, coverUrl);
    const totalWords = rawPages.reduce((acc, p) => acc + p.textContent.split(/\s+/).filter(Boolean).length, 0);

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
  const { title, genre, ageGroup, moral, blurb, coverImageUrl, pageCount, wordCount, price, isPictureBook } = req.body;

  if (!title || !genre || !ageGroup || !moral || !blurb) {
    return res.status(400).json({ error: "Parameters missing. Please fulfill all details for the creative generator." });
  }

  try {
    const systemInstruction = `[SYSTEM ROLE]
You are an expert children's graphic novel and storybook author. Master children's high-energy humor and rich detailed prose.
Output valid JSON, matching:
{
  "generatedTitle": "Wacky title",
  "fullStoryText": "Continuous story text..."
}`;

    const targetWords = wordCount ? Number(wordCount) : 4000;
    const promptPayload = `Create a spectacular, high-energy children's adventure story with a rich, highly detailed continuous narrative of approximately ${targetWords} words. 
Do NOT include any emojis, chapter titles, or page headings.
Avoid any meta-references to the book's blurb, summary, or AI generation instructions inside the text.
Write with incredible, deep, cinematic detail. Instead of simple sentences like "they ran away", paint the action with intense sensory immersion and energy: describe their rapid breathing, the roaring sounds around them, vaulting over rusted chain-link fences, and dissolving into neon city center shadows. Dig deep into every single action and reaction!

Title requested: ${title}
Genre: ${genre}
Target Age Group: ${ageGroup}
Moral Lesson: ${moral}
Blurb: ${blurb}

Output matching JSON immediately.`;

    let generatedTitle = stripEmojis(title);
    let fullStoryText = "";

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && !process.env.GEMINI_API_KEY.includes("dummy")) {
      try {
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
                fullStoryText: { type: Type.STRING }
              },
              required: ["generatedTitle", "fullStoryText"]
            }
          }
        });

        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error("Gemini API request timed out after 10 seconds")), 10000);
        });

        const response = await Promise.race([geminiCall, timeoutPromise]);

        if (response) {
          const jsonStr = response.text?.trim() || "";
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.fullStoryText) {
            fullStoryText = parsed.fullStoryText;
            generatedTitle = stripEmojis(parsed.generatedTitle || title);
          }
        }
      } catch (geminiError) {
        console.log("ℹ️ Gemini API is currently offline, busy, or timed out. Activating high-style comic story fallback engines!");
      }
    }

    if (!fullStoryText) {
      generatedTitle = stripEmojis(title);
      fullStoryText = generateFallbackContinuousStory(
        generatedTitle,
        stripEmojis(genre),
        stripEmojis(moral),
        stripEmojis(blurb),
        wordCount ? Number(wordCount) : 10000
      );
    }

    // Ensure we meet the wordCount target perfectly if it's less than targetWords
    let currentWords = fullStoryText.split(/\s+/).filter(Boolean).length;
    if (currentWords < targetWords) {
      console.log(`Padding story from ${currentWords} words to target ${targetWords} words...`);
      let counter = 0;
      const paragraphs = [
        `The heroes walked on soft, velvet carpets that felt like stepping on fluffy clouds. Suddenly, a friendly clockwork owl flapped down from a high rafter, landing gracefully on the leader's shoulder. It blinked its shiny brass eyes and offered them a brass key decorated with a tiny sparkling ruby. Our heroes thanked the owl warmly, understanding that every step forward brought them closer to uncovering the ultimate secret of the realm, proving that their dedication was indeed the key to unlocking the true potential of their hearts.`,
        `Continuing deeper into the castle, they discovered a grand observatory with a massive brass telescope pointing towards the starlit sky. The ceiling was a dome of deep blue velvet, decorated with thousands of twinkling crystal stars that shifted and aligned themselves as the adventurers moved. Through the lens, they could see the distant spinning worlds of the galaxy, glowing with vibrant shades of teal, neon pink, and bright yellow. It was a sight of breathtaking beauty.`,
        `In the next room, they found a glowing garden under a glass dome, where the plants were made of sparkling glass fibers that hummed with a soft, musical tone. Golden pollen drifted like fireflies through the air, casting gentle shadows on the stone floor. Here grew the legendary sunflower of courage, its petals made of warm, glowing gold. The adventurers stood in awe, feeling the warm energy radiating from the magnificent flower.`,
        `They climbed a winding spiral staircase made of solid white marble, each step decorated with beautiful carvings of playful animals. As they ascended, the air became crisp and clear, filled with the fresh scent of mountain pine and sparkling starlight. They could hear the distant sound of silver bells ringing, celebrating their journey and guiding their path upward.`
      ];
      while (currentWords < targetWords) {
        const baseParagraph = paragraphs[counter % paragraphs.length];
        const variation = ` [Saga Chapter ${Math.floor(counter / paragraphs.length) + 1}, Episode ${counter + 1}]: Furthermore, during this phase of the grand saga, the adventurers encountered more wonders of ${stripEmojis(genre)}. They learned that every single obstacle could be overcome when keeping their core promise: "${stripEmojis(moral)}". They navigated through sparkling rivers of orange juice and climbed tall chocolate hills, singing happy songs that echoed through the canyons. Each step they took was filled with magical energy and laughter. `;
        fullStoryText += " " + baseParagraph + variation;
        currentWords = fullStoryText.split(/\s+/).filter(Boolean).length;
        counter++;
      }
    }

    // Strip emojis and split the story equally into pages
    const cleanStoryText = stripEmojis(fullStoryText);
    const splitPages = splitTextIntoEqualPages(cleanStoryText, 150, pageCount ? Number(pageCount) : undefined);
    
    const finalCoverImg = coverImageUrl || getDynamicKeywordImageUrl(generatedTitle, stripEmojis(blurb), stripEmojis(genre), 0);
    const enrichedPagesList = enrichStoryPages(splitPages, generatedTitle, stripEmojis(genre), stripEmojis(moral), finalCoverImg, isPictureBook !== undefined ? Boolean(isPictureBook) : true);
    const totalWords = splitPages.reduce((acc, p) => acc + p.textContent.split(/\s+/).filter(Boolean).length, 0);

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
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true, // PUBLISH IMMEDIATELY BY DEFAULT so it shows up in store just how it was before!
      isPictureBook: isPictureBook !== undefined ? Boolean(isPictureBook) : true
    });

    // Enforce instant saving for maximum user experience and seamless instant admin refresh
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
    } catch (err) {
      console.log("ℹ️ Gemini Holiday Detection failed or was rate limited, falling back to static detection.", err);
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
