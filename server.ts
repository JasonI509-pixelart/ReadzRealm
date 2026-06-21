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

// Body parsing
app.use(express.json());

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
    return res.json({ success: true, books });
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

// 4. User Registration
app.post("/api/v1/users/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required!" });
  }

  try {
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email is already registered!" });
    }

    const newUser = await UserModel.create({
      username,
      email,
      passwordHash: password, // Simple plain mock storage for playground demo
      virtualCoins: 1000000,
      badges: [{ badgeId: "signup", title: "New Cadet Badge", unlockedAt: new Date().toISOString() }],
      ownedBooks: [
        { bookId: "book_gatoreye_001", unlockedVia: "giveaway" } // Starter book
      ]
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

    const amount = Number(req.body.amount) || 50000;
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

// --- SECTION 5: PRICING ENGINE WITH HOLIDAY MATRIX ---
function calculateDynamicPrice(basePrice: number, isFirstOrder: boolean): number {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const date = today.getDate();

  // Define major holiday matching matrices
  const isMajorHoliday = (
    (month === 11 && date === 25) || // Christmas Day
    (month === 0 && date === 1)   || // New Year's Day
    (month === 6 && date === 4)   || // 4th of July
    (month === 9 && date === 31)     // Halloween
  );

  if (isMajorHoliday) {
    // 75% off major holidays
    return basePrice * 0.25;
  }

  if (isFirstOrder) {
    // 50% off first order
    return basePrice * 0.50;
  }

  return basePrice;
}

// Get dynamic price preview
app.get("/api/v1/books/:id/price-preview", async (req, res) => {
  const { userId } = req.query;
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found." });

    let isFirstOrder = true;
    if (userId) {
      const user = await UserModel.findById(userId as string);
      if (user) {
        // If they already unlocked a book through purchase, it's not their first order
        isFirstOrder = !user.ownedBooks.some(b => b.unlockedVia === "purchase");
      }
    }

    const finalPriceInVirtualCoins = calculateDynamicPrice(book.basePrice, isFirstOrder);
    return res.json({
      success: true,
      basePrice: book.basePrice,
      isFirstOrder,
      finalPrice: finalPriceInVirtualCoins,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to calculate price preview." });
  }
});

// Process Book purchase using Virtual Coins
app.post("/api/v1/books/purchase", async (req, res) => {
  const { userId, bookId } = req.body;
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
      return res.status(400).json({ error: "You already own this epic comic book!" });
    }

    const isFirstOrder = !user.ownedBooks.some(b => b.unlockedVia === "purchase");
    const finalPrice = calculateDynamicPrice(book.basePrice, isFirstOrder);

    // Virtual Coins check
    const costInCoins = finalPrice * 50000; // Let's make 1 Real dollar worth 50,000 fun coins
    if (user.virtualCoins < costInCoins) {
      return res.status(400).json({
        error: `Insufficient fun coins! This book requires ${costInCoins.toLocaleString()} coins, but you only have ${user.virtualCoins.toLocaleString()} coins left. Read more books or create stories to gain more!`,
      });
    }

    // Deduct coins & Add book
    user.virtualCoins -= costInCoins;
    user.ownedBooks.push({
      bookId: book._id,
      unlockedVia: "purchase",
    });

    // Add badge
    user.badges.push({
      badgeId: "bought_" + book._id,
      title: `${book.genre} Champion`,
      unlockedAt: new Date().toISOString(),
    });

    await user.save();

    return res.json({
      success: true,
      message: "Purchase completed successfully!",
      user,
      secretSlug: book.secretSlug,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Checkout error resolving transaction." });
  }
});

// --- SECTION 4: THE GENERATIVE ENGINE & PROMPT FRAMEWORKS ---

app.post("/api/v1/admin/generate-book-content", validateAdminToken, async (req, res) => {
  const { title, genre, ageGroup, moral, blurb, coverImageUrl, pageCount, wordCount, price } = req.body;

  if (!title || !genre || !ageGroup || !moral || !blurb || !pageCount || !wordCount) {
    return res.status(400).json({ error: "Parameters missing. Please fulfill all details for the creative generator." });
  }

  try {
    // Exact Prompt Blueprint elements wrapped with system Instruction
    const systemInstruction = `[SYSTEM ROLE]
You are an expert children's graphic novel author and lead writer for platforms like Scholastic. Your style is fast-paced, filled with absurd humor, visual descriptions, and highly memorable characters. You draw structural inspiration from "The Bad Guys", "InvestiGators", and "The 13-Storey Treehouse". 

[STRICT INSTRUCTIONS]
1. Every story you write must start with an completely original, unique hook. Never repeat opening structural tropes across calls.
2. The tone must be laugh-out-loud funny, deeply imaginative, and directly suited for kids aged 8 to 12. Use clever dialogue, fun sound effects written as text (e.g., "KABOOM!", "SPLAT!"), and continuous comic energy.
3. You will receive specific metadata parameters (Title, Genre, Moral, Page Count, Word Count). You must split the full narrative across the exact number of pages provided.
4. Each page output must be cleanly separated by an explicit delimiter so the parsing engine can split it cleanly into an array of strings.

[OUTPUT JSON FORMAT]
Your entire response must be valid JSON matching this structure perfectly. Do not include markdown code block syntax outside the JSON.
{
  "generatedTitle": "A completely wacky title building upon or refining the input title",
  "pages": [
    {
      "pageNumber": 1,
      "textContent": "Text content for page 1 goes here..."
    }
  ]
}`;

    const promptPayload = `Create a spectacular kid graphic novel.
Title requested: ${title}
Genre: ${genre}
Target Age Group: ${ageGroup}
Moral Lesson: ${moral}
Blurb: ${blurb}
Core specs: Page Count = ${pageCount} pages, Word Count = ${wordCount} words total distributed evenly.

Deliver the JSON immediately.`;

    let mockAiPages: any[] = [];
    let generatedTitle = title;

    // Check if the api key is valid before triggering Gemini AI
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
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
                      pageNumber: { type: Type.INTEGER },
                      textContent: { type: Type.STRING }
                    },
                    required: ["pageNumber", "textContent"]
                  }
                }
              },
              required: ["generatedTitle", "pages"]
            }
          }
        });

        const jsonStr = response.text?.trim() || "";
        const parsed = JSON.parse(jsonStr);
        if (parsed && Array.isArray(parsed.pages)) {
          mockAiPages = parsed.pages;
          generatedTitle = parsed.generatedTitle || title;
        }
      } catch (geminiError) {
        console.error("Gemini invocation failed, falling back to dynamic parser:", geminiError);
      }
    }

    // Fallback/Generator if Gemini isn't configured or failed to parse JSON
    if (mockAiPages.length === 0) {
      generatedTitle = `Super ${title} & The Galactic Whistle`;
      mockAiPages = Array.from({ length: Number(pageCount) }, (_, i) => ({
        pageNumber: i + 1,
        textContent: `[Page ${i + 1}] KABOOM! The wacky universe of ${title} had just exploded into jellybeans! "Aha!" cried the brave comic hero. "By the power of this ${genre} journey, let's learn: ${moral}!" Whiz-bang-splat! Let's conquer page ${i + 1}!`,
      }));
    }

    // Provide high-contrast, cute children's illustrations from standard galleries
    const galleryRolls = [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600",
    ];

    // Map images to pages helper
    const pageDataFormatted = mockAiPages.map((page, idx) => ({
      pageNumber: page.pageNumber || (idx + 1),
      textContent: page.textContent,
      imageUrl: galleryRolls[idx % galleryRolls.length],
    }));

    // Generate highly secure, random URLs to enforce reading room isolation
    const generatedSecretSlug = crypto.randomBytes(16).toString("hex");
    const generatedGiveawayId = crypto.randomBytes(12).toString("hex");

    const newBook = new BookModel({
      title: generatedTitle,
      genre,
      targetAgeGroup: ageGroup,
      moralLesson: moral,
      blurbText: blurb,
      coverImageUrl: coverImageUrl || galleryRolls[Math.floor(Math.random() * galleryRolls.length)],
      pageCount: Number(pageCount),
      wordCount: Number(wordCount),
      basePrice: Number(price) || 4.0,
      secretSlug: generatedSecretSlug,
      giveawayId: generatedGiveawayId,
      pages: pageDataFormatted,
      isPublished: true, // Auto-publish for kids to discover right away!
    });

    await newBook.save();
    return res.status(201).json({ success: true, bookId: newBook._id, bookData: newBook });
  } catch (error) {
    console.error("Content generation failure:", error);
    return res.status(500).json({ error: "Failed to generate book structure via AI engine." });
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
