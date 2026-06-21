import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Coins, 
  Sparkles, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Award, 
  Plus, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Gift, 
  Volume2, 
  CheckCircle, 
  Copy,
  ArrowRight,
  Sparkle
} from 'lucide-react';

// Structure interfaces matching the schema
interface Page {
  pageNumber: number;
  textContent: string;
  imageUrl: string;
}

interface Book {
  _id: string;
  title: string;
  genre: string;
  targetAgeGroup: string;
  moralLesson: string;
  blurbText: string;
  coverImageUrl: string;
  pageCount: number;
  wordCount: number;
  basePrice: number;
  secretSlug: string;
  giveawayId: string;
  pages: Page[];
  isPublished: boolean;
}

interface UserBadge {
  badgeId: string;
  title: string;
  unlockedAt: string;
}

interface OwnedBookItem {
  bookId: string;
  unlockedVia: 'purchase' | 'giveaway';
}

interface User {
  _id: string;
  username: string;
  email: string;
  virtualCoins: number;
  badges: UserBadge[];
  ownedBooks: OwnedBookItem[];
}

// Sound effects generator using standard browser Web Audio Synth
function playRetroSound(type: 'woosh' | 'splat' | 'coin' | 'sparkle' | 'admin' | 'kaboom' | 'whizz' | 'boom' | 'bam' | 'pow' | 'page_turn') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    let selectedType = type;
    if (type === 'page_turn') {
      const comicSounds: Array<'kaboom' | 'splat' | 'whizz' | 'boom' | 'bam' | 'pow'> = ['kaboom', 'splat', 'whizz', 'boom', 'bam', 'pow'];
      selectedType = comicSounds[Math.floor(Math.random() * comicSounds.length)];
    }

    if (selectedType === 'woosh') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (selectedType === 'splat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (selectedType === 'coin') {
      // Classic double retro coin ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (selectedType === 'sparkle') {
      // Magic high chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (selectedType === 'admin') {
      // Secret laser sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (selectedType === 'kaboom') {
      // Powerful descending explosion synth
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (selectedType === 'whizz') {
      // High sliding sci-fi slide
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (selectedType === 'boom') {
      // Low sub bass kick boom
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (selectedType === 'bam') {
      // Mid punchy sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (selectedType === 'pow') {
      // High-pitched snap blast
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Audio sandbox error ignore
  }
}

export default function App() {
  // Navigation / View states: 'store', 'reader', 'admin', 'auth'
  const [currentView, setCurrentView] = useState<'store' | 'reader' | 'admin' | 'auth'>('store');
  
  // Library lists
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState<boolean>(true);
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Currently viewed book in Reader
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);
  const [claimStatus, setClaimStatus] = useState<{ success?: boolean; error?: string; message?: string }>({});

  // Auth Forms inputs
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [redirectTarget, setRedirectTarget] = useState<string>(''); // For guest redirect pipeline
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');

  // Creative AI Generator fields for Admin Panel
  const [genTitle, setGenTitle] = useState<string>('');
  const [genGenre, setGenGenre] = useState<string>('Wacky Adventure');
  const [genAgeGroup, setGenAgeGroup] = useState<string>('8-12 years');
  const [genMoral, setGenMoral] = useState<string>('');
  const [genBlurb, setGenBlurb] = useState<string>('');
  const [genPageCount, setGenPageCount] = useState<number>(50); // Set default to 50 pages (which is 20 or higher)
  const [genWordCount, setGenWordCount] = useState<number>(200);
  const [genPrice, setGenPrice] = useState<number>(4.00);
  const [genCoverUrl, setGenCoverUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [adminGenError, setAdminGenError] = useState<string>('');
  const [adminGenSuccess, setAdminGenSuccess] = useState<string>('');
  
  // Auto-Generator Controls State
  const [isGeneratorActive, setIsGeneratorActive] = useState<boolean>(false);
  const [isTriggeringNow, setIsTriggeringNow] = useState<boolean>(false);
  
  // Custom manual claim input
  const [directPromoKey, setDirectPromoKey] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Dynamic price map to fast query previews
  const [pricesPreviewMap, setPricesPreviewMap] = useState<Record<string, { basePrice: number; isFirstOrder: boolean; finalPrice: number }>>({});

  // Store page sub-tab filter: 'all' or 'collection'
  const [storeFilter, setStoreFilter] = useState<'all' | 'collection'>('all');
  // Page flip transition state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('left');
  // Badge overview visual modal toggle
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  // Book coins purchase confirmation dialog box
  const [coinsConfirmBook, setCoinsConfirmBook] = useState<Book | null>(null);

  // Admin Edit Selected Book States
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editFormTitle, setEditFormTitle] = useState<string>('');
  const [editFormGenre, setEditFormGenre] = useState<string>('');
  const [editFormAgeGroup, setEditFormAgeGroup] = useState<string>('');
  const [editFormMoral, setEditFormMoral] = useState<string>('');
  const [editFormBlurb, setEditFormBlurb] = useState<string>('');
  const [editFormPrice, setEditFormPrice] = useState<number>(4.00);
  const [editFormPages, setEditFormPages] = useState<Page[]>([]);
  const [isAdminSaving, setIsAdminSaving] = useState<boolean>(false);
  const [adminSavingSuccess, setAdminSavingSuccess] = useState<string>('');
  const [adminSavingError, setAdminSavingError] = useState<string>('');

  // Suggested popular search tags
  const POPULAR_COMIC_TITLE_SUGGESTIONS = [
    "The Super-Spy Piglets & The Soda Volcano",
    "Robo-Pups & The Great Biscuit Runaway",
    "The Marshmallow Monster under the Sofa",
    "Captain Bananas & The Buttered Asteroid",
    "The Dino Dashers & The Marshmallow Comet",
    "InvestiGators Check-in",
    "The Bad Guys Space Escape",
    "Ninja Chickens Vs Cyborg Foxes"
  ];

  // Fetch full list of books
  const loadBooksList = async () => {
    try {
      setLoadingBooks(true);
      const res = await fetch('/api/v1/books');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.books)) {
          setBooks(data.books);
        }
      }
    } catch (e) {
      console.error("Error loading graphic novels from store", e);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Load prices preview for all books based on active user context
  const loadPricesPreview = async (currentBooks: Book[], userId: string | null) => {
    const previewData: Record<string, any> = {};
    for (const b of currentBooks) {
      try {
        const url = `/api/v1/books/${b._id}/price-preview` + (userId ? `?userId=${userId}` : '');
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            previewData[b._id] = data;
          }
        }
      } catch (err) {
        // Fallback pricing calculation matching exact formula
        let isFirstOrder = true;
        const today = new Date();
        const month = today.getMonth();
        const date = today.getDate();
        const isMajorHoliday = (
          (month === 11 && date === 25) || // Xmas
          (month === 0 && date === 1)   || // New Year
          (month === 6 && date === 4)   || // 4th July
          (month === 9 && date === 31)     // Halloween
        );
        let finalP = b.basePrice;
        if (isMajorHoliday) finalP = b.basePrice * 0.25;
        else if (isFirstOrder) finalP = b.basePrice * 0.50;
        previewData[b._id] = { basePrice: b.basePrice, isFirstOrder, finalPrice: finalP };
      }
    }
    setPricesPreviewMap(previewData);
  };

  // On App Mount
  useEffect(() => {
    loadBooksList();
    
    // Check local storage for persistence
    const savedUser = localStorage.getItem('comic_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch(e) {}
    }
    const savedAdmin = localStorage.getItem('admin_token_key');
    if (savedAdmin === '123Jasonsgame!15412907') {
      setIsAdmin(true);
      setAdminToken(savedAdmin);
    }

    // Capture standard giveaway claim logic if matching window locations
    const params = new URLSearchParams(window.location.search);
    const promoKey = params.get('key');
    if (promoKey) {
      setDirectPromoKey(promoKey);
      // Try auto-claiming later once user loads
    }
  }, []);

  // Whenever user or books change, reload price rules
  useEffect(() => {
    if (books.length > 0) {
      loadPricesPreview(books, user ? user._id : null);
    }
  }, [books, user]);

  // Handle live search key change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    
    // BACKDOOR INTERCEPTION ALGORITHM
    // "If the value matches the target string perfectly, the default search submission query is intercepted and blocked."
    // "The application clears out the input box immediately to hide the key string from plain sight."
    // "The client state transitions instantly, triggering an automated client-side route redirection to /secret-admin-console."
    if (val.trim() === '123Jasonsgame!15412907') {
      playRetroSound('admin');
      
      // Hide the key immediately
      setSearchQuery('');
      setShowSuggestions(false);
      
      // Session Injection
      localStorage.setItem('admin_token_key', '123Jasonsgame!15412907');
      setIsAdmin(true);
      setAdminToken('123Jasonsgame!15412907');
      
      // Route state transition
      setCurrentView('admin');
      return;
    }

    if (val.trim().length > 0) {
      const filtered = POPULAR_COMIC_TITLE_SUGGESTIONS.filter(t => 
        t.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Cheat code to unlock a legendary bragging-rights badge inside the museum
  const awardAllBadgesCheat = async () => {
    if (!user) {
      alert("Please sign up or log in first!");
      return;
    }
    const braggingRightsBadge = {
      badgeId: "b_cheat_" + Date.now(),
      title: "Master Badge Museum Architect 🏆",
      unlockedAt: new Date().toISOString()
    };
    const updatedUser = { 
      ...user, 
      badges: [
        ...user.badges, 
        braggingRightsBadge
      ]
    };
    setUser(updatedUser);
    localStorage.setItem('comic_user', JSON.stringify(updatedUser));
    playRetroSound('sparkle');
    alert("🏆 CHEAT CODE ACTIVATED! You've unlocked the legendary 'Master Badge Museum Architect' badge for maximum bragging rights inside your profile museum!");
  };

  const triggerPageFlip = (newIndex: number, direction: 'left' | 'right') => {
    setFlipDirection(direction);
    setIsFlipping(true);
    // Automatically trigger randomly chosen comic sounds on page turn
    playRetroSound('page_turn');
    setCurrentSpreadIndex(newIndex);
    setTimeout(() => {
      setIsFlipping(false);
    }, 500); // 500ms aligns with pageTurn CSS animation
  };

  const earnNamedBadge = async (badgeId: string, badgeTitle: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/v1/users/${user._id}/earn-badge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, badgeTitle })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.user) {
          if (d.isNewBadge) {
            playRetroSound('sparkle');
            alert(`🏆 UNLOCKED RETRO BADGE!\n\n✨ [${badgeTitle}] ✨\n\nThis epic accomplishment has been permanently archived in your personal Badge Museum!`);
          }
          setUser(d.user);
          localStorage.setItem('comic_user', JSON.stringify(d.user));
        }
      }
    } catch (e) {
      console.error("Failed to unlock badge:", e);
    }
  };

  // Active reading focus timer for Extremely Rare "Time Alchemist Hourglass" Badge
  const [readingFocusSeconds, setReadingFocusSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (currentView === 'reader' && readingBook && user) {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          setReadingFocusSeconds(prev => {
            const nextVal = prev + 1;
            // Unlocks after 45 continuous focused seconds to keep it highly testable and fun!
            if (nextVal === 45) {
              earnNamedBadge('badge_time_bending', 'Time Alchemist Hourglass');
            }
            return nextVal;
          });
        }
      }, 1000);
    } else {
      setReadingFocusSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, readingBook, user]);

  // Card checkout sequence representing a modern Stripe processing terminal
  const handlePurchaseComic = async (book: Book) => {
    if (!user) {
      setRedirectTarget(`/store/book/${book._id}`);
      setAuthMode('signup');
      setAuthError('Create a quick player account below to unlock and buy this book!');
      setCurrentView('auth');
      playRetroSound('splat');
      return;
    }

    const cardHolder = window.prompt("💳 ENTER CARDHOLDER NAME (Simulated Stripe Secure Checkout):", user.username.toUpperCase());
    if (cardHolder === null) return; // user cancelled
    if (!cardHolder.trim()) {
      alert("Cardholder name is required!");
      return;
    }

    const cardNumber = window.prompt("💳 ENTER SIMULATED CARD NUMBER (Stripe demo triggers with any 16-digit card number):", "4242-4242-4242-4242");
    if (cardNumber === null) return; // user cancelled
    if (cardNumber.replace(/\D/g, '').length < 16) {
      alert("Please enter a valid simulated 16-digit card number!");
      return;
    }

    try {
      const res = await fetch('/api/v1/books/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user._id, 
          bookId: book._id,
          cardHolder: cardHolder,
          cardNumber: cardNumber,
          secureToken: "tok_" + Math.random().toString(36).substring(7)
        })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        alert(data.error || "Ouch, transaction failed!");
        return;
      }

      // Success
      setUser(data.user);
      localStorage.setItem('comic_user', JSON.stringify(data.user));
      playRetroSound('coin');
      
      alert(`🎉 CHECKOUT SUCCESSFUL!\n\nStripe successfully processed the payment of $4.00! Enjoy reading "${book.title}"!`);
      
      // Unlock collector badge
      earnNamedBadge('badge_collector_gold', 'Super Collector Gold');
      launchReaderRoom(book);
    } catch (err) {
      // Fallback local processing
      const updatedUser: User = {
        ...user,
        ownedBooks: [...user.ownedBooks, { bookId: book._id, unlockedVia: 'purchase' }],
        badges: [
          ...user.badges, 
          { badgeId: 'bought_' + book._id, title: `${book.genre} Master Collector`, unlockedAt: new Date().toISOString() }
        ]
      };
      
      setUser(updatedUser);
      localStorage.setItem('comic_user', JSON.stringify(updatedUser));
      playRetroSound('coin');
      alert(`🎉 Stripe Simulated Success! Successfully acquired "${book.title}" for $4.00! Enjoy the story!`);
      launchReaderRoom(book);
    }
  };

  // Launch Book Reader Isolation Room
  const launchReaderRoom = (book: Book) => {
    playRetroSound('woosh');
    setReadingBook(book);
    setCurrentSpreadIndex(0);
    setCurrentView('reader');
  };

  // Free claims link resolver
  const processPromotionalClaim = async (claimKey: string) => {
    if (!claimKey.trim()) return;
    setIsClaiming(true);
    setClaimStatus({});

    try {
      const fetchUrl = `/api/v1/promotions/claim?key=${encodeURIComponent(claimKey)}` + (user ? `&userId=${user._id}` : '');
      const res = await fetch(fetchUrl);
      const data = await res.json();

      if (!res.ok) {
        setClaimStatus({ error: data.error || "Promo key lookup failed!" });
        playRetroSound('splat');
        setIsClaiming(false);
        return;
      }

      if (data.action === "REDIRECT_TO_SIGNUP") {
        setClaimStatus({ error: "You must be logged in to claim free promo books! Please sign up or log in first!" });
        setRedirectTarget(`/claim?key=${claimKey}`);
        playRetroSound('splat');
      } else if (data.success && data.action === "LAUNCH_BOOK") {
        playRetroSound('sparkle');
        setClaimStatus({ success: true, message: "Promotional bypass approved! Opening the secure library room..." });
        
        // Let's refresh profile
        if (user) {
          const uRes = await fetch(`/api/v1/users/${user._id}`);
          if (uRes.ok) {
            const uData = await uRes.json();
            if (uData.success && uData.user) {
              setUser(uData.user);
              localStorage.setItem('comic_user', JSON.stringify(uData.user));
            }
          }
        }

        // Find the matched book inside our clientside items list
        setTimeout(async () => {
          let targetBook = books.find(b => b.secretSlug === data.targetSlug);
          if (!targetBook) {
            // fetch directly
            try {
              const bRes = await fetch(`/api/v1/books/slug/${data.targetSlug}`);
              if (bRes.ok) {
                const bData = await bRes.json();
                if (bData.success && bData.book) {
                  targetBook = bData.book;
                }
              }
            } catch(e){}
          }

          if (targetBook) {
            launchReaderRoom(targetBook);
          } else {
            alert(`Book validated but the specific slug room details could not be retrieved. Slug: ${data.targetSlug}`);
          }
        }, 1200);
      }
    } catch (err) {
      setClaimStatus({ error: "Network anomaly resolving promotional claim." });
      playRetroSound('splat');
    } finally {
      setIsClaiming(false);
    }
  };

  // Login handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!formEmail || !formPassword || (authMode === 'signup' && !formUsername)) {
      setAuthError("Oops! All bubbly fields are required so the piglets can save your status!");
      playRetroSound('splat');
      return;
    }

    try {
      const endpoint = authMode === 'signup' ? '/api/v1/users/register' : '/api/v1/users/login';
      const payload = authMode === 'signup' 
        ? { username: formUsername, email: formEmail, password: formPassword }
        : { email: formEmail, password: formPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Authentication check failed! Try another shiny name.");
        playRetroSound('splat');
        return;
      }

      // Authenticated!
      playRetroSound('sparkle');
      setUser(data.user);
      localStorage.setItem('comic_user', JSON.stringify(data.user));
      setAuthSuccess(`Woohoo! Welcome to Comic World, Special Cadet ${data.user.username}!`);
      
      // Clean forms
      setFormUsername('');
      setFormEmail('');
      setFormPassword('');

      // Redirect workflow trigger
      setTimeout(() => {
        setCurrentView('store');
        // Check if there was an active purchase page target we intercepted
        if (redirectTarget) {
          if (redirectTarget.includes('/store/book/')) {
            const parts = redirectTarget.split('/');
            const bId = parts[parts.length - 1];
            const targetB = books.find(b => b._id === bId);
            if (targetB) {
              handlePurchaseComic(targetB);
            }
          } else if (redirectTarget.includes(`/claim?key=`)) {
            const spl = redirectTarget.split('?key=');
            if (spl[1]) {
              processPromotionalClaim(spl[1]);
            }
          }
          setRedirectTarget('');
        }
      }, 1500);

    } catch (err) {
      // Fallback local registration to ensure persistent state works offline too
      playRetroSound('sparkle');
      const mockCadet: User = {
        _id: "u_" + Math.random().toString(36).substr(2, 9),
        username: formUsername || formEmail.split('@')[0] || "ComicPanda",
        email: formEmail,
        virtualCoins: 0,
        badges: [{ badgeId: "signup", title: "Young Cadet Explorer", unlockedAt: new Date().toISOString() }],
        ownedBooks: []
      };
      setUser(mockCadet);
      localStorage.setItem('comic_user', JSON.stringify(mockCadet));
      setAuthSuccess(`[LOCAL CADET MODE] Welcome to the Academy! Earn beautiful badges for active bragging rights as you explore the catalog!`);
      
      setTimeout(() => {
        setCurrentView('store');
      }, 1500);
    }
  };

  // Sign out Cadets
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('comic_user');
    playRetroSound('woosh');
    alert("Cadet signed out safely! Come back soon!");
  };

  // Trigger Admin Generation
  const handleAiGenerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminGenError('');
    setAdminGenSuccess('');
    setIsGenerating(true);

    if (!genTitle || !genGenre || !genMoral || !genBlurb) {
      setAdminGenError("Wait, Captain! You must input title, genre, moral lesson, and blurb parameters before releasing the magic robots!");
      playRetroSound('splat');
      setIsGenerating(false);
      return;
    }

    if (genPageCount < 20) {
      setAdminGenError("Wait, Captain! The page count must be 20 or higher, not 10 or lower.");
      playRetroSound('splat');
      setIsGenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/generate-book-content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` 
        },
        body: JSON.stringify({
          title: genTitle,
          genre: genGenre,
          ageGroup: genAgeGroup,
          moral: genMoral,
          blurb: genBlurb,
          pageCount: genPageCount,
          wordCount: genWordCount,
          price: genPrice,
          coverImageUrl: genCoverUrl
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAdminGenError(data.error || "The story machine engine overheated. Try again!");
        playRetroSound('splat');
        return;
      }

      // Creative generation succeed
      playRetroSound('sparkle');
      setAdminGenSuccess(`🌟 SPECTACULAR COMIC CREATED! "${data.bookData.title}" is officially synthesized and saved inside our database. Direct Secret slug path is activated!`);
      
      // Reload lists
      loadBooksList();

      // Clear generation fields
      setGenTitle('');
      setGenMoral('');
      setGenBlurb('');
      setGenCoverUrl('');

    } catch (err) {
      setAdminGenError("Failed to trigger remote Express server generation action. Check network status!");
      playRetroSound('splat');
    } finally {
      setIsGenerating(false);
    }
  };

  const ALL_SYSTEM_BADGES_DEFINITIONS = [
    { id: 'signup', title: 'Young Cadet Explorer', description: 'Formed a cadet profile at Morganville academy!', rarity: 'COMMON', rarityScore: 1, icon: '🐣' },
    { id: 'read_first', title: 'First Reader Chapter', description: 'Completely finished reading 1 comic adventure!', rarity: 'COMMON', rarityScore: 1, icon: '📖' },
    { id: 'read_5_dog', title: 'Dog Detective Crew', description: 'Investigated and read 5 dog-themed comics!', rarity: 'UNCOMMON', rarityScore: 2, icon: '🐶' },
    { id: 'read_5_adventure', title: 'Morganville Survivalist', description: 'Mastered 5 distinct high-adrenaline genres!', rarity: 'RARE', rarityScore: 3, icon: '🗺️' },
    { id: 'badge_time_bending', title: 'Time Alchemist Hourglass', description: 'Read uninterrupted for 45 seconds straight!', rarity: 'EPIC', rarityScore: 4, icon: '⏳' },
    { id: 'badge_collector_gold', title: 'Super Collector Gold', description: 'Secured first coin or real premium item transaction!', rarity: 'EPIC', rarityScore: 4, icon: '🥇' },
    { id: 'swamp_sleuth', title: 'Swamp Dwelling Sleuth Crown', description: 'Solved the gold-plated donut case with Jason!', rarity: 'LEGENDARY', rarityScore: 5, icon: '👑' },
  ];

  const COMIC_GENRES_100 = [
    "Wacky Adventure", "Comedy Sci-Fi", "Funny Horror", "Action Hero", "Fairy-Tale Parody",
    "Detective Mystery", "Animal Slapstick", "Space Comedy", "Jungle Romped", "Schoolhouse Giggles",
    "Super-Hero Goofs", "Monster Mayhem", "Time Travel Troubles", "Undersea Sillies", "Pirate Pranks",
    "Ninja Mistakes", "Knightly Knuckleheads", "Robot Rambles", "Alien Antics", "Dinosaur Dashes",
    "Wizardly Wobbles", "Vampire Giggles", "Grave giggles", "Candy Castle Crushes", "Bubblegum Battles",
    "Zany Zoos", "Amusement Park Panic", "Circus Chuckles", "Kitchen Chaos", "Garden Grooves",
    "Ice Cream Disasters", "Silly Sports", "Secret Agent Oops", "Caveman Clutter", "Sky-high Shenanigans",
    "Balloon Bursters", "Lollipop Knights", "Laser-Tag Leopards", "Bubbling Baboons", "Skateboard Squirrels",
    "T-Rex Drummers", "Flying Fish-Sticks", "Ghostbusters Ghouls", "Peanut-Butter Pandas", "Screaming Snowmen",
    "Jellybean Jungles", "Marshmallow Monsters", "Wobbly Wizards", "Booming Balloons", "Clown Critters",
    "Pickle Princes", "Sneezing Snails", "Ticklish Tigers", "Wacky Werewolves", "Soda Volcanoes",
    "Cheesy Astronauts", "Sloppy Superheroes", "Glitter Gargoyles", "Disco Dinosaurs", "Barking Banjoes",
    "Singing Seagulls", "Plucky Penguins", "Mustache Monkeys", "Bouncing Bunnies", "Karate Koalas",
    "Pizza Pilgrims", "Cosmic Cows", "Flying Fleas", "Saucy Cyborgs", "Giggle Gangsters",
    "Detective Ducks", "Swamp Sleuths", "Munching Mammoths", "Whistling Whales", "Chuckle Chameleons",
    "Pudding Pixies", "Taco Turtles", "Waffle Walruses", "Doodle Dolphins", "Noodle Octopuses",
    "Wackier Wombats", "Pretzels & Pegasus", "Gumball Giants", "Hoverboard Hippos", "Popcorn Ponies",
    "Bacon Bandits", "Cactus Cowboys", "Quacking Queens", "Burping Badgers", "Fluffy Firefighters",
    "Joking Jellyfish", "Silly Sailors", "Glitchy Gadgets", "Rapping Rabbits", "Merry Moose",
    "Loopy Llamas", "Fuzzy Aliens", "Snorting Swine", "Wiggle Worms", "Honking Herons", "Dancing Deer",
    "Chewing Chimps"
  ];

  const handleTogglePublish = async (bookId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/books/${bookId}/toggle-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        playRetroSound('sparkle');
        loadBooksList();
      } else {
        alert("Failed to toggle publish status");
      }
    } catch (e) {
      alert("Error toggling publish status");
    }
  };

  const fetchGeneratorStatus = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/v1/admin/auto-generator/status', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsGeneratorActive(data.isEnabled);
      }
    } catch (err) {
      console.error("Failed to load generator status:", err);
    }
  };

  const toggleAutoGeneratorState = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/v1/admin/auto-generator/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsGeneratorActive(data.isEnabled);
        playRetroSound('sparkle');
        alert(`🔌 Continuous 1-Minute generator has been successfully ${data.isEnabled ? "ENABLED" : "PAUSED"}!`);
      }
    } catch (err) {
      console.error("Failed to toggle generator status:", err);
    }
  };

  const forceAutoGenerateNow = async () => {
    if (!adminToken) return;
    setIsTriggeringNow(true);
    playRetroSound('woosh');
    try {
      const res = await fetch('/api/v1/admin/auto-generator/generate-now', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}` 
        }
      });
      if (res.ok) {
        playRetroSound('coin');
        alert("📚 SUCCESS! A new unpublished child graphic novel has been generated in draft status!");
        loadBooksList();
      } else {
        alert("Failed to force generate draft book content");
      }
    } catch (err) {
      console.error("Failed manual auto-generator trigger:", err);
    } finally {
      setIsTriggeringNow(false);
    }
  };

  useEffect(() => {
    if (currentView === 'admin' && adminToken) {
      fetchGeneratorStatus();
    }
  }, [currentView, adminToken]);

  const handleDeleteBook = async (bookId: string) => {
    const isSure = window.confirm("⚠️ WARNING: Are you sure you want to permanently delete this book from the database? This cannot be undone.");
    if (!isSure) return;

    try {
      const res = await fetch(`/api/v1/admin/books/${bookId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        playRetroSound('splat');
        alert("Book successfully deleted.");
        loadBooksList();
      } else {
        alert("Failed to delete book");
      }
    } catch (e) {
      alert("Error deleting book");
    }
  };

  const handleEditBookSelect = (book: Book) => {
    playRetroSound('woosh');
    setEditingBookId(book._id);
    setEditFormTitle(book.title);
    setEditFormGenre(book.genre);
    setEditFormAgeGroup(book.targetAgeGroup);
    setEditFormMoral(book.moralLesson);
    setEditFormBlurb(book.blurbText);
    setEditFormPrice(book.basePrice);
    setEditFormPages([...book.pages]);
    setAdminSavingSuccess('');
    setAdminSavingError('');
  };

  const handleEditBookPageChange = (index: number, newTxt: string) => {
    const updatedPages = [...editFormPages];
    updatedPages[index] = {
      ...updatedPages[index],
      textContent: newTxt
    };
    setEditFormPages(updatedPages);
  };

  const handleEditBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookId) return;

    setIsAdminSaving(true);
    setAdminSavingSuccess('');
    setAdminSavingError('');

    try {
      const res = await fetch(`/api/v1/admin/books/${editingBookId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: editFormTitle,
          genre: editFormGenre,
          targetAgeGroup: editFormAgeGroup,
          moralLesson: editFormMoral,
          blurbText: editFormBlurb,
          basePrice: editFormPrice,
          pages: editFormPages
        })
      });

      const d = await res.json();
      if (res.ok && d.success) {
        playRetroSound('sparkle');
        setAdminSavingSuccess("🌟 BOOK MODIFIED SPECTACULARLY! Details and words have been updated in data/db.json!");
        loadBooksList();
      } else {
        setAdminSavingError(d.error || "Failed to edit book attributes.");
      }
    } catch (err: any) {
      setAdminSavingError("Failed to edit book attributes: server connection lost.");
    } finally {
      setIsAdminSaving(false);
    }
  };

  // Fast Auto-Fill for kids/admin to test generation easily
  const autofillGenFields = () => {
    playRetroSound('coin');
    const scenarios = [
      {
        t: "Ninja Penguins & The Great Ice-Cream Melting",
        g: "Action Comedy",
        a: "8-12 years",
        m: "Warm hearts are cooler than freezing friends!",
        b: "An evil hair dryer is threaten to melt all double-scoop cones in Antarctica! Special Agents Slush and Scoop must master ninja-flipping before the waffle bowls collapse!",
        c: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600"
      },
      {
        t: "Dr. Gigglebots & The Giggle Asteroid",
        g: "Comedy Sci-Fi",
        a: "5-7 years",
        m: "Laughter is the universal battery!",
        b: "A cosmic space station runs out of electricity! The funny robotic professor Dr. Gigglebots plans a rocket expedition to capture sparkling laughing sounds from a nearby asteroid!",
        c: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600"
      },
      {
        t: "The T-Rex who Couldn't Play the Drums",
        g: "Wacky Adventure",
        a: "8-12 years",
        m: "Shorter arms mean you need longer drumsticks!",
        b: "Dexter is a happy Tyrannosaurus with a huge dream: becoming the master metal rock drummer! But his tiny arms keep dropping the sticks. Will his best friends help him engineer a tail-drum booster?",
        c: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"
      }
    ];
    const picked = scenarios[Math.floor(Math.random() * scenarios.length)];
    setGenTitle(picked.t);
    setGenGenre(picked.g);
    setGenAgeGroup(picked.a);
    setGenMoral(picked.m);
    setGenBlurb(picked.b);
    setGenCoverUrl(picked.c);
    setGenPageCount(6);
    setGenWordCount(180);
    setGenPrice(4.50);
  };

  // Check if a book is unlocked (owned) by user
  const isBookOwned = (bookId: string): boolean => {
    if (!user) return false;
    return user.ownedBooks.some(b => b.bookId.toString() === bookId.toString());
  };

  return (
    <div className="min-h-screen bg-peach-pattern select-none text-black font-sans pb-12">
      
      {/* 1. TOP HEADER NAVIGATION - HIDDEN IN READER PER SECTION 6 SPEC */}
      {currentView !== 'reader' && (
        <header className="bg-[#FFE600] border-b-[8px] border-black sticky top-0 z-50 select-none shadow-[0_5px_0_0_rgba(0,0,0,1)]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Playful pop logo text outlined with red style */}
            <div 
              onClick={() => { playRetroSound('woosh'); setCurrentView('store'); }} 
              className="flex items-center gap-2 cursor-pointer transform hover:scale-105 active:translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-1">
                <span className="text-3xl md:text-4xl font-display font-black tracking-tighter text-[#FF007F] uppercase uppercase" style={{ WebkitTextStroke: '2px black', textShadow: '3px 3px 0px #000' }}>
                  📚 BOOK TOME
                </span>
              </div>
            </div>

            {/* Middle: Integrated search monitoring with elegant pill-shaped input */}
            <div className="w-full md:w-[480px] relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search wacky books..."
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-white border-[5px] border-black text-base font-extrabold px-6 py-2 rounded-full placeholder:text-gray-500 focus:outline-none"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:scale-110 active:translate-y-0.5">
                  <Search className="w-5 h-5 text-black stroke-[4px]" />
                </button>
              </div>

              {/* Suggestions layer popup */}
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-3 bg-white border-4 border-black z-50 p-2 shadow-[8px_8px_0px_0px_#000000] rounded-2xl">
                  <div className="p-2 text-xs font-black uppercase text-gray-700 bg-yellow-100 border-2 border-black rounded-lg flex items-center justify-between">
                    <span>⚡ POPULAR TODAY:</span>
                    <button onClick={() => setShowSuggestions(false)} className="hover:scale-110 text-red-600 font-black">✕ CLOSE</button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {suggestions.length > 0 ? (
                      suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSearchQuery(item);
                            setShowSuggestions(false);
                            playRetroSound('sparkle');
                          }}
                          className="p-2 text-sm font-black text-black rounded-lg hover:bg-[#FFE600] cursor-pointer transition-colors"
                        >
                          📖 {item}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm font-bold text-gray-500">
                        No matches found! Search for 'Gator', 'Allies', 'Acorn' or 'Pizza'.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right block: STORE link, user session parameters or SIGN UP */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { playRetroSound('woosh'); setCurrentView('store'); }}
                className="text-black font-black text-base tracking-wider uppercase hover:underline cursor-pointer select-none"
              >
                STORE
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                   {/* My Badges shortcut option */}
                   <div 
                     onClick={() => { 
                       playRetroSound('sparkle');
                       setShowBadgesModal(true);
                     }}
                     className="bg-[#39FF14] hover:bg-emerald-400 border-[3px] border-black px-3.5 py-1 rounded-full font-black text-xs text-black cursor-pointer shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 select-none"
                   >
                     🏆 BADGES ({user ? user.badges.length : 0})
                   </div>

                  {/* Sign out */}
                  <button 
                    onClick={handleSignOut}
                    className="border-[3px] border-black p-1.5 bg-red-400 hover:bg-red-500 rounded-full font-bold text-xs uppercase cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { playRetroSound('woosh'); setAuthMode('signup'); setCurrentView('auth'); }}
                  className="bg-[#00D4FF] text-black border-[4px] border-black px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-wide hover:scale-105 active:translate-y-0.5 transition-transform cursor-pointer shadow-[3px_3px_0px_0px_#000]"
                >
                  SIGN UP
                </button>
              )}

              {/* Admin Gate icon inside header */}
              {isAdmin && (
                <button
                  onClick={() => { playRetroSound('admin'); setCurrentView('admin'); }}
                  className="bg-black text-yellow-300 border-2 border-black p-1 .5 rounded-full hover:bg-yellow-300 hover:text-black transition-all cursor-pointer"
                  title="Open Admin Gateway"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </header>
      )}

      {/* 3. MAIN CONTENTS CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* VIEW A: STORY LIBRARY & SHOP */}
        {currentView === 'store' && (
          <div>
            {/* Giant Premium Curved Yellow Hero Poster matching top-tier design in screenshots */}
            <div className="bg-[#FFE600] border-[8px] border-black rounded-[3rem] p-8 md:p-12 mb-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 rotate-[-0.5deg]">
              <div className="flex-1 text-left">
                <div className="inline-block text-[#FF007F] font-black text-sm uppercase italic tracking-wider mb-2 select-none">
                  📚 WELCOME TO
                </div>
                
                <h1 
                  className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-[#00AEFF] uppercase mb-4 select-none" 
                  style={{ WebkitTextStroke: '2.5px black', textShadow: '5px 5px 0px #000' }}
                >
                  BOOK TOME
                </h1>
                
                <p className="text-black font-extrabold text-lg md:text-xl max-w-xl leading-snug">
                  Laugh-out-loud graphic novels for kids aged 8-12. Brand-new wacky stories, freshly drawn, dripping with comic energy. KABOOM!
                </p>
                <p className="text-xs font-bold text-gray-800 mt-2">
                  ⚡ ALL EPIC GRAPHIC NOVELS FLAT FIXED PRICE AT JUST $4.00!
                </p>
                
                <button
                  onClick={() => {
                    playRetroSound('woosh');
                    const target = document.getElementById('books-list-grid');
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#39FF14] text-black font-black text-lg md:text-xl px-8 py-4 border-[5px] border-black rounded-2xl shadow-[6px_6px_0px_0px_#000000] hover:scale-105 active:translate-y-1 transition-transform cursor-pointer mt-6 inline-block select-none"
                >
                  START READING FREE →
                </button>
              </div>
              
              {/* Comic bubble stack on the right */}
              <div className="flex flex-col gap-4 select-none pr-4 shrink-0">
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#00D4FF] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] -rotate-6 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black"
                >
                  SPLAT!
                </div>
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#FF007F] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] rotate-3 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black"
                >
                  KABOOM!
                </div>
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#FF8C00] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] -rotate-3 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black"
                >
                  WHIZZ!
                </div>
              </div>
            </div>



            {/* Book Cards Grid Title Header */}
            <div id="books-list-grid" className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-black select-none tracking-tight flex items-center gap-2">
                  🔥 HOT OFF THE PRESS
                </h2>
                <p className="text-xs font-bold text-gray-700 mt-1">Discover dynamic comic stories that help you build values & master big emotions!</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={loadBooksList}
                  className="bg-[#00D4FF] border-[3px] border-black px-4 py-1.5 rounded-full font-black text-xs uppercase hover:bg-neutral-100 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  🔄 REFRESH
                </button>
              </div>
            </div>

            {/* CUSTOM TABS FOR MY COLLECTION & ALL COMICS */}
            <div className="flex border-4 border-black mb-8 p-1 bg-black rounded-2xl select-none">
              <button
                type="button"
                onClick={() => { playRetroSound('woosh'); setStoreFilter('all'); }}
                className={`flex-1 py-3 text-center font-black uppercase text-sm rounded-xl transition-all cursor-pointer ${
                  storeFilter === 'all' 
                    ? 'bg-[#FFE600] text-black border-2 border-black shadow-[3px_3px_0_0_#FFF]' 
                    : 'text-white hover:text-[#FFE600]'
                }`}
              >
                🌟 ALL ADVENTURE COMICS
              </button>
              <button
                type="button"
                onClick={() => { playRetroSound('woosh'); setStoreFilter('collection'); }}
                className={`flex-1 py-3 text-center font-black uppercase text-sm rounded-xl transition-all cursor-pointer ${
                  storeFilter === 'collection' 
                    ? 'bg-[#FF55BB] text-black border-2 border-black shadow-[3px_3px_0_0_#FFF]' 
                    : 'text-white hover:text-[#FF55BB]'
                }`}
              >
                🗝️ MY PERSONAL COLLECTION ({user ? books.filter(b => isBookOwned(b._id)).length : 0} Owned)
              </button>
            </div>

            {loadingBooks ? (
              <div className="bg-white border-4 border-black p-12 text-center comic-shadow">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4"></div>
                <h4 className="text-2xl font-black">SPINNING THE COMIC MACHINE REELS...</h4>
                <p className="text-sm font-bold text-gray-505">Grabbing cute images and hilarious dialogue panels!</p>
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white border-4 border-black p-12 text-center rounded-3xl comic-shadow">
                <p className="text-xl font-black text-gray-800">Our authors and artists are currently busy sketching and writing some blockbuster new additions! Check back very shortly for updates. 🎨</p>
              </div>
            ) : (() => {
              const filteredBooks = books.filter((b) => {
                // Ensure only published books are visible to clients
                if (!b.isPublished) return false;
                
                if (storeFilter === 'collection') {
                  return isBookOwned(b._id);
                }
                return true;
              });

              if (filteredBooks.length === 0) {
                return (
                  <div className="bg-white border-4 border-black p-12 text-center rounded-3xl comic-shadow">
                    <p className="text-2xl font-black uppercase mb-2">🎈 NO MATCHING COMICS FOUND!</p>
                    {storeFilter === 'collection' ? (
                      <div>
                        <p className="text-md font-bold text-gray-700">You do not own any books in your personal collection yet!</p>
                        <button
                          onClick={() => { playRetroSound('woosh'); setStoreFilter('all'); }}
                          className="mt-4 bg-[#FFE600] text-black font-black border-4 border-black px-6 py-2.5 uppercase text-xs"
                        >
                          🛒 EXPLORE BOOK STORE CAFE →
                        </button>
                      </div>
                    ) : (
                      <p className="text-md font-bold text-gray-700">The comic café shelf is currently being restocked by our artists. Stay tuned! 🎨</p>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {filteredBooks.map((book) => {
                  const owned = isBookOwned(book._id);
                  const priceInfo = pricesPreviewMap[book._id];
                  const finalCostInCoins = Math.round((priceInfo ? priceInfo.finalPrice : book.basePrice) * 10);
                  const firstTimerOffer = priceInfo?.isFirstOrder;

                  // Determine colors based on book genres matching screenshots
                  let genreColorClass = "bg-[#00D4FF]"; // Cyan default
                  if (book.genre === "Detective Mystery") {
                    genreColorClass = "bg-[#00D4FF]"; // Cyan
                  } else if (book.genre === "Action Comedy") {
                    genreColorClass = "bg-[#FF007F]"; // Magenta Pink
                  } else if (book.genre === "Wacky Fantasy") {
                    genreColorClass = "bg-[#99FF33]"; // Lime Green
                  } else if (book.genre === "Space Comedy") {
                    genreColorClass = "bg-[#9933FF]"; // Purple
                  }

                  return (
                    <div 
                      key={book._id} 
                      className="bg-white border-[8px] border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col justify-between relative group hover:scale-[1.01] transition-transform duration-200"
                    >
                      {/* Ribbon banner indicating owned or offer status */}
                      {owned ? (
                        <div className="absolute top-4 right-4 bg-[#39FF14] text-black border-4 border-black px-4 py-1.5 font-black text-xs uppercase rotate-6 z-10 shadow-[3px_3px_0_0_#000]">
                          OWNED ✅
                        </div>
                      ) : (
                        firstTimerOffer && (
                          <div className="absolute top-4 right-4 bg-[#FF55BB] text-black border-4 border-black px-4 py-1.5 font-black text-xs uppercase rotate-12 z-10 shadow-[3px_3px_0_0_#000]">
                            50% OFF!
                          </div>
                        )
                      )}

                      {/* Cover image with boundary divider */}
                      <div className="w-full h-72 bg-[#E1EDF2] border-b-[6px] border-black overflow-hidden relative shrink-0">
                        <img 
                          src={book.coverImageUrl} 
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Card Content Area */}
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          {/* Categorization Pills */}
                          <div className="flex flex-wrap gap-2.5 mb-4">
                            <span className={`px-4 py-1.5 border-[3px] border-black rounded-full font-black text-xs uppercase tracking-wider text-black select-none ${genreColorClass}`}>
                              {book.genre}
                            </span>
                            <span className="px-4 py-1.5 border-[3px] border-black rounded-full font-black text-xs uppercase bg-[#FFE600] text-black select-none">
                              {book.targetAgeGroup}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-display font-black text-2xl md:text-3xl text-black mb-3 tracking-tight leading-none text-left">
                            {book.title}
                          </h3>

                          {/* Moral Lesson tag */}
                          <div className="bg-amber-50 border-2 border-black p-2.5 rounded-xl mb-4 text-left">
                            <span className="text-[10px] font-black text-amber-800 uppercase block leading-none mb-1">🌟 THE LESSON:</span>
                            <span className="text-xs font-bold text-gray-800 italic">"{book.moralLesson}"</span>
                          </div>

                          {/* Description text */}
                          <p className="text-sm font-semibold text-gray-700 leading-snug mb-6 line-clamp-4 text-left">
                            {book.blurbText}
                          </p>
                        </div>

                        {/* Footer row with price & active checkout */}
                        <div className="border-t-[3px] border-dashed border-gray-400 pt-4 mt-auto">
                          <div className="flex items-center justify-between">
                            {/* Price labels */}
                            <div className="text-left">
                              <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider leading-none">Price Value</span>
                              <span className="text-[#FF007F] font-black text-3xl font-display leading-none block mt-1">
                                ${book.basePrice.toFixed(2)}
                              </span>
                            </div>

                            {/* View Action buttons matching picture theme color */}
                            {owned ? (
                              <button
                                onClick={() => launchReaderRoom(book)}
                                className={`border-[4px] border-black px-8 py-2.5 rounded-2xl font-black text-lg text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:scale-105 active:translate-y-0.5 transition-transform cursor-pointer ${genreColorClass}`}
                              >
                                VIEW
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchaseComic(book)}
                                className="border-[4px] border-black bg-[#39FF14] hover:bg-emerald-400 px-5 py-2.5 rounded-2xl font-black text-sm text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:scale-105 active:translate-y-0.5 transition-transform cursor-pointer flex flex-col items-center justify-center leading-none"
                              >
                                <span className="text-[8px] opacity-95 font-black tracking-wide block">STRIPE CARD ORDER</span>
                                <span className="font-black text-xs mt-1 block">💳 BUY FOR $4.00</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Direct claim preview for quick admin claims */}
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => {
                              setDirectPromoKey(book.giveawayId);
                              processPromotionalClaim(book.giveawayId);
                            }}
                            className="text-[10px] font-black underline text-gray-400 hover:text-[#FF55BB]"
                          >
                            Click here to bypass using key ({book.giveawayId})
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>
        )}

        {/* VIEW B: BACKDOOR ADMING GATEWAY PANEL - REACHED SECURELY */}
        {currentView === 'admin' && (
          <div className="bg-white border-4 border-black p-6 md:p-8 comic-shadow">
            
            <div className="flex flex-col md:flex-row items-start justify-between border-b-4 border-black pb-6 mb-6 gap-4">
              <div>
                <span className="bg-red-500 text-white font-black text-xs uppercase px-3 py-1 border-2 border-black rotate-[-2deg] inline-block mb-2">
                  INTERNAL SECURITY LEVEL 9
                </span>
                <h2 className="text-3xl md:text-5xl font-black uppercase text-black tracking-tighter">
                  🕵️‍♂️ THE PASS-THROUGH SECRET GATEWAY
                </h2>
                <p className="text-gray-700 font-bold mt-1 text-sm md:text-base">
                  You successfully bypassed standard validation using interception code <span className="font-extrabold text-[#FF55BB]">123Jasonsgame!15412907</span>. Access granted to configure dynamic book creations on-the-fly connected directly to the Gemini AI Generator.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { playRetroSound('woosh'); setCurrentView('store'); }}
                  className="bg-black text-white hover:bg-gray-800 font-black border-4 border-black px-4 py-2 uppercase tracking-wider scale-102"
                >
                  ✕ BACK TO STORE
                </button>
              </div>
            </div>

            {/* Quick action tools */}
            <div className="bg-cyan-100 border-4 border-black p-4 mb-8 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <span className="text-lg font-black block">🧪 AI GENERATOR SANDBOX ACTIONS</span>
                <span className="text-xs font-bold text-gray-700">Need some quick stories? Click Auto-Fill to populate parameters with amazing comedic scenarios!</span>
              </div>
              <button
                type="button"
                onClick={autofillGenFields}
                className="bg-[#FFE600] text-black font-black border-4 border-black px-6 py-2 uppercase text-sm hover:scale-105 active:translate-y-1"
              >
                🎁 AUTO-FILL DYNAMIC SCENARIO
              </button>
            </div>

            {/* Generator Form */}
            <form onSubmit={handleAiGenerationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Field 1: Title */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Comic Book Title</label>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="e.g. Danger Ducks & The Marshmallow Laser"
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>

                {/* Field 2: Genre */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Adventure Genre (100 Radical Choices Available!)</label>
                  <select
                    value={genGenre}
                    onChange={(e) => setGenGenre(e.target.value)}
                    className="w-full bg-white border-4 border-black p-3 font-bold cursor-pointer"
                  >
                    {COMIC_GENRES_100.map((genreOption) => (
                      <option key={genreOption} value={genreOption}>{genreOption}</option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Age Range */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Target Age Group</label>
                  <select
                    value={genAgeGroup}
                    onChange={(e) => setGenAgeGroup(e.target.value)}
                    className="w-full bg-white border-4 border-black p-3 font-bold cursor-pointer"
                  >
                    <option value="5-7 years">5-7 years (Kids)</option>
                    <option value="8-12 years">8-12 years (Graphic Novelists)</option>
                    <option value="Teenagers">Teenagers</option>
                  </select>
                </div>

                {/* Field 4: Moral Lesson */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Moral Lesson / Value</label>
                  <input
                    type="text"
                    value={genMoral}
                    onChange={(e) => setGenMoral(e.target.value)}
                    placeholder="e.g. Sharing your cookies boosts your space battery!"
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>

                {/* Field 5: Cover Image URL */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">DALL-E 3 Cover Mockup URL (Optional)</label>
                  <input
                    type="text"
                    value={genCoverUrl}
                    onChange={(e) => setGenCoverUrl(e.target.value)}
                    placeholder="Provide image link or leave empty to grab random fun library card artwork"
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                    title="Simulating DALL-E 3 children series generated design canvas"
                  />
                </div>

                {/* Field 6: Price */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Base Comic Price ($ USD / Equivalent Coins)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={genPrice}
                    onChange={(e) => setGenPrice(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>

                {/* Num pages */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Page Count Specs</label>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    value={genPageCount}
                    onChange={(e) => setGenPageCount(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>

                {/* Num words */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Target Word Count</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={genWordCount}
                    onChange={(e) => setGenWordCount(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>
              </div>

              {/* Field 9: Blurb Text */}
              <div>
                <label className="block text-md font-black uppercase mb-1">Story Book Blurb Description</label>
                <textarea
                  rows={3}
                  value={genBlurb}
                  onChange={(e) => setGenBlurb(e.target.value)}
                  placeholder="Summarize the high-energy premise with sound effects and lots of snorting!"
                  className="w-full bg-white border-4 border-black p-3 font-bold"
                ></textarea>
              </div>

              {adminGenError && (
                <div className="bg-red-100 border-4 border-red-600 p-4 text-center text-red-700 font-bold">
                  ⚠️ Error Generating Story: {adminGenError}
                </div>
              )}

              {adminGenSuccess && (
                <div className="bg-green-100 border-4 border-green-600 p-4 text-center text-green-700 font-bold rounded-none">
                  🎉 {adminGenSuccess}
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full md:w-auto bg-[#39FF14] text-black font-black text-xl border-4 border-black px-12 py-5 uppercase tracking-widest comic-shadow hover:scale-103 active:translate-y-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isGenerating ? "💥 SYNCING PROMPT WITH LLM STORY ENGINE..." : "🔥 TRIGGER MAGIC AI WEB GENERATOR 🚀"}
                </button>
              </div>
            </form>

            {/* 1-MINUTE BACKGROUND AUTO-GENERATION PANEL */}
            <div className="mt-8 p-6 bg-yellow-50 border-4 border-black border-dashed rounded-3xl">
              <span className="bg-purple-600 text-white font-black text-xs uppercase px-3 py-1 border-2 border-black rotate-[1deg] inline-block mb-2">
                ⚙️ BACKGROUND COMIC FACTORY
              </span>
              <h2 className="text-2xl font-black uppercase text-black">
                Continuous 1-Minute Draft Generator
              </h2>
              <p className="text-sm font-bold text-gray-700 mt-1 max-w-xl">
                When active, our beautiful story-weaver script synthesizes an unpublished high-style 50-page graphic novel draft every minute. You can then review, edit, publish or delete them securely below.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <button
                  type="button"
                  onClick={toggleAutoGeneratorState}
                  className={`border-4 border-black px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all scale-102 cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-y-0.5 ${
                    isGeneratorActive 
                      ? "bg-red-500 hover:bg-red-400 text-white" 
                      : "bg-[#39FF14] hover:bg-emerald-400 text-black"
                  }`}
                >
                  {isGeneratorActive 
                    ? "🔴 PAUSE CONTINUOUS 1-MIN GENERATOR" 
                    : "🟢 START CONTINUOUS 1-MIN GENERATION"}
                </button>

                <button
                  type="button"
                  disabled={isTriggeringNow}
                  onClick={forceAutoGenerateNow}
                  className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black border-4 border-black px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all scale-102 cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-y-0.5"
                >
                  {isTriggeringNow 
                    ? "💥 GENERATING EXQUISITE STORY DRAFT..." 
                    : "⚡ GENERATE 1 HIGH-STYLE DRAFT NOW"}
                </button>

                <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black rounded-lg font-mono text-xs font-black">
                  <span>STATUS:</span>
                  <span className={isGeneratorActive ? "text-emerald-600 animate-pulse" : "text-red-500"}>
                    {isGeneratorActive ? "● ONLINE & WEAVING" : "○ PAUSED"}
                  </span>
                </div>
              </div>
            </div>

            {/* MASTER BOOK ACTIONS PANEL */}
            <div className="mt-12 pt-8 border-t-4 border-black">
              <h3 className="text-3xl font-black mb-1 uppercase text-black tracking-tight">
                👑 MASTER BOOK COMPREHENSIVE CONTROL CENTER
              </h3>
              <p className="text-sm font-bold text-gray-700 mb-6">
                Administrators can read, edit details & words screen-by-screen, publish/unpublish, and delete books live!
              </p>

              {editingBookId ? (
                /* LIVE PAGE EDITOR PANEL */
                <div className="bg-[#FFF59D] border-4 border-black p-6 mb-8 comic-shadow">
                  <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
                    <h4 className="text-xl font-black uppercase text-black">
                      📝 EDITING THE INNER PAGES & DETAILS: "{editFormTitle}"
                    </h4>
                    <button
                      type="button"
                      onClick={() => { playRetroSound('woosh'); setEditingBookId(null); }}
                      className="bg-black text-white px-3 py-1 font-black text-xs uppercase"
                    >
                      ✕ Cancel Edit
                    </button>
                  </div>

                  <form onSubmit={handleEditBookSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Comic Book Title</label>
                        <input
                          type="text"
                          value={editFormTitle}
                          onChange={(e) => setEditFormTitle(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Adventure Genre</label>
                        <select
                          value={editFormGenre}
                          onChange={(e) => setEditFormGenre(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                        >
                          {COMIC_GENRES_100.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Price ($ USD)</label>
                        <input
                          type="number"
                          step="0.50"
                          value={editFormPrice}
                          onChange={(e) => setEditFormPrice(Number(e.target.value))}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Target Age Group</label>
                        <input
                          type="text"
                          value={editFormAgeGroup}
                          onChange={(e) => setEditFormAgeGroup(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Moral Lesson</label>
                        <input
                          type="text"
                          value={editFormMoral}
                          onChange={(e) => setEditFormMoral(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-1">Book Description Blurb</label>
                      <textarea
                        rows={2}
                        value={editFormBlurb}
                        onChange={(e) => setEditFormBlurb(e.target.value)}
                        className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                        required
                      ></textarea>
                    </div>

                    {/* INTERACTIVE PAGE-BY-PAGE WORD EDITOR */}
                    <div className="border-t-2 border-black pt-4">
                      <h5 className="text-lg font-black uppercase mb-3">📖 SCAN & MODIFY LIVE PAGES TEXT:</h5>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {editFormPages.map((page, pIdx) => (
                          <div key={pIdx} className="bg-white border-2 border-black p-3 flex gap-4 items-start">
                            <div className="w-16 h-16 border-2 border-black flex-shrink-0 bg-gray-100 overflow-hidden">
                              <img src={page.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <span className="text-xs font-black text-magenta-800 uppercase block mb-1">
                                PAGE {page.pageNumber} ILLUSTRATION SCENE WORDS:
                              </span>
                              <textarea
                                value={page.textContent}
                                onChange={(e) => handleEditBookPageChange(pIdx, e.target.value)}
                                rows={2}
                                className="w-full border border-gray-400 p-2 font-bold text-xs"
                                placeholder="Edit actual narration/speech bubble text..."
                              ></textarea>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {adminSavingError && (
                      <div className="bg-red-100 text-red-700 font-extrabold p-2 text-xs border border-red-500">
                        {adminSavingError}
                      </div>
                    )}
                    {adminSavingSuccess && (
                      <div className="bg-green-100 text-green-700 font-extrabold p-2 text-xs border border-green-500">
                        {adminSavingSuccess}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isAdminSaving}
                        className="bg-black text-[#39FF14] border-4 border-black px-6 py-2 font-black uppercase hover:scale-103 active:translate-y-1"
                      >
                        {isAdminSaving ? "SAVING..." : "💾 SAVE UPDATED COMIC BOOK 🚀"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { playRetroSound('woosh'); setEditingBookId(null); }}
                        className="bg-gray-300 text-black border-4 border-black px-6 py-2 font-black uppercase hover:bg-gray-400"
                      >
                        CLOSE EDITOR
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* LIVE TABLE LISTING OF ALL DYNAMIC BOOKS */}
              <div className="bg-white border-4 border-black p-4 overflow-x-auto comic-shadow-sm">
                <table className="w-full text-left font-bold text-sm">
                  <thead>
                    <tr className="border-b-4 border-black uppercase text-xs">
                      <th className="pb-3">Book Cover & Title</th>
                      <th className="pb-3">Genre</th>
                      <th className="pb-3">Pricing Base</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Interactive Command Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {books.map((b) => {
                      const giveawayUrl = `${window.location.protocol}//${window.location.host}/api/v1/promotions/claim?key=${b.giveawayId}`;
                      return (
                        <tr key={b._id} className="hover:bg-yellow-50">
                          <td className="py-4 pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 border-2 border-black bg-cyan-100 overflow-hidden flex-shrink-0">
                                <img src={b.coverImageUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=120"} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="font-black text-black block text-sm md:text-base leading-tight">{b.title}</span>
                                <span className="text-[10px] text-gray-500 font-mono">ID: {b._id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="bg-[#FFE600] text-black text-xs font-black px-2 py-0.5 border-2 border-black uppercase inline-block">
                              {b.genre}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-cyan-800 font-black">
                            ${b.basePrice.toFixed(2)} USD
                          </td>
                          <td className="py-4">
                            {b.isPublished ? (
                              <span className="bg-[#39FF14] text-black border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase">
                                PUBLISHED (ACTIVE) ✅
                              </span>
                            ) : (
                              <span className="bg-red-500 text-white border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase">
                                UNPUBLISHED (DRAFT) 🛑
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex flex-wrap gap-1 justify-end">
                              <button
                                onClick={() => { playRetroSound('woosh'); launchReaderRoom(b); }}
                                className="bg-sky-400 hover:bg-sky-500 text-black font-black text-xs px-2 py-1 border-2 border-black uppercase"
                                title="Admin instant book review launcher"
                              >
                                READ 📖
                              </button>
                              <button
                                onClick={() => handleEditBookSelect(b)}
                                className="bg-[#FF55BB] hover:bg-pink-400 text-black font-black text-xs px-2 py-1 border-2 border-black uppercase"
                              >
                                EDIT WORDS 📝
                              </button>
                              <button
                                onClick={() => handleTogglePublish(b._id)}
                                className="bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs px-2 py-1 border-2 border-black uppercase"
                              >
                                {b.isPublished ? 'UNPUBLISH ⚙️' : 'PUBLISH ⚡'}
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b._id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-2 py-1 border-2 border-black uppercase font-mono"
                              >
                                DELETE ✕
                              </button>
                            </div>
                            <div className="mt-2 text-[10px] font-mono select-all bg-gray-100 p-1 border border-dashed border-gray-400 text-left truncate max-w-xs inline-block">
                              Promo claim bypass: {giveawayUrl}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW C: SIGN-UP & AUTH TEMPLATES */}
        {currentView === 'auth' && (
          <div className="max-w-md mx-auto bg-white border-4 border-black p-6 md:p-8 comic-shadow relative">
            
            <div className="absolute -top-5 -right-4 bg-[#FFE600] text-black border-2 border-black rotate-12 px-3 py-1 font-black text-xs uppercase z-10">
              100% SECURE 🛡️
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                {authMode === 'signup' ? "📝 CREAT PLAYER REEL" : "🔑 HELLO BACK CADET!"}
              </h2>
              <p className="text-xs font-bold text-gray-600 mt-1">
                {authMode === 'signup' 
                  ? "Create your custom player profile to start unlocking high-energy graphic novels for $4.00!" 
                  : "Input your email and password to reload your active badges and personal museum history."}
              </p>
            </div>

            <div className="flex border-4 border-black mb-6">
              <button
                type="button"
                onClick={() => { playRetroSound('woosh'); setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-center font-black uppercase text-sm ${
                  authMode === 'signup' ? 'bg-[#FF55BB] text-black' : 'bg-white text-gray-500 hover:text-black'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { playRetroSound('woosh'); setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-center font-black uppercase text-sm border-l-4 border-black ${
                  authMode === 'login' ? 'bg-[#FF55BB] text-black' : 'bg-white text-gray-500 hover:text-black'
                }`}
              >
                Login
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Pick Comic Username</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. SpacePiglet99"
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase mb-1">Your Cadet Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="cadet@comicworld.com"
                  className="w-full bg-white border-4 border-black p-3 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Enter Secret Password</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-4 border-black p-3 font-bold"
                />
              </div>

              {authError && (
                <div className="bg-red-50 border-2 border-red-600 p-3 text-xs font-black text-red-700">
                  ⚠️ {authError}
                </div>
              )}

              {authSuccess && (
                <div className="bg-green-50 border-2 border-green-600 p-3 text-xs font-black text-green-700">
                  🎉 {authSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#39FF14] text-black font-black border-4 border-black py-4 uppercase text-lg tracking-wide comic-shadow-sm comic-shadow-hover cursor-pointer"
              >
                {authMode === 'signup' ? "🎡 REGISTER & ENTER ACADEMY" : "🚀 ACCESS PROFILE"}
              </button>
            </form>

            <div className="mt-6 text-center border-t-2 border-black pt-4">
              <button
                type="button"
                onClick={() => { playRetroSound('woosh'); setCurrentView('store'); }}
                className="text-xs font-black uppercase text-gray-700 hover:text-black underline"
              >
                ◀ Back to Story Library
              </button>
            </div>

          </div>
        )}

      </main>

      {/* 4. INTEL PAGE-FLIP REACTOR LAYOUT - SECTION 6 ISOLATED ROOM */}
      {currentView === 'reader' && readingBook && (
        <div className="fixed inset-0 bg-[#FFDAB9] z-50 overflow-y-auto font-sans flex flex-col justify-between p-4 md:p-8 bg-peach-pattern select-text">
          
          {/* isolated top actions bar */}
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between border-b-4 border-black pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#FFE600] border-2 border-black px-3 py-1 font-black text-xs md:text-sm uppercase rotate-[-2deg]">
                📖 NOW READING PHYSICAL ROOM
              </span>
              <h2 className="text-xl md:text-3xl font-black text-black leading-none drop-shadow-sm line-clamp-1 uppercase tracking-tight">
                {readingBook.title}
              </h2>
            </div>

            <button
              onClick={() => { playRetroSound('woosh'); setCurrentView('store'); setReadingBook(null); }}
              className="bg-black text-white hover:bg-neutral-800 font-black border-4 border-black px-4 py-2 uppercase tracking-wide text-xs md:text-sm shadow-sm cursor-pointer"
            >
              ✕ EXIT BACK LIBRARY
            </button>
          </div>

          {/* BOLD HIGH-CONTRAST COMIC PROGRESS BAR */}
          <div className="max-w-7xl mx-auto w-full mb-4">
            {(() => {
              const maxSpreads = Math.ceil(readingBook.pages.length / 2);
              const progressPercent = maxSpreads > 0 
                ? Math.min(100, Math.round(((currentSpreadIndex + 1) / maxSpreads) * 100)) 
                : 100;
              return (
                <div className="w-full bg-white border-4 border-black p-1 rounded-full relative overflow-hidden flex items-center shadow-[4px_4px_0_0_#000] select-none">
                  <div 
                    className="bg-[#39FF14] h-5 rounded-full border-r-4 border-black transition-all duration-300 flex items-center justify-end pr-3"
                    style={{ width: `${progressPercent}%`, minWidth: '8%' }}
                  >
                    <span className="text-[10px] font-black text-black tracking-widest leading-none">
                      {progressPercent}%
                    </span>
                  </div>
                  <span className="absolute right-4 text-[9px] font-black text-black uppercase tracking-wider">
                    ⚡ PAGE STORY PROGRESS ({currentSpreadIndex + 1} / {maxSpreads} SPREADS)
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Physical open book rendering spread */}
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            
            <div className="w-full max-w-5xl flex items-center justify-between gap-2 md:gap-4">
              
              {/* Left Spread Arrow Button */}
              <button 
                onClick={() => {
                  if (currentSpreadIndex > 0) {
                    playRetroSound('woosh');
                    setCurrentSpreadIndex(currentSpreadIndex - 1);
                  }
                }}
                disabled={currentSpreadIndex === 0}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#FFE600] text-black border-4 border-black text-xl font-black flex items-center justify-center comic-shadow-sm comic-shadow-hover hover:scale-105 active:translate-y-1 disabled:opacity-30 cursor-pointer select-none"
              >
                ◀
              </button>

              {/* Spine wrap splitting landscape screen into left/right pages */}
              <div className="physical-book-spine w-full flex flex-col md:flex-row overflow-hidden">
                
                {/* Left side book page render */}
                {(() => {
                  const leftIndex = currentSpreadIndex * 2;
                  const leftPage = readingBook.pages[leftIndex];

                  return (
                    <div className="page-sheet left-sheet flex-1 bg-white relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                      {leftPage ? (
                        <div className="h-full flex flex-col justify-between">
                          
                          {/* Vibrant Creative Artwork panel matching the text */}
                          <div className="w-full h-44 md:h-64 border-4 border-black overflow-hidden relative bg-cyan-50">
                            <img 
                              src={leftPage.imageUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"} 
                              alt={`Illustration for page ${leftPage.pageNumber}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-yellow-300 border-2 border-black text-xs font-black px-2 uppercase">
                              PAGE {leftPage.pageNumber}
                            </div>
                          </div>

                          {/* Sound effect comic badge if present */}
                          <div className="my-2 text-center">
                            <span className="sound-effect-txt bg-red-500 border-2 border-black px-3 py-1 font-black text-xs md:text-sm uppercase scale-105">
                              {leftPage.pageNumber % 2 === 0 ? "SPLAT! 💥" : "KABOOM! ⚡"}
                            </span>
                          </div>

                          {/* Dialog Bubble text content */}
                          <div className="comic-bubble bg-yellow-50 min-h-[100px] overflow-y-auto">
                            <p className="text-sm md:text-base text-gray-800 font-extrabold leading-tight">
                              {leftPage.textContent}
                            </p>
                          </div>

                          <div className="text-right text-xs font-black text-black pt-2 select-none">
                            📖 SPREAD: {currentSpreadIndex + 1} / {Math.ceil(readingBook.pages.length / 2)}
                          </div>

                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 p-8">
                          <BookOpen className="w-12 h-12 text-gray-400 mb-2" />
                          <h4 className="text-lg font-black text-gray-500">START OF SPREAD</h4>
                          <p className="text-xs font-bold text-center text-gray-400">This page left intentionally blank as standard physical layouts!</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Right side book page render */}
                {(() => {
                  const rightIndex = (currentSpreadIndex * 2) + 1;
                  const rightPage = readingBook.pages[rightIndex];

                  return (
                    <div className="page-sheet right-sheet flex-1 bg-white relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                      {rightPage ? (
                        <div className="h-full flex flex-col justify-between">
                          
                          {/* Vibrant Creative Artwork panel matching the text */}
                          <div className="w-full h-44 md:h-64 border-4 border-black overflow-hidden relative bg-magenta-50">
                            <img 
                              src={rightPage.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"} 
                              alt={`Illustration for page ${rightPage.pageNumber}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-yellow-300 border-2 border-black text-xs font-black px-2 uppercase">
                              PAGE {rightPage.pageNumber}
                            </div>
                          </div>

                          {/* Sound effect comic badge if present */}
                          <div className="my-2 text-center">
                            <span className="sound-effect-txt bg-[#39FF14] text-black border-2 border-black px-3 py-1 font-black text-xs md:text-sm uppercase scale-105">
                              {rightPage.pageNumber % 3 === 0 ? "SQUEAL! 🐷" : "WHOOSH! 🌪️"}
                            </span>
                          </div>

                          {/* Dialog Bubble text content */}
                          <div className="comic-bubble bg-blue-50/70 min-h-[100px] overflow-y-auto">
                            <p className="text-sm md:text-base text-gray-800 font-extrabold leading-tight">
                              {rightPage.textContent}
                            </p>
                          </div>

                          <div className="text-right text-xs font-black text-black pt-2 select-none">
                            📖 SPREAD: {currentSpreadIndex + 1} / {Math.ceil(readingBook.pages.length / 2)}
                          </div>

                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 p-8">
                          <p className="text-lg font-black text-gray-500">🏆 CHAPTER COMPLETE STATUS!</p>
                          <p className="text-xs font-bold text-center text-gray-400 mb-4">You have finished reading this comic book completely!</p>
                          
                          {user ? (
                            <button
                              onClick={async () => {
                                playRetroSound('sparkle');
                                alert(`🎉 Spectacular mission accomplished, Cadet!\n\nYou've successfully earned the "${readingBook.title} Complete Champion" badge! View it in your museum for bragging rights.`);
                                try {
                                  const res = await fetch(`/api/v1/users/${user._id}/earn-badge`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      badgeId: `completed_${readingBook._id}`, 
                                      badgeTitle: `${readingBook.title} Complete Champion` 
                                    })
                                  });
                                  if (res.ok) {
                                    const d = await res.json();
                                    if (d.success && d.user) {
                                      setUser(d.user);
                                      localStorage.setItem('comic_user', JSON.stringify(d.user));
                                    }
                                  }
                                } catch(e){}

                                // Award other cool badges
                                setTimeout(() => {
                                  earnNamedBadge('read_first', 'First Reader Chapter');
                                }, 1500);

                                if (user && user.ownedBooks && user.ownedBooks.length >= 2) {
                                  setTimeout(() => {
                                    earnNamedBadge('read_5_dog', 'Dog Detective Crew');
                                  }, 4000);
                                  setTimeout(() => {
                                    earnNamedBadge('read_5_adventure', 'Morganville Survivalist');
                                  }, 6500);
                                }
                              }}
                              className="bg-[#39FF14] text-black border-4 border-black px-4 py-2 font-black text-xs uppercase hover:bg-neutral-100 active:translate-y-1 comic-shadow-sm cursor-pointer"
                            >
                              🎁 CLAIM BRAGGING RIGHTS MUSEUM BADGE
                            </button>
                          ) : (
                            <p className="text-xs font-semibold text-center text-red-500 uppercase">
                              Sign up for free to save your history and earn cool bragging-rights badges!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* Right Spread Arrow Button */}
              <button 
                onClick={() => {
                  const maxSpreads = Math.ceil(readingBook.pages.length / 2);
                  if (currentSpreadIndex < maxSpreads - 1) {
                    playRetroSound('woosh');
                    setCurrentSpreadIndex(currentSpreadIndex + 1);
                  }
                }}
                disabled={currentSpreadIndex === Math.ceil(readingBook.pages.length / 2) - 1}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#FFE600] text-black border-4 border-black text-xl font-black flex items-center justify-center comic-shadow-sm comic-shadow-hover hover:scale-105 active:translate-y-1 disabled:opacity-30 cursor-pointer select-none"
              >
                ▶
              </button>

            </div>

          </div>

          {/* isolated bottom status or page flip indicators */}
          <div className="max-w-4xl mx-auto w-full text-center border-t-4 border-black pt-4 flex flex-col md:flex-row items-center justify-between text-xs md:text-sm font-black text-black">
            <span>⚡ KID-SAFE COMPLIANCE MODE</span>
            <span>💡 ESC KEY OR EXIT BUTTON WILL SAFELY RETRANSLATE THE VIEW INSTANTLY</span>
            <span className="text-magenta-800">COMIC BOOK READER isolation v2.09</span>
          </div>

        </div>
      )}

      {/* BADGES MUSEUM / INDEX DISPLAY MODAL */}
      {showBadgesModal && user && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFEE5] border-8 border-black max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-3xl p-6 md:p-8 comic-shadow relative">
            
            {/* Absolute close button */}
            <button
              onClick={() => { playRetroSound('woosh'); setShowBadgesModal(false); }}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-400 text-white font-black border-4 border-black p-2.5 rounded-full rotate-6 hover:rotate-12 transition-all cursor-pointer shadow-[3px_3px_0_0_#000]"
              title="Close Badge Chest"
            >
              ✕ CLOSE
            </button>

            <div className="text-center mb-6">
              <span className="bg-[#FFE600] text-black text-xs font-black px-3 py-1 border-2 border-black uppercase rotate-[-2deg] inline-block mb-2">
                🏆 MORGANVILLE HALL OF HEROES
              </span>
              <h3 className="text-3xl md:text-5xl font-black uppercase text-black tracking-tighter">
                YOUR BADGE INDEX CHEST
              </h3>
              <p className="text-sm font-bold text-gray-700 max-w-md mx-auto mt-2">
                Own multiple dynamic books, finished reading volumes, or continuous hour logs to unlock rare collectibles! 
                <span className="text-amber-800 font-extrabold block mt-1">✨ Show off your unlocked achievements with bragging-rights collector ranks!</span>
              </p>
            </div>

            {/* Core statistics cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border-4 border-black p-3 text-center rounded-2xl shadow-[4px_4px_0_0_#000]">
                <span className="text-[10px] font-black text-gray-400 block uppercase">Badges Collected</span>
                <span className="text-3xl font-black text-pink-600">{user ? user.badges.length : 0}</span>
              </div>
              <div className="bg-white border-4 border-black p-3 text-center rounded-2xl shadow-[4px_4px_0_0_#000]">
                <span className="text-[10px] font-black text-gray-400 block uppercase">Collector Rank</span>
                <span className="text-xs font-black text-emerald-500 uppercase block mt-2">
                  {(!user || user.badges.length <= 1) ? "🌱 Young Recruit" :
                   user.badges.length <= 3 ? "🥈 Silver Detective" :
                   user.badges.length <= 5 ? "🥇 Golden Alchemist" : "👑 Cosmic Overlord"}
                </span>
              </div>
            </div>

            {/* Badges Index List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="text-xs font-black uppercase text-gray-500">🔻 COMMON UNLOCKED (TOP)</span>
                <span className="text-xs font-black uppercase text-gray-500">⭐ RAREST COLLECTIBLES (BOTTOM)</span>
              </div>

              {!user || user.badges.length === 0 ? (
                <div className="bg-white border-4 border-black p-8 text-center rounded-2xl">
                  <p className="text-lg font-black text-gray-400 uppercase">Your Badge Case is Empty! 🐣</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">Unlock badges by reading, purchasing, and staying focused in the Story Reader.</p>
                </div>
              ) : (() => {
                const userBadges = user.badges || [];
                const mergedBadgesList = userBadges.map((ub) => {
                  const foundDef = ALL_SYSTEM_BADGES_DEFINITIONS.find(
                    (def) => ub.badgeId === def.id || ub.title.toLowerCase().includes(def.title.toLowerCase())
                  );
                  if (foundDef) {
                    return {
                      ...foundDef,
                      unlockedAt: ub.unlockedAt || new Date().toISOString()
                    };
                  } else {
                    return {
                      id: ub.badgeId,
                      title: ub.title,
                      description: `Awarded during your active discovery and reading trials in the comic arena.`,
                      rarity: 'UNCOMMON' as const,
                      rarityScore: 2,
                      icon: '🏆',
                      unlockedAt: ub.unlockedAt || new Date().toISOString()
                    };
                  }
                });

                // Rarest with highest rarityScore go to the BOTTOM
                mergedBadgesList.sort((a, b) => a.rarityScore - b.rarityScore);

                return (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {mergedBadgesList.map((badge, idx) => {
                      let rarityBadgeClass = "bg-gray-100 text-black";
                      if (badge.rarity === 'UNCOMMON') rarityBadgeClass = "bg-sky-400 text-black";
                      else if (badge.rarity === 'RARE') rarityBadgeClass = "bg-[#FF007F] text-white";
                      else if (badge.rarity === 'EPIC') rarityBadgeClass = "bg-[#9933FF] text-white animate-pulse";
                      else if (badge.rarity === 'LEGENDARY') rarityBadgeClass = "bg-[#39FF14] text-black border border-black";

                      return (
                        <div 
                          key={idx} 
                          className="bg-white border-4 border-black rounded-2xl p-4 flex items-center gap-4 hover:bg-yellow-50 transition-colors shadow-[3px_3px_0_0_#000]"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-black bg-cyan-100 flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000]">
                            {badge.icon}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-black text-sm md:text-base leading-none tracking-tight">
                                {badge.title}
                              </h4>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-black ${rarityBadgeClass}`}>
                                {badge.rarity}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 mt-1 line-clamp-1">
                              {badge.description}
                            </p>
                            <span className="text-[9px] text-gray-400 font-mono italic block mt-0.5">
                              Claimed on: {new Date(badge.unlockedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>

            <div className="mt-6 pt-4 border-t-2 border-black flex justify-center">
              <button
                onClick={() => { playRetroSound('woosh'); setShowBadgesModal(false); }}
                className="bg-black text-[#FFE600] font-black border-4 border-black px-8 py-3 uppercase tracking-wider hover:bg-neutral-800"
              >
                GOT IT! BACK TO STORE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
