import React, { useState, useEffect, useRef } from 'react';
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
  Sparkle,
  FileImage
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
  isPictureBook?: boolean;
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
  bannedUntil?: string;
  banReason?: string;
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

    const vol = (window as any).retroSoundVolume !== undefined ? (window as any).retroSoundVolume : 0.8;

    if (selectedType === 'woosh') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (selectedType === 'splat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3 * vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (selectedType === 'coin') {
      // Classic double retro coin ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (selectedType === 'sparkle') {
      // Magic high chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (selectedType === 'admin') {
      // Secret laser sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (selectedType === 'kaboom') {
      // Powerful descending explosion synth
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.35 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (selectedType === 'whizz') {
      // High sliding sci-fi slide
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (selectedType === 'boom') {
      // Low sub bass kick boom
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (selectedType === 'bam') {
      // Mid punchy sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (selectedType === 'pow') {
      // High-pitched snap blast
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.2);
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
  
  // Track dynamically generated titles to ensure no duplicates ever appear
  const generatedTitlesList = useRef<Set<string>>(new Set());
  const hoverTimersRef = useRef<Record<string, any>>({});
  
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
  const [genIsPictureBook, setGenIsPictureBook] = useState<boolean>(true);
  const [editFormIsPictureBook, setEditFormIsPictureBook] = useState<boolean>(true);
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
  const [selectedGenreTag, setSelectedGenreTag] = useState<string>('All');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSearchQuery, setGenreSearchQuery] = useState<string>('');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState<boolean>(false);
  const [aiHolidayData, setAiHolidayData] = useState<{ isHoliday: boolean; holidayName: string }>({ isHoliday: false, holidayName: "" });

  // Recents and AI Recommendations
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<{ book: Book; reason: string }[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(false);

  const toggleGenreFilter = (g: string) => {
    playRetroSound('coin');
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter(item => item !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const clearAllSelectedGenres = () => {
    playRetroSound('splat');
    setSelectedGenres([]);
  };

  // Secure Stripe checkout modal integration states
  const [stripeModalBook, setStripeModalBook] = useState<Book | null>(null);
  const [stripeCardName, setStripeCardName] = useState<string>('');
  const [stripeCardNum, setStripeCardNum] = useState<string>('');
  const [stripeCardExpiry, setStripeCardExpiry] = useState<string>('');
  const [stripeCardCvc, setStripeCardCvc] = useState<string>('');
  const [stripeCardZip, setStripeCardZip] = useState<string>('');
  const [stripeWatchdogTransactionId, setStripeWatchdogTransactionId] = useState<string>('');
  const [stripeWatchdogNote, setStripeWatchdogNote] = useState<string>('');
  const [stripeProcessing, setStripeProcessing] = useState<boolean>(false);
  const [stripeError, setStripeError] = useState<string>('');
  // Page flip transition state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('left');
  
  // Confetti and Leveling Visual effect states
  const [confettiBurstActive, setConfettiBurstActive] = useState<boolean>(false);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; x: number; y: number; color: string; size: number; duration: number; delay: number; shape: string }[]>([]);
  const [isLevelingUp, setIsLevelingUp] = useState<boolean>(false);

  const triggerConfetti = () => {
    try {
      const colors = ['#39FF14', '#FF007F', '#00D4FF', '#FFE600', '#FF55BB', '#9933FF', '#FF9900'];
      const shapes = ['circle', 'square', 'triangle', 'star'];
      const particles = Array.from({ length: 120 }).map((_, i) => ({
        id: i,
        x: 50,
        y: 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 6,
        duration: Math.random() * 1.8 + 1.2,
        delay: Math.random() * 0.3,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      }));
      setConfettiParticles(particles);
      setConfettiBurstActive(true);
      playRetroSound('sparkle');
      setTimeout(() => {
        setConfettiBurstActive(false);
        setConfettiParticles([]);
      }, 3500);
    } catch (e) {
      console.error(e);
    }
  };
  
  // Weekly Goal and progress visual states
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => {
    const saved = localStorage.getItem('weekly_reading_target');
    return saved ? Number(saved) : 20;
  });
  const [completedBookIds, setCompletedBookIds] = useState<string[]>([]);
  const [showCompletionBurst, setShowCompletionBurst] = useState<boolean>(false);
  const [activeConfetti, setActiveConfetti] = useState<{ id: number; color: string; left: number; top: number; delay: number }[]>([]);
  
  // Custom Speech synthesis voice states (exactly 9 voice options)
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(7); // Default friendly Showman
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<boolean>(false);
  // Badge overview visual modal toggle
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  // Book coins purchase confirmation dialog box
  const [coinsConfirmBook, setCoinsConfirmBook] = useState<Book | null>(null);

  // Default starter book state selected by admin
  const [defaultBookId, setDefaultBookId] = useState<string | null>(null);

  // Retro sound effect volume state (persisted in localStorage, synced with global window object)
  const [retroVolume, setRetroVolume] = useState<number>(() => {
    const saved = localStorage.getItem('comic_retro_volume');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return 0.8; // Default volume is 80%
  });

  useEffect(() => {
    (window as any).retroSoundVolume = retroVolume;
  }, [retroVolume]);

  useEffect(() => {
    fetch('/api/v1/detect-holiday')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setAiHolidayData({ isHoliday: data.isHoliday, holidayName: data.holidayName });
        }
      })
      .catch(err => console.error("Failed to load AI holiday data:", err));
  }, []);

  // Polling watchdog to automatically detect Whop purchases
  useEffect(() => {
    if (!stripeModalBook || !user) return;

    let isCleared = false;
    const interval = setInterval(async () => {
      try {
        const uRes = await fetch(`/api/v1/users/${user._id}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.success && uData.user) {
            // Check if user has now purchased this book
            const hasPurchased = uData.user.ownedBooks && uData.user.ownedBooks.some(
              (ob: any) => ob.bookId.toString() === stripeModalBook._id.toString()
            );
            if (hasPurchased && !isCleared) {
              isCleared = true;
              setUser(uData.user);
              localStorage.setItem('comic_user', JSON.stringify(uData.user));
              playRetroSound('sparkle');
              
              // Redirect to personal collection owned page
              setCurrentView('store');
              setStoreFilter('collection');
              setStripeModalBook(null);
            }
          }
        }
      } catch (err) {
        console.error("Watchdog polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [stripeModalBook, user]);

  // Admin Edit Selected Book States
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editFormTitle, setEditFormTitle] = useState<string>('');
  const [editFormGenre, setEditFormGenre] = useState<string>('');
  const [editFormAgeGroup, setEditFormAgeGroup] = useState<string>('');
  const [editFormMoral, setEditFormMoral] = useState<string>('');
  const [editFormBlurb, setEditFormBlurb] = useState<string>('');
  const [editFormPrice, setEditFormPrice] = useState<number>(4.00);
  const [editFormPages, setEditFormPages] = useState<Page[]>([]);
  const [editFormCoverImageUrl, setEditFormCoverImageUrl] = useState<string>('');
  const [isAdminSaving, setIsAdminSaving] = useState<boolean>(false);
  const [adminSavingSuccess, setAdminSavingSuccess] = useState<string>('');
  const [adminSavingError, setAdminSavingError] = useState<string>('');

  // Admin sub-tab: 'all' to show comprehensive controls, 'drafts' for Draft Review
  const [adminSubTab, setAdminSubTab] = useState<'all' | 'drafts'>('all');

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
          if (data.defaultBookId) {
            setDefaultBookId(data.defaultBookId);
          }
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

  const trackActivityInClient = async (
    type: 'stared' | 'clicked_buy' | 'read' | 'delete_recent' | 'bookmark' | 'page_read', 
    bookId: string,
    pagesCount?: number
  ) => {
    if (!user) return;
    try {
      const res = await fetch('/api/v1/user/track-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, type, bookId, pagesCount })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('comic_user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error("Error tracking activity:", err);
    }
  };

  // Fetch AI Recommendations and Recents
  useEffect(() => {
    if (!user) {
      setRecentBooks([]);
      setRecommendedBooks([]);
      return;
    }

    // Load Recents from user context and full books
    if (user.recentReadBookIds && user.recentReadBookIds.length > 0 && books.length > 0) {
      const recentsMatched = user.recentReadBookIds
        .map(id => books.find(b => b._id.toString() === id.toString()))
        .filter(Boolean) as Book[];
      setRecentBooks(recentsMatched);
    } else {
      setRecentBooks([]);
    }

    // Load AI Recommendations
    const fetchRecommendations = async () => {
      try {
        setIsRecommendationsLoading(true);
        const res = await fetch(`/api/v1/user/${user._id}/recommendations`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.recommendations)) {
            setRecommendedBooks(data.recommendations);
          }
        }
      } catch (err) {
        console.error("Error loading recommendations:", err);
      } finally {
        setIsRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, books]);

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

  const getDynamicWhopLink = () => {
    if (!user) return "https://whop.com/checkout/plan_RqZyx8HYffDeb"; // Fallback to first book link
    
    // Check for Holiday using AI Detection
    if (aiHolidayData && aiHolidayData.isHoliday) {
      return "https://whop.com/checkout/plan_bT2ewBnsS8aTs";
    }
    
    // Check if it's the first book on their account
    const hasBoughtBooks = user.ownedBooks && user.ownedBooks.length > 0;
    if (!hasBoughtBooks) {
      return "https://whop.com/checkout/plan_RqZyx8HYffDeb";
    }
    
    // Subsequent book purchase
    return "https://whop.com/checkout/plan_KBVkdpBQUPSgm";
  };

  // Card checkout sequence representing a modern Whop processing terminal
  const handlePurchaseComic = async (book: Book) => {
    if (!user) {
      setRedirectTarget(`/store/book/${book._id}`);
      setAuthMode('signup');
      setAuthError('Create a quick player account below to unlock and buy this book!');
      setCurrentView('auth');
      playRetroSound('splat');
      return;
    }

    // Track buy click
    trackActivityInClient('clicked_buy', book._id);

    // Register last clicked book before redirect
    try {
      await fetch("/api/v1/users/set-pending-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, bookId: book._id })
      });
    } catch (e) {
      console.error("Failed to set pending book on backend:", e);
    }

    const whopUrl = getDynamicWhopLink();
    try {
      window.open(whopUrl, '_blank');
    } catch (e) {
      console.error("Popup blocked:", e);
    }

    // Launch Whop Automated watchdog verification modal
    setStripeError('');
    setStripeProcessing(true);
    setStripeModalBook(book);
    playRetroSound('coin');
  };

  const submitStripePayment = async () => {
    if (!stripeModalBook || !user) return;
    if (!stripeCardName.trim()) {
      setStripeError("Please provide the Cardholder / Payer Name.");
      return;
    }
    if (!stripeWatchdogTransactionId.trim()) {
      setStripeError("Please enter your Stripe Transaction ID or Receipt Number.");
      return;
    }

    setStripeProcessing(true);
    setStripeError('');

    try {
      const res = await fetch('/api/v1/books/verify-watchdog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user._id, 
          bookId: stripeModalBook._id,
          payerName: stripeCardName,
          transactionId: stripeWatchdogTransactionId,
          noteText: stripeWatchdogNote
        })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        if (data.banned || data.scamDetected) {
          // BAN ENFORCED!
          const updatedUser = {
            ...user,
            bannedUntil: data.bannedUntil,
            banReason: data.reason
          };
          setUser(updatedUser);
          localStorage.setItem('comic_user', JSON.stringify(updatedUser));
          setStripeModalBook(null);
          playRetroSound('kaboom');
          alert(`🚨 FRAUD DETECTED BY AI WATCHDOG!\n\nReason: ${data.reason || data.error}\n\nYour account has been BANNED for 3 days.`);
          return;
        }
        setStripeError(data.error || "AI Watchdog rejected this transaction. Please ensure you entered valid transaction details.");
        setStripeProcessing(false);
        return;
      }

      // Success
      setUser(data.user);
      localStorage.setItem('comic_user', JSON.stringify(data.user));
      playRetroSound('coin');
      
      // Close modal and redirect to personal collection owned page
      setStripeModalBook(null);
      earnNamedBadge('badge_collector_gold', 'Super Collector Gold');
      setCurrentView('store');
      setStoreFilter('collection');
    } catch (err) {
      console.error("Watchdog checkout verify exception:", err);
      setStripeError("Error connecting to the AI Watchdog telemetry server. Please try again.");
      setStripeProcessing(false);
    }
  };

  // Launch Book Reader Isolation Room
  const launchReaderRoom = (book: Book) => {
    playRetroSound('woosh');
    setReadingBook(book);
    setCurrentSpreadIndex(0);
    setCurrentView('reader');
    if (user) {
      trackActivityInClient('read', book._id);
      trackActivityInClient('page_read', book._id, 1);
    }
  };

  const getPagesReadThisWeek = () => {
    if (!user || !user.pagesReadHistory) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0,0,0,0);
    
    return user.pagesReadHistory
      .filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= oneWeekAgo;
      })
      .reduce((sum: number, item: any) => sum + item.count, 0);
  };

  const getDailyReadingBreakdown = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const entry = user?.pagesReadHistory?.find((h: any) => h.date === dateStr);
      days.push({
        dayName: label,
        pagesCount: entry ? entry.count : 0
      });
    }
    return days;
  };

  const handleToggleBookmark = async (bookId: string) => {
    if (!user) {
      alert("Please log in to save books to your personal Read Later list!");
      return;
    }
    playRetroSound('sparkle');
    await trackActivityInClient('bookmark', bookId);
  };

  const isBookmarked = (bookId: string) => {
    return user && user.bookmarkedBookIds && user.bookmarkedBookIds.includes(bookId);
  };

  // Triggers 100% complete visual bursts & sound effects
  useEffect(() => {
    if (readingBook) {
      const maxSpreads = Math.ceil(readingBook.pages.length / 2);
      const isLastSpread = maxSpreads > 0 && currentSpreadIndex === maxSpreads - 1;
      if (isLastSpread) {
        if (!completedBookIds.includes(readingBook._id)) {
          setCompletedBookIds(prev => [...prev, readingBook._id]);
          setShowCompletionBurst(true);
          
          // Trigger confetti burst!
          const colors = ['#FFE600', '#FF007F', '#39FF14', '#00D4FF', '#FF9900', '#FF55BB'];
          const particles = Array.from({ length: 45 }).map((_, i) => ({
            id: Date.now() + i,
            color: colors[Math.floor(Math.random() * colors.length)],
            left: 10 + Math.random() * 80, // spread across 10%-90%
            top: 20 + Math.random() * 30, // vertical start offset
            delay: Math.random() * 0.4
          }));
          setActiveConfetti(particles);
          playRetroSound('sparkle');
        }
      } else {
        setShowCompletionBurst(false);
      }
    } else {
      setShowCompletionBurst(false);
    }
  }, [currentSpreadIndex, readingBook, completedBookIds]);

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
        ownedBooks: [
          { bookId: "book_gatoreye_001", unlockedVia: "giveaway" }
        ]
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

    if (genPageCount < 1) {
      setAdminGenError("Wait, Captain! The page count must be 1 or higher.");
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
          coverImageUrl: genCoverUrl,
          isPictureBook: genIsPictureBook
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

  const FUNNY_VOICES_PROFILES = [
    { name: "Silly Barnaby Raccoon 🦝", pitch: 1.8, rate: 0.95, label: "Gibberish & High-Squeaks (Masculine/Funny)" },
    { name: "Deep Dino Mighty Rex 🦖", pitch: 0.5, rate: 0.75, label: "Prehistoric Deep Cave Growls (Masculine/Deep)" },
    { name: "Wobbly Wizard Whispering 🧙", pitch: 1.1, rate: 0.8, label: "Slow-motion Magical Secrets (Masculine/Soft)" },
    { name: "Speedy Galactic Ninja 🥷", pitch: 1.0, rate: 1.45, label: "Super Fast Space Sprints (Feminine/Fast)" },
    { name: "Waffles the Sea Octopus 🐙", pitch: 0.75, rate: 1.05, label: "Bubbly Deep Sea Whispers (Feminine/Fluid)" },
    { name: "Ticklish Robotic Tutor 🤖", pitch: 1.4, rate: 1.15, label: "Segmented Electric Bleeps (Unisex/Robotic)" },
    { name: "Agent Sliding Snail 🐌", pitch: 0.9, rate: 0.6, label: "Super Slow Steady Trails (Masculine/Slow)" },
    { name: "Cheerful Cartoon Narrator 📣", pitch: 1.25, rate: 1.1, label: "High Energy Comic Showman (Feminine/Narrator)" },
    { name: "Crazy Candy Overlord 🍭", pitch: 1.9, rate: 1.35, label: "Hyper Bubblegum Overclock (Feminine/Screamy)" }
  ];

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
    "Dinosaur", "Pirate", "Ninja", "Space Adventure", "Detective", "Mystery", "Slapstick", "Superhero", "Fantasy", "Undersea",
    "Fairy-Tale", "Sports", "Wizardry", "Jungle", "Robot", "Time Travel", "Monster", "Schoolhouse", "Candy Castle", "Zoo",
    "Sleepover", "Toy Box", "Interactive Puzzle", "Backyard Insect", "Volcano", "Balloon", "Amusement Park", "Ghost Hunt", "Cooking Chaos", "Wildlife Rescue",
    "Deep Forest", "Flying Machines", "Deep Desert", "Winter Wonderland", "Cozy Cabin", "Art Studio", "Recycling Hero", "Music Band", "Skateboarding", "Secret Identity",
    "Trickster", "Treasure Hunt", "Snail Speed", "Farmyard Fun", "Magic School", "Friendly Alien", "Bubble Pop", "Knight & Castle", "Mermaid Lagoon", "Sleepy Sloths",
    "Sky Castle", "Pet Detective", "Dino Fossil", "Camping Trip", "Treehouse Club", "Laser Tag", "Origami Magic", "Giant Pumpkin", "Subway Surfer", "Mini Golf",
    "Soapbox Derby", "Science Fair", "Sandbox Castle", "Kite Flying", "Puddle Jumping", "Mud Monster", "Sneaker Run", "Hide & Seek", "Pillow Fortress", "Library Secret",
    "Lemonade Stand", "Dog Park", "Cat Nap", "Pizza Chef", "Ice Cream Shop", "Clock Tower", "Sledding Hill", "Windmill Garden", "Lighthouse Mystery", "Submarine Dive",
    "Hot Air Balloon", "Safari Hike", "Jungle River", "Toy Robot", "Magic Paintbrush", "Train Ride", "Firestation Hero", "Airport Hub", "Space Station", "Marshmallow Camp",
    "Cookie Bakery", "Cupcake Tower", "Candy Shop", "Snail Race", "Koala Climb", "Penguin Dance", "Beaver Dam", "Squirrel Nut", "Badger Burrow", "Otter Slide"
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

  const handleSetDefaultBook = async (bookId: string) => {
    try {
      playRetroSound('sparkle');
      const res = await fetch('/api/v1/admin/set-default-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ bookId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDefaultBookId(bookId);
          alert("🏆 Success! Designated this storybook as the default starter book for all new users.");
        } else {
          alert("Error: " + (data.error || "Failed to set default book"));
        }
      } else {
        alert("Server error designating starter book.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
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
    setEditFormCoverImageUrl(book.coverImageUrl || '');
    setEditFormIsPictureBook(book.isPictureBook !== false); // Default to true if not explicitly set
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

  const handleEditBookPageImageUrlChange = (index: number, newUrl: string) => {
    const updatedPages = [...editFormPages];
    updatedPages[index] = {
      ...updatedPages[index],
      imageUrl: newUrl
    };
    setEditFormPages(updatedPages);
  };

  const handleDeletePage = (index: number) => {
    playRetroSound('woosh');
    const updated = editFormPages
      .filter((_, idx) => idx !== index)
      .map((page, idx) => ({
        ...page,
        pageNumber: idx + 1
      }));
    setEditFormPages(updated);
  };

  const handleAddPage = () => {
    playRetroSound('sparkle');
    const newPageNum = editFormPages.length + 1;
    const newPage = {
      pageNumber: newPageNum,
      textContent: `This is the exciting new page ${newPageNum}! Write custom adventure story actions here!`,
      imageUrl: editFormIsPictureBook 
        ? `https://loremflickr.com/600/600/cartoon,kids?lock=${newPageNum + 300}`
        : ""
    };
    setEditFormPages([...editFormPages, newPage]);
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
          pages: editFormPages,
          coverImageUrl: editFormCoverImageUrl,
          isPictureBook: editFormIsPictureBook
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

  // Fast Auto-Fill for kids/admin to test generation easily (guaranteed 100% unique all the time)
  const autofillGenFields = async () => {
    playRetroSound('coin');
    
    // Pools for procedural fallback (produces millions of configurations)
    const RANDOM_HEROES = ["Sir Barnaby", "Special Agent Slush", "Special Agent Scoop", "Dexter the T-Rex", "Penny the Penguin", "Clara the Ninja Chicken", "Robby the Raccooneer", "Bubbles the Whale", "Barnaby the Space-Pug"];
    const RANDOM_FRIENDS = ["Zelda Squirrel", "Trixie the Engineer Triceratops", "Milo the Monkey Mechanic", "Waffles the Walrus", "Noodles the Octopus", "Professor Gigglebots"];
    const RANDOM_VILLAINS = ["an Evil Blow Dryer", "the Sour-Toothed Weasel", "Banana Thief Bandits", "the Grumpy Volcano King", "a rogue Vacuum Cleaner", "Professor Meltdown"];
    const RANDOM_TARGETS = ["all double-scoop ice cream cones", "the city's gold-plated donuts", "every crispy chocolate waffle bowl", "the galactic banana reserves", "all sweet laughing crystals"];
    const RANDOM_LOCATIONS = ["Antarctica", "the Prehistoric Rock Arena", "a sweet Bubblegum Planet", "the Floating Cogwheel Castle", "the Deep Undersea Trench", "a Cozy Treehouse Hub"];
    const RANDOM_MISSIONS = ["execute high-speed ninja flips", "engineer a steam-powered flying tail booster", "solve the clockwork wind-up puzzle", "launch a marshmallow-based counterdefense", "retrieve the hidden golden keys"];
    const RANDOM_MORALS = [
      "Warm hearts are cooler than freezing friends!",
      "Shorter arms mean you need longer drumsticks!",
      "Patience and winding gears can solve any riddle.",
      "Sweetness and quick team-wits can disarm any foe!",
      "Laughter and sharing warm cheese are the ultimate space fuel!",
      "A helping hand (or tail) is stronger than any dinosaur horn!",
      "Never judge a snail by the speed of his slide!",
      "True friendship is tougher than the highest volcano heat!"
    ];

    // Try live AI scenario generator first!
    try {
      const res = await fetch("/api/v1/admin/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || 'bypass'}`
        }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.scenario) {
          const { title, genre, ageGroup, moral, blurb } = d.scenario;
          if (!generatedTitlesList.current.has(title)) {
            generatedTitlesList.current.add(title);
            setGenTitle(title);
            setGenGenre(genre);
            setGenAgeGroup(ageGroup);
            setGenMoral(moral);
            setGenBlurb(blurb);
            setGenCoverUrl("");
            setGenPageCount(50);
            return;
          }
        }
      }
    } catch (e) {
      // Switch silent to fallback procedural
    }

    // Procedural Fallback Combinatorial loop to bypass duplicates perfectly
    let attempts = 0;
    while (attempts < 50) {
      const hero = RANDOM_HEROES[Math.floor(Math.random() * RANDOM_HEROES.length)];
      const friend = RANDOM_FRIENDS[Math.floor(Math.random() * RANDOM_FRIENDS.length)];
      const villain = RANDOM_VILLAINS[Math.floor(Math.random() * RANDOM_VILLAINS.length)];
      const target = RANDOM_TARGETS[Math.floor(Math.random() * RANDOM_TARGETS.length)];
      const loc = RANDOM_LOCATIONS[Math.floor(Math.random() * RANDOM_LOCATIONS.length)];
      const mission = RANDOM_MISSIONS[Math.floor(Math.random() * RANDOM_MISSIONS.length)];
      const moral = RANDOM_MORALS[Math.floor(Math.random() * RANDOM_MORALS.length)];
      const genre = COMIC_GENRES_100[Math.floor(Math.random() * COMIC_GENRES_100.length)];

      const title = `${hero} Vs ${villain} in ${loc}`;

      if (!generatedTitlesList.current.has(title)) {
        generatedTitlesList.current.add(title);
        const blurb = `An absolute crisis strikes ${loc} as ${villain} threatens to steal or melt ${target}! ${hero} and their best companion ${friend} must immediately team up to ${mission} before the entire adventure is lost!`;
        
        setGenTitle(title);
        setGenGenre(genre);
        setGenAgeGroup(Math.random() > 0.5 ? "Ages 5-7" : "Ages 8-12");
        setGenMoral(moral);
        setGenBlurb(blurb);
        setGenCoverUrl("");
        setGenPageCount(50);
        return;
      }
      attempts++;
    }

    // Ultima emergency backup in case of theoretical lock
    const emergencyTitle = `The Legend of Special Agent Slush #${Math.floor(Math.random() * 99999) + 1}`;
    setGenTitle(emergencyTitle);
    setGenGenre("Dinosaur");
    setGenAgeGroup("Ages 8-12");
    setGenMoral("Warm hearts are cooler than freezing friends!");
    setGenBlurb("An evil hair dryer is threaten to melt all double-scoop cones in Antarctica! Special Agents Slush and Scoop must master ninja-flipping before the waffle bowls collapse!");
    setGenCoverUrl("");
    setGenPageCount(50);
  };

  // Check if a book is unlocked (owned) by user
  const isBookOwned = (bookId: string): boolean => {
    if (!user) return false;
    return user.ownedBooks.some(b => b.bookId.toString() === bookId.toString());
  };

  // Dynamic keyword cover and page helper for client side matching
  const getDynamicKeywordImageUrl = (title: string, content: string, genre: string, index: number): string => {
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
  };

  return (
    <div className="min-h-screen bg-peach-pattern select-none text-black font-sans pb-12">
      {/* Premium particle confetti burst overlay */}
      {confettiBurstActive && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-confetti-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
                borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
                borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
                borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
                borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '30%' : '0px',
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                '--target-x': `${(Math.random() - 0.5) * 800}px`,
                '--target-y': `${-100 - Math.random() * 500}px`,
                '--target-rotate': `${Math.random() * 720 - 360}deg`
              } as any}
            />
          ))}
        </div>
      )}
      
      {/* 1. TOP HEADER NAVIGATION - HIDDEN IN READER PER SECTION 6 SPEC */}
      {currentView !== 'reader' && (
        <header className="bg-[#FFE600] border-b-[8px] border-black sticky top-0 z-50 select-none shadow-[0_5px_0_0_rgba(0,0,0,1)] animate-assemble-header">
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
            <div className="bg-[#FFE600] border-[8px] border-black rounded-[3rem] p-8 md:p-12 mb-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 rotate-[-0.5deg] animate-assemble-hero">
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
                  GET YOUR FIRST BOOK 50% OFF! 🏷️
                </button>
              </div>
              
              {/* Comic bubble stack on the right */}
              <div className="flex flex-col gap-4 select-none pr-4 shrink-0">
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#00D4FF] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] -rotate-6 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black animate-assemble-splat-1"
                >
                  SPLAT!
                </div>
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#FF007F] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] rotate-3 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black animate-assemble-splat-2"
                >
                  KABOOM!
                </div>
                <div 
                  onClick={() => { playRetroSound('splat'); }}
                  className="bg-[#FF8C00] border-[4px] border-black font-black text-2xl py-2.5 px-10 rounded-2xl shadow-[5px_5px_0px_0px_#000000] -rotate-3 transform hover:scale-110 active:scale-95 transition-transform cursor-pointer text-center text-black animate-assemble-splat-3"
                >
                  WHIZZ!
                </div>
              </div>
            </div>



            {/* Book Cards Grid Title Header */}
            <div id="books-list-grid" className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-assemble-title">
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
            <div className="flex border-4 border-black mb-8 p-1 bg-black rounded-2xl select-none animate-assemble-title" style={{ animationDelay: '0.4s' }}>
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

            {/* RECENTS & RECOMMENDED SECTIONS (WHEN LOGGED IN) */}
            {user && (
              <div className="space-y-8 mb-8">
                
                {/* 🌟 USER INTERACTIVE DASHBOARD PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                  
                  {/* Left panel: Weekly Reading Goal Tracker (7 cols) */}
                  <div className="lg:col-span-7 bg-white border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0_0_#000] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/50 rounded-bl-full -z-10" />
                    <div>
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                        <div>
                          <span className="bg-[#9933FF] text-white text-[10px] font-black px-2.5 py-1 border-2 border-black uppercase rotate-[-1deg] inline-block mb-1">
                            📅 WEEKLY GOAL TRACKER
                          </span>
                          <h3 className="text-2xl font-black uppercase text-black tracking-tight flex items-center gap-1.5">
                            ⚡ READING PROGRESS
                          </h3>
                        </div>
                        
                        {/* Weekly Target Selector */}
                        <div className="flex items-center gap-1.5 bg-neutral-100 border-2 border-black px-2 py-1 rounded-xl">
                          <span className="text-[9px] font-black uppercase text-neutral-500">Goal:</span>
                          <select 
                            value={weeklyTarget} 
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setWeeklyTarget(val);
                              localStorage.setItem('weekly_reading_target', String(val));
                            }}
                            className="bg-transparent text-xs font-black uppercase text-black outline-none cursor-pointer"
                          >
                            <option value={10}>10 Pages</option>
                            <option value={20}>20 Pages</option>
                            <option value={30}>30 Pages</option>
                            <option value={50}>50 Pages</option>
                            <option value={100}>100 Pages</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-gray-500 mb-6">
                        Read more pages in any of your comic adventure storybooks to achieve your weekly milestone badge!
                      </p>

                      {/* Level Display */}
                      <div className="mb-6 bg-gradient-to-r from-amber-400 to-orange-400 border-4 border-black p-4 rounded-[1.5rem] shadow-[4px_4px_0_0_#000] text-black">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">🏅</span>
                            <div>
                              <span className="text-[10px] font-black uppercase text-amber-950 block leading-none">CURRENT RECRUIT LEVEL</span>
                              <span className="text-2xl font-black uppercase tracking-tight">LEVEL {user.level || 1} / 1000</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-black uppercase animate-pulse">
                              {user.level && user.level >= 1000 ? "👑 NOVEL MASTER" : "⚡ ACTIVE"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-amber-950/80 italic">
                          Read owned books to the very last page and click the "DONE" button to level up! Each level gets progressively harder to upgrade.
                        </div>
                      </div>

                      {/* Main visual tracker progress bar */}
                      {(() => {
                        const pagesRead = getPagesReadThisWeek();
                        const percent = Math.min(100, Math.round((pagesRead / weeklyTarget) * 100));
                        const isGoalAchieved = pagesRead >= weeklyTarget;
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-3xl font-black text-black">{pagesRead}</span>
                                <span className="text-sm font-black text-gray-400"> / {weeklyTarget} pages read</span>
                              </div>
                              <span className={`text-xs font-black uppercase px-2.5 py-1 border-2 border-black rounded-lg ${
                                isGoalAchieved ? 'bg-[#39FF14] animate-pulse text-black' : 'bg-[#FFE600] text-black'
                              }`}>
                                {isGoalAchieved ? "🏆 GOAL REACHED! 🌟" : `${percent}% Completed`}
                              </span>
                            </div>

                            {/* Goal Progress Bar */}
                            <div className="w-full bg-neutral-100 border-4 border-black p-0.5 rounded-full overflow-hidden flex items-center relative h-7">
                              <div 
                                className={`h-full rounded-full border-r-4 border-black transition-all duration-500 ${
                                  isGoalAchieved ? 'bg-[#39FF14]' : 'bg-[#00D4FF]'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black uppercase tracking-widest pointer-events-none">
                                {isGoalAchieved ? "✨ STREAK UNLOCKED! KEEP GOING! ✨" : "🏃‍♂️ STEP BY STEP TO THE TOP!"}
                              </span>
                            </div>

                            {/* Contributions Tracker Style Grid for last 7 Days */}
                            <div className="pt-4">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">📊 DAILY SPREAD HISTOGRAM (LAST 7 DAYS)</span>
                              <div className="grid grid-cols-7 gap-2">
                                {getDailyReadingBreakdown().map((d, index) => {
                                  const dayPercent = Math.min(100, Math.round((d.pagesCount / (weeklyTarget / 7)) * 100));
                                  // Determine bar color intensity
                                  let barColor = 'bg-neutral-100';
                                  if (d.pagesCount > 0) {
                                    if (dayPercent < 30) barColor = 'bg-cyan-100 border-cyan-300 text-cyan-800';
                                    else if (dayPercent < 70) barColor = 'bg-cyan-300 border-cyan-500 text-cyan-900';
                                    else barColor = 'bg-[#00D4FF] border-black text-black';
                                  }
                                  return (
                                    <div key={index} className="flex flex-col items-center gap-1.5">
                                      <div className={`w-full h-12 border-2 border-black rounded-lg flex flex-col items-center justify-end relative overflow-hidden ${barColor}`}>
                                        {d.pagesCount > 0 && (
                                          <div className="absolute inset-x-0 bottom-0 bg-[#39FF14] border-t-2 border-black" style={{ height: `${dayPercent}%` }} />
                                        )}
                                        <span className="font-mono text-[9px] font-black text-black z-10">{d.pagesCount}p</span>
                                      </div>
                                      <span className="text-[9px] font-black uppercase text-neutral-500">{d.dayName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right panel: Read Later Bookmark Feature (5 cols) */}
                  <div className="lg:col-span-5 bg-white border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0_0_#000] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-[#FF007F] text-white text-[10px] font-black px-2.5 py-1 border-2 border-black uppercase rotate-[1deg] inline-block">
                          ❤️ READ LATER LIST
                        </span>
                        <span className="text-xs font-black text-neutral-400">
                          ({user.bookmarkedBookIds ? user.bookmarkedBookIds.length : 0} SAVED)
                        </span>
                      </div>
                      <h3 className="text-2xl font-black uppercase text-black tracking-tight mb-1 flex items-center gap-2">
                        🔖 MY BOOKMARKS
                      </h3>
                      <p className="text-xs font-bold text-gray-500 mb-4">
                        Your personal queue of stories saved for peaceful offline moments!
                      </p>

                      {/* Bookmark queue items */}
                      {(() => {
                        const savedBookIds = user.bookmarkedBookIds || [];
                        const savedBooks = books.filter(b => savedBookIds.includes(b._id.toString()));
                        
                        if (savedBooks.length === 0) {
                          return (
                            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500 flex flex-col items-center justify-center gap-2 min-h-[160px] bg-neutral-50">
                              <span className="text-2xl">📚</span>
                              <p className="text-xs font-black uppercase tracking-wider">Bookcase is currently empty!</p>
                              <p className="text-[10px] font-bold text-neutral-400 max-w-[200px]">
                                Tap the <span className="text-pink-500 font-extrabold">🤍 READ LATER</span> button on any comic card below to save it!
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {savedBooks.map(b => (
                              <div key={b._id} className="bg-neutral-50 border-2 border-black rounded-xl p-2.5 flex items-center justify-between gap-3 hover:bg-neutral-100 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-12 bg-[#E1EDF2] border border-black rounded overflow-hidden flex-shrink-0">
                                    {b.coverImageUrl ? (
                                      <img src={b.coverImageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-300" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-black text-black leading-tight truncate">{b.title}</h4>
                                    <span className="text-[9px] uppercase font-black px-1 border border-black bg-yellow-200 mt-1 inline-block">
                                      {b.genre}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isBookOwned(b._id) ? (
                                    <button
                                      onClick={() => launchReaderRoom(b)}
                                      className="bg-black text-white hover:bg-neutral-800 font-black text-[10px] px-2.5 py-1.5 uppercase rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer"
                                    >
                                      READ 📖
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handlePurchaseComic(b)}
                                      className="bg-[#39FF14] text-black hover:bg-emerald-400 font-black text-[10px] px-2.5 py-1.5 uppercase rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer"
                                    >
                                      BUY 💳
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleToggleBookmark(b._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-black text-xs p-1.5 border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer"
                                    title="Remove bookmark"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* Inline Badges Museum section - shown when storeFilter === 'collection' */}
                {storeFilter === 'collection' && (
                  <div className="bg-[#FFFEE5] border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0_0_#000] select-none">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="bg-[#39FF14] text-black text-[10px] font-black px-2.5 py-1 border-2 border-black uppercase rotate-[-1deg] inline-block mb-1">
                          🏆 PERMANENT RECORD
                        </span>
                        <h3 className="text-2xl font-black uppercase text-black tracking-tight flex items-center gap-2">
                          🏛️ MY BADGE MUSEUM ({user.badges ? user.badges.length : 0} Earned)
                        </h3>
                      </div>
                    </div>
                    
                    {(!user.badges || user.badges.length === 0) ? (
                      <div className="bg-white border-4 border-dashed border-gray-300 p-8 rounded-2xl text-center font-bold text-gray-500">
                        No museum badges unlocked yet! Start reading to earn rare accomplishments!
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {user.badges.map((badge, idx) => (
                          <div 
                            key={badge.badgeId || idx} 
                            className="bg-white border-4 border-black p-4 rounded-2xl text-center shadow-[4px_4px_0_0_#000] hover:scale-105 transition-transform flex flex-col justify-between items-center relative overflow-hidden group"
                          >
                            <div className="text-3xl mb-1.5 animate-bounce" style={{ animationDuration: '3s' }}>
                              🏅
                            </div>
                            <span className="text-xs font-black uppercase leading-tight text-black line-clamp-2">
                              {badge.title}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-400 mt-2 block uppercase">
                              Earned {new Date(badge.unlockedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* RECENT READS */}
                {recentBooks.length > 0 && (
                  <div className="bg-white border-4 border-black p-4 md:p-6 rounded-2xl shadow-[6px_6px_0_0_#000] select-none">
                    <h3 className="text-xl font-black uppercase text-black mb-1 flex items-center gap-2">
                      📖 RECENTLY READ BY YOU
                    </h3>
                    <p className="text-xs font-bold text-gray-500 mb-4">
                      Keep track of your latest adventures. Tap to resume reading or delete any recently read book from this list!
                    </p>
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                      {recentBooks.map((b) => (
                        <div 
                          key={b._id} 
                          className="w-48 bg-cyan-50 border-2 border-black rounded-xl p-3 flex-shrink-0 flex flex-col justify-between relative snap-start hover:scale-[1.02] transition-transform shadow-[3px_3px_0_0_#000]"
                        >
                          <button
                            type="button"
                            onClick={() => trackActivityInClient('delete_recent', b._id)}
                            className="absolute top-1.5 right-1.5 bg-red-500 text-white font-black rounded-full border border-black w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs shadow-[1px_1px_0_0_#000] z-20"
                            title="Remove from recents"
                          >
                            ✕
                          </button>
                          
                          <div className="cursor-pointer" onClick={() => launchReaderRoom(b)}>
                            <div className="w-full h-28 bg-[#E1EDF2] border border-black rounded-lg overflow-hidden mb-2">
                              {b.coverImageUrl ? (
                                <img src={b.coverImageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                                  <span className="text-[9px] font-black uppercase">WORDS ONLY</span>
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-black leading-tight line-clamp-2">{b.title}</h4>
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 border border-black bg-yellow-300 mt-1 inline-block">
                              {b.genre}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI RECOMMENDED */}
                {user && (
                  <div className="bg-white border-4 border-black p-4 md:p-6 rounded-2xl shadow-[6px_6px_0_0_#000] select-none">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <h3 className="text-xl font-black uppercase text-black flex items-center gap-2">
                        ✨ RECOMMENDED FOR YOU
                      </h3>
                      {isRecommendationsLoading && (
                        <span className="bg-cyan-100 text-cyan-800 border-2 border-cyan-800 text-[10px] font-black px-2 py-0.5 animate-pulse uppercase">
                          Analyzing preferences...
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-500 mb-4">
                      Custom recommendations based on your clicks, reading history, and owned books!
                    </p>
                    
                    {recommendedBooks.length === 0 ? (
                      <div className="bg-neutral-50 border-2 border-dashed border-gray-300 p-6 text-center rounded-xl font-bold text-gray-500 text-sm">
                        No custom recommendations synthesized yet! Try browsing some books, clicking buy, or starting a 20s stare! 🧐
                      </div>
                    ) : (
                      <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                        {recommendedBooks.map(({ book, reason }, index) => (
                          <div 
                            key={book._id} 
                            className="w-64 bg-yellow-50 border-2 border-black rounded-2xl p-4 flex-shrink-0 flex flex-col justify-between relative snap-start hover:scale-[1.01] transition-transform shadow-[4px_4px_0_0_#000]"
                          >
                            <div>
                              <div className="flex gap-3 mb-2 items-start">
                                <div className="w-16 h-20 bg-[#E1EDF2] border border-black rounded-lg overflow-hidden flex-shrink-0">
                                  {book.coverImageUrl ? (
                                    <img src={book.coverImageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-200" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-black text-black leading-tight truncate">{book.title}</h4>
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 border border-black bg-magenta-200 mt-1 inline-block">
                                    {book.genre}
                                  </span>
                                  <button
                                    onClick={() => handlePurchaseComic(book)}
                                    className="block mt-2 bg-[#39FF14] text-black hover:bg-emerald-400 font-black text-[9px] px-2 py-1 uppercase rounded border border-black"
                                  >
                                    BUY TO READ 💳
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white border-2 border-black rounded-xl p-2 mt-2 relative">
                                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t-2 border-l-2 border-black rotate-45" />
                                <p className="text-[10px] font-bold text-gray-700 leading-relaxed italic">
                                  ✨ "{reason}"
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}



            {/* 100 GENRES SEARCH & FILTER SYSTEM */}
            <div className="bg-white border-4 border-black p-4 md:p-6 rounded-2xl shadow-[6px_6px_0_0_#000] mb-8 select-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left side: Book Search bar inside filters */}
                <div>
                  <h4 className="text-md font-black uppercase text-black flex items-center gap-1.5 mb-1">
                    🔍 SEARCH BOOKS DIRECTLY
                  </h4>
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    Search for storybooks by title, description blurb, or story genre
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterSearchQuery}
                      onChange={(e) => setFilterSearchQuery(e.target.value)}
                      placeholder="Type book title, keyword or genre to search..."
                      className="w-full bg-white text-black font-extrabold text-xs placeholder-gray-400 border-4 border-black p-2.5 rounded-xl shadow-[3px_3px_0_0_#000] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all outline-none"
                    />
                    {filterSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterSearchQuery('');
                          playRetroSound('splat');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-red-500 hover:text-red-700"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>

                {/* Right side: Search within 100 Genres */}
                <div>
                  <h4 className="text-md font-black uppercase text-black flex items-center gap-1.5 mb-1">
                    🏷️ FILTER BY STORY GENRE ({COMIC_GENRES_100.length} Available)
                  </h4>
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    Select as many genres simultaneously as you want! Only matching books will show.
                  </p>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={genreSearchQuery}
                      onChange={(e) => {
                        setGenreSearchQuery(e.target.value);
                        setIsGenreDropdownOpen(true);
                      }}
                      onFocus={() => setIsGenreDropdownOpen(true)}
                      placeholder="🔍 Type to search and add from 100 genres..."
                      className="w-full bg-white text-black font-extrabold text-xs placeholder-gray-400 border-4 border-black p-2.5 rounded-xl shadow-[3px_3px_0_0_#000] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all outline-none"
                    />
                    {genreSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setGenreSearchQuery('');
                          playRetroSound('splat');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-red-500 hover:text-red-700"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Display currently active genres */}
              <div className="bg-neutral-50 p-3 rounded-xl border-2 border-black mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-black uppercase">
                    Selected Genres ({selectedGenres.length}):
                  </span>
                  {selectedGenres.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllSelectedGenres}
                      className="text-[10px] font-black text-red-600 hover:text-red-800 uppercase"
                    >
                      🗑️ Clear All Selected Genres
                    </button>
                  )}
                </div>
                {selectedGenres.length === 0 ? (
                  <p className="text-[11px] font-bold text-neutral-500 italic">
                    Showing books from all 100 genres. Select specific genres below to narrow down your search!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGenres.map(g => (
                      <span 
                        key={g}
                        className="bg-[#FFE600] text-black text-[10px] font-black px-2 py-0.5 border-2 border-black uppercase flex items-center gap-1.5 shadow-[1px_1px_0_0_#000]"
                      >
                        {g}
                        <button
                          type="button"
                          onClick={() => toggleGenreFilter(g)}
                          className="font-black text-red-600 hover:text-red-800 text-xs ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre Selection grid showing matches of search or all 100 */}
              <div className="border-t-2 border-dashed border-gray-300 pt-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                  💡 Select/toggle genres from the list:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-neutral-200 rounded-lg bg-neutral-50 scrollbar-thin">
                  {(() => {
                    const filtered = COMIC_GENRES_100.filter(g => 
                      g.toLowerCase().includes(genreSearchQuery.toLowerCase())
                    );
                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-full p-3 text-xs font-bold text-gray-400 text-center italic">
                          No matching genres out of 100!
                        </div>
                      );
                    }
                    return filtered.map((g) => {
                      const isSelected = selectedGenres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenreFilter(g)}
                          className={`text-left text-[10px] font-extrabold p-1.5 rounded border transition-all truncate flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#FF55BB] text-black border-black border-2 font-black shadow-[1px_1px_0_0_#000]' 
                              : 'bg-white hover:bg-yellow-50 text-neutral-700 border-neutral-300 border'
                          }`}
                        >
                          <span>📖 {g}</span>
                          {isSelected && <span className="text-[9px]">✅</span>}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
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
                  if (!isBookOwned(b._id)) return false;
                }

                // If filter text search query is set, search by book title, blurb, or genre
                if (filterSearchQuery.trim()) {
                  const query = filterSearchQuery.toLowerCase();
                  const titleMatch = b.title.toLowerCase().includes(query);
                  const blurbMatch = b.blurbText.toLowerCase().includes(query);
                  const genreMatch = b.genre.toLowerCase().includes(query);
                  if (!titleMatch && !blurbMatch && !genreMatch) {
                    return false;
                  }
                }

                // Multi-genre array filter
                if (selectedGenres.length > 0) {
                  const genreLower = b.genre.toLowerCase();
                  const matchesAny = selectedGenres.some(genreTag => {
                    if (genreTag === 'Dinosaur') {
                      return genreLower.includes('dino') || genreLower.includes('dinosaur') || genreLower.includes('t-rex') || genreLower.includes('jurassic');
                    }
                    if (genreTag === 'Ninja') {
                      return genreLower.includes('ninja') || genreLower.includes('karate') || genreLower.includes('action') || genreLower.includes('spy');
                    }
                    if (genreTag === 'Space Adventure') {
                      return genreLower.includes('space') || genreLower.includes('alien') || genreLower.includes('cosmic') || genreLower.includes('astronaut') || genreLower.includes('cyber');
                    }
                    if (genreTag === 'Detective') {
                      return genreLower.includes('detective') || genreLower.includes('mystery') || genreLower.includes('sleuth');
                    }
                    if (genreTag === 'Monster') {
                      return genreLower.includes('monster') || genreLower.includes('zombie') || genreLower.includes('goblin') || genreLower.includes('ghoul');
                    }
                    return genreLower.includes(genreTag.toLowerCase());
                  });
                  if (!matchesAny) return false;
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
                  {filteredBooks.map((book, idx) => {
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
                      className="bg-white border-[8px] border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col justify-between relative group hover:scale-[1.01] transition-transform duration-200 animate-assemble-card"
                      style={{ 
                        animationDelay: `${0.6 + idx * 0.15}s`,
                        ['--card-rot' as any]: `${(idx % 2 === 0 ? 1 : -1) * (1.5 - (idx % 3) * 0.5)}deg`
                      }}
                      onMouseEnter={() => {
                        if (user && !user.staredBookIds?.includes(book._id)) {
                          hoverTimersRef.current[book._id] = setTimeout(() => {
                            console.log("User stared at book 20s+:", book.title);
                            trackActivityInClient('stared', book._id);
                          }, 20000);
                        }
                      }}
                      onMouseLeave={() => {
                        if (hoverTimersRef.current[book._id]) {
                          clearTimeout(hoverTimersRef.current[book._id]);
                          delete hoverTimersRef.current[book._id];
                        }
                      }}
                    >
                      {/* Bookmark button */}
                      {user && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(book._id);
                          }}
                          className={`absolute top-4 left-4 z-15 px-3 py-1.5 rounded-full border-4 border-black font-black text-[10px] uppercase transition-transform hover:scale-110 active:translate-y-0.5 shadow-[3px_3px_0_0_#000] cursor-pointer ${
                            isBookmarked(book._id) 
                              ? 'bg-[#FF007F] text-white' 
                              : 'bg-white text-gray-500 hover:text-[#FF007F]'
                          }`}
                          title={isBookmarked(book._id) ? "Remove from Read Later" : "Add to Read Later"}
                        >
                          {isBookmarked(book._id) ? "❤️ BOOKMARKED" : "🤍 READ LATER"}
                        </button>
                      )}

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
                        {book.coverImageUrl ? (
                          <img 
                            src={book.coverImageUrl} 
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center select-none border-b-2 border-dashed border-gray-400">
                            <FileImage className="w-16 h-16 text-gray-400 mb-3 animate-pulse" />
                            <span className="font-black text-xs text-gray-500 uppercase tracking-widest block">WORDS ONLY COMIC BOOK</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Awaiting Admin Art 🎨</span>
                          </div>
                        )}

                        {/* Interactive Comic Preview Hover Overlay */}
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 select-none">
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:16px_16px]"></div>
                          
                          {book.pages && book.pages.length > 0 && book.pages[0].imageUrl ? (
                            <img 
                              src={book.pages[0].imageUrl} 
                              alt="Comic Preview Frame" 
                              className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-[0_0_15px_rgba(255,230,0,0.5)] rotate-[-6deg] mb-2"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center mb-2">
                              <span className="text-xl font-black">⚡</span>
                            </div>
                          )}

                          <div className="relative">
                            <span className="bg-[#FF007F] text-white border-2 border-black font-black text-[9px] uppercase px-2 py-0.5 rounded-md rotate-[4deg] inline-block shadow-[2px_2px_0_0_#000] mb-1">
                              🔥 20+ PAGES!
                            </span>
                            <h4 className="text-[#FFE600] font-display font-black text-base tracking-tight uppercase leading-none">
                              TAP TO EXPLORE!
                            </h4>
                            <p className="text-white text-[9px] font-bold mt-1 line-clamp-2 max-w-[180px] leading-tight">
                              {book.pages && book.pages[0] ? book.pages[0].textContent : book.blurbText}
                            </p>
                          </div>
                        </div>
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
                    min="1"
                    value={genPageCount}
                    onChange={(e) => setGenPageCount(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black p-3 font-bold"
                  />
                </div>

                {/* Book style: Picture Book vs Standard Book */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Book Illustration Style</label>
                  <select
                    value={genIsPictureBook ? "picture" : "standard"}
                    onChange={(e) => {
                      playRetroSound('coin');
                      setGenIsPictureBook(e.target.value === "picture");
                    }}
                    className="w-full bg-white border-4 border-black p-3 font-bold cursor-pointer"
                  >
                    <option value="standard">📖 Standard Book (Only Cover Art / No Page Images)</option>
                    <option value="picture">🎨 Picture Book (Illustrated Pages / Image on Every Page)</option>
                  </select>
                </div>

                {/* Num words */}
                <div>
                  <label className="block text-md font-black uppercase mb-1">Target Word Count</label>
                  <input
                    type="number"
                    min="50"
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

              {/* Admin Panel Tab Bar Choices */}
              <div className="flex border-b-4 border-black mb-6 select-none">
                <button
                  type="button"
                  onClick={() => { playRetroSound('woosh'); setAdminSubTab('all'); }}
                  className={`flex-1 md:flex-none px-6 py-3 font-black uppercase text-sm border-t-4 border-r-4 border-l-4 border-black transition-all ${
                    adminSubTab === 'all' 
                      ? "bg-black text-[#FFE600] translate-y-[4px]" 
                      : "bg-gray-100 hover:bg-gray-200 text-black mr-1"
                  }`}
                >
                  🗄️ COMPREHENSIVE CATALOG ({books.length})
                </button>
                <button
                  type="button"
                  onClick={() => { playRetroSound('woosh'); setAdminSubTab('drafts'); }}
                  className={`flex-1 md:flex-none px-6 py-3 font-black uppercase text-sm border-t-4 border-r-4 border-black transition-all flex items-center justify-center gap-2 ${
                    adminSubTab === 'drafts' 
                      ? "bg-black text-[#39FF14] translate-y-[4px]" 
                      : "bg-gray-100 hover:bg-gray-200 text-black mr-1"
                  }`}
                >
                  📝 DRAFT REVIEW BOARD ({books.filter(b => !b.isPublished).length})
                  {books.filter(b => !b.isPublished).length > 0 && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Book Cover Image URL</label>
                        <input
                          type="text"
                          value={editFormCoverImageUrl}
                          onChange={(e) => setEditFormCoverImageUrl(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm"
                          placeholder="Enter cover image URL (e.g. https://...)..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Book Illustration Style</label>
                        <select
                          value={editFormIsPictureBook ? "picture" : "standard"}
                          onChange={(e) => {
                            playRetroSound('coin');
                            setEditFormIsPictureBook(e.target.value === "picture");
                          }}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm cursor-pointer"
                        >
                          <option value="standard">📖 Standard Book (Only Cover Art / No Page Images)</option>
                          <option value="picture">🎨 Picture Book (Illustrated Pages / Image on Every Page)</option>
                        </select>
                      </div>
                    </div>

                    {/* INTERACTIVE PAGE-BY-PAGE WORD EDITOR */}
                    <div className="border-t-2 border-black pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-lg font-black uppercase">
                          📖 SCAN & MODIFY LIVE PAGES TEXT {editFormIsPictureBook ? "(PICTURE BOOK MODE)" : "(STANDARD TEXT BOOK MODE)"}:
                        </h5>
                        <button
                          type="button"
                          onClick={handleAddPage}
                          className="bg-[#39FF14] text-black hover:bg-green-400 border-2 border-black font-black text-xs px-3 py-1 uppercase flex items-center gap-1 shadow-[2px_2px_0_0_#000]"
                        >
                          ➕ Add New Page
                        </button>
                      </div>
                      
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {editFormPages.map((page, pIdx) => (
                          <div key={pIdx} className="bg-white border-2 border-black p-3 flex gap-4 items-start relative group">
                            {editFormIsPictureBook && (
                              <div className="w-16 h-16 border-2 border-black flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
                                {page.imageUrl ? (
                                  <img src={page.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <FileImage className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-black text-magenta-800 uppercase">
                                  PAGE {page.pageNumber} ILLUSTRATION SCENE WORDS:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePage(pIdx)}
                                  className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 border-2 border-black uppercase hover:bg-red-600 shadow-[1px_1px_0_0_#000]"
                                >
                                  🗑️ Delete Page
                                </button>
                              </div>
                              <textarea
                                value={page.textContent}
                                onChange={(e) => handleEditBookPageChange(pIdx, e.target.value)}
                                rows={2}
                                className="w-full border border-gray-400 p-2 font-bold text-xs"
                                placeholder="Edit actual narration/speech bubble text..."
                              ></textarea>
                              {editFormIsPictureBook ? (
                                <div className="mt-2">
                                  <label className="block text-[10px] font-black text-blue-800 uppercase mb-0.5">
                                    Page {page.pageNumber} Illustration Artwork (Custom Upload):
                                  </label>
                                  <div 
                                    className="border-2 border-dashed border-black rounded-xl p-3 bg-neutral-50 hover:bg-yellow-100/20 transition-colors cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[90px]"
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const file = e.dataTransfer.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            handleEditBookPageImageUrlChange(pIdx, event.target.result as string);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              handleEditBookPageImageUrlChange(pIdx, event.target.result as string);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    {page.imageUrl ? (
                                      <div className="flex items-center gap-3 w-full">
                                        <img src={page.imageUrl} alt="Uploaded Artwork" className="w-12 h-12 object-cover border-2 border-black rounded-lg shrink-0" />
                                        <div className="text-left min-w-0 flex-1">
                                          <p className="text-[10px] font-black text-emerald-600 uppercase">✓ IMAGE UPLOADED SUCCESSFULLY</p>
                                          <p className="text-[9px] font-bold text-gray-500 truncate">
                                            {page.imageUrl.startsWith('data:') ? 'Custom Base64 Image Asset' : page.imageUrl}
                                          </p>
                                          <p className="text-[9px] font-black text-blue-500 underline mt-0.5">Click or drag new file to replace</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="py-2">
                                        <p className="text-xs font-black text-black">📁 DROP IMAGE HERE OR CLICK TO UPLOAD</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Supports PNG, JPG, JPEG, WEBP</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1 text-[10px] font-bold text-neutral-500 italic">
                                  ℹ️ Standard page: Cover image will be the only illustration. No page artwork required.
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddPage}
                          className="bg-[#39FF14] text-black hover:bg-green-400 border-2 border-black font-black text-xs px-4 py-2 uppercase flex items-center gap-1 shadow-[3px_3px_0_0_#000]"
                        >
                          ➕ ADD NEW PAGE AT THE END
                        </button>
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

              {adminSubTab === 'all' ? (
                /* LIVE TABLE LISTING OF ALL DYNAMIC BOOKS */
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
                                <div className="w-12 h-12 border-2 border-black bg-cyan-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {b.coverImageUrl ? (
                                    <img src={b.coverImageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <FileImage className="w-6 h-6 text-gray-500" />
                                  )}
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
                                  onClick={() => handleSetDefaultBook(b._id)}
                                  className={`text-black font-black text-xs px-2 py-1 border-2 border-black uppercase ${defaultBookId === b._id ? 'bg-[#39FF14]' : 'bg-purple-300 hover:bg-purple-400'}`}
                                >
                                  {defaultBookId === b._id ? '⭐ STARTER BOOK' : '👉 MAKE STARTER 🚀'}
                                </button>
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
              ) : (
                /* DRAFT REVIEW GRID BOARD */
                <div className="animate-fade-in">
                  {books.filter(b => !b.isPublished).length === 0 ? (
                    <div className="bg-yellow-50 border-4 border-dashed border-black rounded-3xl p-12 text-center select-none">
                      <span className="text-5xl block mb-2">🎉</span>
                      <h4 className="text-2xl font-black uppercase text-black">No draft books awaiting review!</h4>
                      <p className="text-sm font-semibold text-gray-500 mt-1">
                        All magnificent comic novels have been happily published or you haven't triggered any draft generators. Run the generator above to synthesis newer books!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {books.filter(b => !b.isPublished).map((b) => (
                        <div 
                          key={b._id}
                          className="bg-[#FFFEE5] border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between"
                        >
                          <div>
                            {/* Graphic illustration thumbnail */}
                            <div className="w-full h-48 border-4 border-black rounded-xl overflow-hidden relative mb-4 bg-cyan-100 flex items-center justify-center">
                              {b.coverImageUrl ? (
                                <img 
                                  src={b.coverImageUrl} 
                                  alt={b.title}
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                                  <FileImage className="w-10 h-10 text-gray-400 mb-2" />
                                  <span className="font-black text-[10px] text-gray-500 uppercase">Awaiting Cover Art 🎨</span>
                                </div>
                              )}
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-mono px-2 py-0.5 border-2 border-black font-black uppercase shadow-sm">
                                DRAFT
                              </span>
                            </div>

                            <span className="bg-purple-200 border border-black text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block mb-1.5 select-none">
                              {b.genre}
                            </span>
                            
                            <h4 className="text-lg font-black text-black leading-tight mb-2 uppercase line-clamp-1">
                              {b.title}
                            </h4>

                            <div className="space-y-2 text-xs text-gray-700">
                              <p className="font-bold line-clamp-2">
                                <span className="text-[10px] font-black text-[#FF007F] block uppercase leading-none mb-0.5">Moral Lesson:</span>
                                "{b.moralLesson || "No specific moral lesson defined yet"}"
                              </p>
                              <p className="font-semibold line-clamp-3">
                                <span className="text-[10px] font-black text-blue-800 block uppercase leading-none mb-0.5">Blurb Summary:</span>
                                {b.blurbText || "No blurb synopsis recorded."}
                              </p>
                              <div className="flex gap-4 font-mono text-[10px] bg-white border border-gray-300 rounded p-1.5">
                                <span>PAGES: <strong className="font-black text-black">{b.pages.length}</strong></span>
                                <span>BASE USD: <strong className="font-black text-black">${b.basePrice}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="mt-5 pt-3 border-t-2 border-black flex items-center gap-2">
                            <button
                              onClick={() => { playRetroSound('woosh'); launchReaderRoom(b); }}
                              className="bg-blue-300 hover:bg-blue-400 border-2 border-black text-black font-black text-[11px] px-3 py-2 rounded uppercase"
                              title="Inspect content word-by-word"
                            >
                              INSPECT 👁️
                            </button>
                            <button
                              onClick={() => handleTogglePublish(b._id)}
                              className="flex-1 bg-[#39FF14] hover:bg-emerald-300 border-2 border-black text-black font-black text-[11px] py-2 rounded uppercase shadow-sm"
                            >
                              PUBLISH ⚡
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b._id)}
                              className="bg-red-500 hover:bg-red-400 border-2 border-black text-white font-black text-[11px] py-2 px-3 rounded uppercase font-mono"
                            >
                              DELETE ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

      {/* 4. INTEL PAGE-FLIP REACTOR LAYOUT - SECTION 6 ISOLATED ROOM (STRICT COPY LOCK PROTECTION) */}
      {currentView === 'reader' && readingBook && (
        <div 
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 bg-[#FFDAB9] z-50 overflow-y-auto font-sans flex flex-col justify-between p-4 md:p-8 bg-peach-pattern select-none pointer-events-auto"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
        >
          
          {/* isolated top actions bar */}
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between border-b-4 border-black pb-4 mb-4 gap-4 select-none">
            <div className="flex items-center gap-3">
              <span className="bg-[#FFE600] border-2 border-black px-3 py-1 font-black text-xs md:text-sm uppercase rotate-[-2deg]">
                📖 NOW READING PHYSICAL ROOM
              </span>
              <h2 className="text-xl md:text-2xl font-black text-black leading-none drop-shadow-sm line-clamp-1 uppercase tracking-tight">
                {readingBook.title}
              </h2>
            </div>

            {/* AI Text-To-Speech Synthesis Voice Dashboard (9 Distinct Whimsical Voices) */}
            <div className="flex flex-wrap items-center bg-white border-4 border-black rounded-2xl p-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] gap-2">
              <span className="text-[10px] font-black text-[#FF007F] px-1 uppercase leading-none block">
                🎙️ CARTOON CAST ({FUNNY_VOICES_PROFILES.length} ACTORS):
              </span>
              <select
                value={selectedVoiceIndex}
                onChange={(e) => {
                  playRetroSound('coin');
                  setSelectedVoiceIndex(Number(e.target.value));
                  window.speechSynthesis.cancel();
                  setIsPlayingSpeech(false);
                }}
                className="bg-yellow-200 border-2 border-black rounded text-[11px] font-black uppercase py-1 px-2 cursor-pointer outline-none text-black"
                title="Choose your cartoon voice actor avatar"
              >
                {FUNNY_VOICES_PROFILES.map((prof, k) => (
                  <option key={k} value={k}>
                    {prof.name} - {prof.label}
                  </option>
                ))}
              </select>

              {/* Retro FX Volume Slider */}
              <div id="retro-sfx-volume" className="flex items-center gap-1.5 border-l-2 border-dashed border-black pl-2">
                <span className="text-[9px] font-black uppercase text-neutral-600 whitespace-nowrap">
                  🕹️ SFX VOL:
                </span>
                <input
                  id="retro-volume-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={retroVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setRetroVolume(val);
                    (window as any).retroSoundVolume = val;
                    localStorage.setItem('comic_retro_volume', String(val));
                  }}
                  className="w-16 h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-pink-500 h-1"
                  title="Adjust the volume of the retro action sound effects"
                />
                <span className="text-[9px] font-mono font-bold w-6 text-right">
                  {Math.round(retroVolume * 100)}%
                </span>
              </div>

              <button
                onClick={() => {
                  playRetroSound('sparkle');
                  // Capture active page content (Cover or standard pages)
                  let fullReadout = "";
                  if (currentSpreadIndex === 0) {
                    fullReadout = `${readingBook.title}. A children's storybook in the genre of ${readingBook.genre}. Synopsis: ${readingBook.blurbText || ""}. Moral lesson: ${readingBook.moralLesson || ""}`;
                  } else {
                    const lPage = readingBook.pages[(currentSpreadIndex - 1) * 2];
                    const rPage = readingBook.pages[((currentSpreadIndex - 1) * 2) + 1];
                    if (lPage) fullReadout += `Page ${lPage.pageNumber}. ${lPage.textContent} `;
                    if (rPage) fullReadout += `Page ${rPage.pageNumber}. ${rPage.textContent}`;
                  }
                  
                  if (!fullReadout.trim()) {
                    alert("Aisle empty! No words to speak.");
                    return;
                  }
                  
                  // Trigger speech synthesis utilizing custom voice pitch speeds
                  window.speechSynthesis.cancel();
                  if (isPlayingSpeech) {
                    setIsPlayingSpeech(false);
                    return;
                  }

                  const utterance = new SpeechSynthesisUtterance(fullReadout);
                  const selectedProfile = FUNNY_VOICES_PROFILES[selectedVoiceIndex];
                  utterance.pitch = selectedProfile.pitch;
                  utterance.rate = selectedProfile.rate;
                  
                  // Check standard voices browser profiles to inject male/female properties if available
                  const systemVoicesAvailable = window.speechSynthesis.getVoices();
                  if (systemVoicesAvailable && systemVoicesAvailable.length > 0) {
                    if (selectedVoiceIndex === 0 || selectedVoiceIndex === 1 || selectedVoiceIndex === 2 || selectedVoiceIndex === 6) {
                      // Prefer male tags
                      const maleV = systemVoicesAvailable.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
                      if (maleV) utterance.voice = maleV;
                    } else {
                      // Prefer kids-friendly female tags
                      const femaleV = systemVoicesAvailable.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('google us English'));
                      if (femaleV) utterance.voice = femaleV;
                    }
                  }

                  utterance.onend = () => setIsPlayingSpeech(false);
                  utterance.onerror = () => setIsPlayingSpeech(false);

                  setIsPlayingSpeech(true);
                  window.speechSynthesis.speak(utterance);
                }}
                className={`border-2 border-black rounded px-3 py-1 text-[11px] font-black uppercase text-black cursor-pointer shadow-[2px_2px_0_0_#000] active:translate-y-0.5 select-none ${isPlayingSpeech ? 'bg-red-400 hover:bg-red-300' : 'bg-[#39FF14] hover:bg-emerald-300'}`}
              >
                {isPlayingSpeech ? "🔊 STOP READING" : "🔊 SPEAK PAGE"}
              </button>

              {/* ADMIN PRINT PRIVILEGES CONTROL: Strict gate "others cannot print" */}
              {isAdmin && (
                <button
                  onClick={() => {
                    playRetroSound('sparkle');
                    window.print();
                  }}
                  className="bg-cyan-300 hover:bg-cyan-200 border-2 border-black rounded px-3 py-1 text-[11px] font-black uppercase text-black cursor-pointer shadow-[2px_2px_0_0_#000]"
                  title="Download entire book as PDF or Print"
                >
                  📥 Download / Print Book (PDF)
                </button>
              )}
            </div>

            <button
              onClick={() => { 
                playRetroSound('woosh'); 
                window.speechSynthesis.cancel(); 
                setIsPlayingSpeech(false); 
                setCurrentView('store'); 
                setReadingBook(null); 
              }}
              className="bg-black text-white hover:bg-neutral-800 font-black border-4 border-black px-4 py-2 uppercase tracking-wide text-xs md:text-sm shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              ✕ EXIT BACK LIBRARY
            </button>
          </div>

          {/* BOLD HIGH-CONTRAST COMIC PROGRESS BAR */}
          <div className="max-w-7xl mx-auto w-full mb-6 relative">
            
            {/* Completion Pop-up Badge */}
            {showCompletionBurst && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-300 text-black border-4 border-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider animate-badge-pop shadow-[4px_4px_0_0_#000] z-30 flex items-center gap-1.5 select-none">
                🎉 100% COMPLETE CHAMPION! 🏆
              </div>
            )}

            {/* Confetti Particle Burst rendering overlay */}
            {activeConfetti.map(p => (
              <span 
                key={p.id}
                className="absolute w-2.5 h-5 rounded-sm pointer-events-none animate-confetti z-30"
                style={{
                  backgroundColor: p.color,
                  left: `${p.left}%`,
                  bottom: `${p.top}%`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}

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
                  if (currentSpreadIndex > 0 && !isFlipping) {
                    playRetroSound('woosh');
                    setFlipDirection('left');
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentSpreadIndex(currentSpreadIndex - 1);
                      if (user && readingBook) {
                        trackActivityInClient('page_read', readingBook._id, 2);
                      }
                      setIsFlipping(false);
                    }, 500);
                  }
                }}
                disabled={currentSpreadIndex === 0 || isFlipping}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#FFE600] text-black border-4 border-black text-xl font-black flex items-center justify-center comic-shadow-sm comic-shadow-hover hover:scale-105 active:translate-y-1 disabled:opacity-30 cursor-pointer select-none"
              >
                ◀
              </button>

              {/* Spine wrap splitting landscape screen into left/right pages with tactile animation classes */}
              <div className={`physical-book-spine w-full flex flex-col md:flex-row overflow-hidden ${isFlipping ? (flipDirection === 'left' ? 'page-sheet-turn-left' : 'page-sheet-turn-right') : ''}`}>
                
                {/* Left side book page render */}
                {(() => {
                  if (currentSpreadIndex === 0) {
                    // LEFT PAGE: BOOK COVER ART
                    return (
                      <div className="page-sheet left-sheet flex-1 bg-[#FFFEE5] relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                        <div className="h-full flex flex-col justify-between items-center text-center">
                          <span className="bg-[#FF007F] text-white border-2 border-black text-xs font-black px-2 py-0.5 uppercase mb-2">
                            BOOK COVER
                          </span>
                          
                          <div className="w-full max-w-[320px] h-56 md:h-80 border-4 border-black overflow-hidden relative bg-cyan-50 flex items-center justify-center shadow-[4px_4px_0_0_#000]">
                            {readingBook.coverImageUrl ? (
                              <img 
                                src={readingBook.coverImageUrl} 
                                alt={`${readingBook.title} Cover`} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
                                <FileImage className="w-16 h-16 text-gray-400 mb-2" />
                                <span className="font-black text-xs text-gray-500 uppercase tracking-wider">Awaiting cover art 🎨</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                            <h3 className="text-xl md:text-2xl font-black text-black uppercase leading-tight">
                              {readingBook.title}
                            </h3>
                            <span className="bg-yellow-300 text-black border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase mt-1 inline-block">
                              {readingBook.genre}
                            </span>
                          </div>

                          <div className="text-xs font-black text-black pt-2 select-none">
                            📖 FRONT COVER
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const leftIndex = (currentSpreadIndex - 1) * 2;
                  const leftPage = readingBook.pages[leftIndex];

                  return (
                    <div className="page-sheet left-sheet flex-1 bg-white relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                      {leftPage ? (
                        <div className="h-full flex flex-col justify-between">
                          
                          {/* Vibrant Creative Artwork panel matching the text - Only render if imageUrl is present */}
                          {leftPage.imageUrl ? (
                            <div className="w-full h-44 md:h-64 border-4 border-black overflow-hidden relative bg-cyan-50 flex items-center justify-center mb-2">
                              <img 
                                src={leftPage.imageUrl} 
                                alt={`Illustration for page ${leftPage.pageNumber}`} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-yellow-300 border-2 border-black text-xs font-black px-2 uppercase">
                                PAGE {leftPage.pageNumber}
                              </div>
                            </div>
                          ) : null}

                          {/* Dialog Bubble text content - stretches to fill the page if no image exists */}
                          <div className={`comic-bubble p-4 border-4 border-black rounded-2xl flex-1 overflow-y-auto ${
                            leftPage.imageUrl 
                              ? 'bg-yellow-50 min-h-[100px]' 
                              : 'bg-yellow-50/70 flex items-center justify-center p-6 text-center'
                          }`}>
                            <p className="text-gray-800 font-extrabold leading-relaxed" style={{ fontSize: '18pt' }}>
                              {leftPage.textContent}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 border-t-2 border-dashed border-gray-300 pt-2 text-xs font-black text-black select-none">
                            <span>📖 PAGE {leftPage.pageNumber} / {readingBook.pages.length}</span>
                            {leftPage.imageUrl && (
                              <span className="bg-red-500 text-white border-2 border-black px-2 py-0.5 text-[10px] uppercase">
                                {leftPage.pageNumber % 2 === 0 ? "SPLAT! 💥" : "KABOOM! ⚡"}
                              </span>
                            )}
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
                  if (currentSpreadIndex === 0) {
                    // RIGHT PAGE: BOOK INTRODUCTION / BLURB
                    return (
                      <div className="page-sheet right-sheet flex-1 bg-[#FFFEE5] relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                        <div className="h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000]">
                              <span className="text-[10px] font-black text-blue-800 uppercase block mb-1">
                                📜 Synopsis & Blurb
                              </span>
                              <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                {readingBook.blurbText || "Get ready for a spectacular reading journey filled with unexpected twists and laughter!"}
                              </p>
                            </div>

                            <div className="bg-yellow-100 border-4 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000]">
                              <span className="text-[10px] font-black text-green-800 uppercase block mb-1">
                                💡 Moral Lesson
                              </span>
                              <p className="text-sm font-extrabold text-black leading-relaxed italic">
                                "{readingBook.moralLesson || "Adventure together, succeed together!"}"
                              </p>
                            </div>
                          </div>

                          <div className="bg-[#39FF14] text-black border-4 border-black p-4 text-center rounded-xl shadow-[4px_4px_0_0_#000] animate-bounce my-4">
                            <span className="font-black text-sm uppercase block">
                              Ready to begin?
                            </span>
                            <span className="font-bold text-xs">
                              Click the right yellow arrow (▶) to flip the cover!
                            </span>
                          </div>

                          <div className="text-right text-xs font-black text-black pt-2 select-none">
                            📖 BOOK WELCOME
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const rightIndex = ((currentSpreadIndex - 1) * 2) + 1;
                  const rightPage = readingBook.pages[rightIndex];

                  return (
                    <div className="page-sheet right-sheet flex-1 bg-white relative p-4 md:p-6 min-h-[420px] md:min-h-[500px]">
                      {rightPage ? (
                        <div className="h-full flex flex-col justify-between">
                          
                          {/* Vibrant Creative Artwork panel matching the text - Only render if imageUrl is present */}
                          {rightPage.imageUrl ? (
                            <div className="w-full h-44 md:h-64 border-4 border-black overflow-hidden relative bg-magenta-50 flex items-center justify-center mb-2">
                              <img 
                                src={rightPage.imageUrl} 
                                alt={`Illustration for page ${rightPage.pageNumber}`} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-yellow-300 border-2 border-black text-xs font-black px-2 uppercase">
                                PAGE {rightPage.pageNumber}
                              </div>
                            </div>
                          ) : null}

                          {/* Dialog Bubble text content - stretches to fill the page if no image exists */}
                          <div className={`comic-bubble p-4 border-4 border-black rounded-2xl flex-1 overflow-y-auto ${
                            rightPage.imageUrl 
                              ? 'bg-blue-50/70 min-h-[100px]' 
                              : 'bg-[#F5F8FF] flex items-center justify-center p-6 text-center'
                          }`}>
                            <p className="text-gray-800 font-extrabold leading-relaxed" style={{ fontSize: '18pt' }}>
                              {rightPage.textContent}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 border-t-2 border-dashed border-gray-300 pt-2 text-xs font-black text-black select-none">
                            <span>📖 PAGE {rightPage.pageNumber} / {readingBook.pages.length}</span>
                            {rightPage.imageUrl && (
                              <span className="bg-[#39FF14] text-black border-2 border-black px-2 py-0.5 text-[10px] uppercase">
                                {rightPage.pageNumber % 3 === 0 ? "SQUEAL! 🐷" : "WHOOSH! 🌪️"}
                              </span>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-between">
                          <div className="bg-neutral-950 text-green-400 border-4 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000] font-mono text-xs space-y-3 flex-1 overflow-y-auto">
                            <div className="border-b border-green-800 pb-2 flex items-center justify-between text-[#39FF14] font-black">
                              <span>🤖 STORYBOOK Q&A TERMINAL</span>
                              <span className="animate-pulse">● READY</span>
                            </div>
                            
                            <div>
                              <span className="text-yellow-300 font-extrabold uppercase">📍 QUESTION: Where is this story set?</span>
                              <p className="text-white font-bold pl-3 mt-1 bg-black/40 p-1.5 border border-green-900 rounded">
                                "This high-energy adventure takes place inside the imaginative setting of <span className="text-[#39FF14] underline">{readingBook.genre}</span>, styled with stunning details and landmarks!"
                              </p>
                            </div>

                            <div>
                              <span className="text-yellow-300 font-extrabold uppercase">💡 QUESTION: What is the main moral lesson?</span>
                              <p className="text-white font-bold pl-3 mt-1 bg-black/40 p-1.5 border border-green-900 rounded">
                                "The main message of the book is: <span className="text-pink-300 italic font-extrabold">'{readingBook.moralLesson}'</span>. It guides the characters through their toughest obstacles."
                              </p>
                            </div>

                            <div>
                              <span className="text-yellow-300 font-extrabold uppercase">🎭 QUESTION: What genre and style is this book?</span>
                              <p className="text-white font-bold pl-3 mt-1 bg-black/40 p-1.5 border border-green-900 rounded">
                                "It is written in the <span className="text-cyan-300 uppercase">{readingBook.genre}</span> genre, featuring highly narrative children's book style and detailed action sequences."
                              </p>
                            </div>

                            <div>
                              <span className="text-yellow-300 font-extrabold uppercase">👶 QUESTION: What is the age recommendation?</span>
                              <p className="text-white font-bold pl-3 mt-1 bg-black/40 p-1.5 border border-green-900 rounded text-[11px]">
                                "Highly recommended for ages 4 to 12+, perfect for parents reading aloud or young adventurers reading independently!"
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 bg-[#FF007F] text-white border-4 border-black p-3 text-center rounded-xl shadow-[4px_4px_0_0_#000]">
                            <p className="text-sm font-black uppercase">🏆 MISSION ACCOMPLISHED!</p>
                            <p className="text-[10px] font-bold mb-2">Claim your exclusive Museum Badge for this book!</p>
                            {user ? (
                              <div className="flex flex-col gap-2 items-center justify-center mt-2">
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
                                    } catch (err) {
                                      console.error(err);
                                    }

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
                                  className="bg-[#FFE600] text-black hover:bg-yellow-400 font-black border-2 border-black px-4 py-1.5 uppercase text-xs rounded-lg cursor-pointer inline-block w-full max-w-[240px]"
                                >
                                  🏅 CLAIM READER BADGE
                                </button>

                                {/* DONE Level Up button */}
                                {(() => {
                                  const isAlreadyCompleted = user.completedBookIdsForLevel?.includes(readingBook._id);
                                  return (
                                    <button
                                      disabled={isAlreadyCompleted}
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/v1/users/${user._id}/complete-book`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ bookId: readingBook._id })
                                          });
                                          if (res.ok) {
                                            const d = await res.json();
                                            if (d.success) {
                                              setUser(d.user);
                                              localStorage.setItem('comic_user', JSON.stringify(d.user));
                                              triggerConfetti();
                                              alert(`🎓 LEVEL UP!\n\n${d.message}\n\nYou are now LEVEL ${d.user.level || 1}! Keep readin' to unlock greater master ranks!`);
                                            } else {
                                              alert(`⚠️ INFO: ${d.message || "Book already completed for levels!"}`);
                                            }
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className={`w-full max-w-[240px] font-black border-2 border-black px-4 py-2 uppercase text-xs rounded-lg cursor-pointer inline-block transition-all ${
                                        isAlreadyCompleted 
                                          ? 'bg-neutral-400 text-neutral-800 cursor-not-allowed opacity-75' 
                                          : 'bg-[#39FF14] text-black hover:bg-[#20e000] animate-pulse shadow-[2px_2px_0_0_#000]'
                                      }`}
                                    >
                                      {isAlreadyCompleted ? "✓ BOOK COMPLETED 🎓" : "🎓 DONE - UPGRADE LEVEL!"}
                                    </button>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold block text-yellow-200">Create an account to save badges and level up!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* Right Spread Arrow Button */}
              <button 
                onClick={() => {
                  const maxSpreads = 1 + Math.ceil(readingBook.pages.length / 2);
                  if (currentSpreadIndex < maxSpreads - 1 && !isFlipping) {
                    playRetroSound('woosh');
                    setFlipDirection('right');
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentSpreadIndex(currentSpreadIndex + 1);
                      if (user && readingBook) {
                        trackActivityInClient('page_read', readingBook._id, 2);
                      }
                      setIsFlipping(false);
                    }, 500);
                  }
                }}
                disabled={currentSpreadIndex === (1 + Math.ceil(readingBook.pages.length / 2)) - 1 || isFlipping}
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

      {/* SECURE WHOP CHECKOUT MODAL COMPONENT */}
      {stripeModalBook && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in">
          <div className="bg-white border-8 border-black rounded-3xl w-full max-w-md p-6 relative shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-black">
            
            {/* Header */}
            <div className="mb-4 text-center">
              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-black inline-block select-none animate-bounce">
                🛡️ AI WHOP PAYMENT WATCHDOG
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-black mt-2">
                Secure Whop Checkout
              </h3>
              <p className="text-xs font-semibold text-gray-500 max-w-xs mx-auto mt-1">
                You are purchasing direct reader lifetime keys for <span className="font-extrabold text-black italic">"{stripeModalBook.title}"</span>.
              </p>
            </div>

            {/* AI Watchdog Live Telemetry Loader */}
            <div className="bg-blue-50 border-4 border-black rounded-2xl p-4 text-center mb-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest animate-pulse">
                  REAL-TIME AI WATCHDOG ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-bold text-gray-700 leading-tight">
                Listening for secure payment verification signal from Whop servers... Once payment is finished, this window will automatically close and unlock your book!
              </p>
            </div>

            {/* Whop payment link highlight */}
            <div className="bg-yellow-50 border-4 border-black rounded-2xl p-4 text-center mb-4">
              <span className="text-[10px] font-black text-amber-800 uppercase block mb-1">🔗 SECURE WHOP PAYMENT LINK</span>
              <p className="text-xs font-bold text-gray-800 leading-tight mb-3">
                Click below to complete the subscription or purchase on Whop's secure external billing portal:
              </p>
              <a 
                href={getDynamicWhopLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playRetroSound('coin')}
                className="inline-block bg-[#00E5FF] hover:bg-[#00B4D8] text-black font-black border-4 border-black px-4 py-3 rounded-xl text-xs uppercase shadow-[4px_4px_0_0_#000] w-full text-center hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                🚀 PAY WITH WHOP IN NEW WINDOW →
              </a>
            </div>

            {/* Warning from AI Watchdog */}
            <div className="bg-red-50 border-2 border-red-500 p-2.5 rounded-xl text-[10px] font-black text-red-700 mb-4 flex gap-2 items-center">
              <span className="text-lg">🐕</span>
              <div>
                <span className="uppercase block font-black">AI Watchdog Status:</span>
                We verify payments through server-side Whop integration. If you do not pay, the book will not unlock. Please complete payment on the checkout page to gain instant access!
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => { 
                  playRetroSound('splat'); 
                  setStripeModalBook(null); 
                  setCurrentView('store');
                  setStoreFilter('all');
                }}
                className="w-full bg-neutral-200 hover:bg-neutral-300 text-black font-black border-4 border-black rounded-2xl py-3 text-xs uppercase shadow-[3px_3px_0_0_#000] active:translate-y-0.5 transition-all"
              >
                BACK TO LIBRARY
              </button>
            </div>

            <div className="mt-4 text-[9px] font-semibold text-gray-400 text-center flex items-center justify-center gap-1 select-none">
              🔒 Telemetry Guarded • Verified by Google AI Studio Whop Watchdog
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Hidden Print Layout for 100% Crisp vector PDF books */}
      {readingBook && readingBook.pages && (
        <div id="book-print-layout" className="hidden print:block">
          {readingBook.pages.map((p, idx) => (
            <div key={idx} className="print-page-break p-10 bg-white text-black min-h-screen flex flex-col justify-between" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
              <div>
                <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-6">
                  <span className="font-black uppercase text-xl text-black tracking-tight">{readingBook.title}</span>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Page {p.pageNumber} of {readingBook.pages.length}</span>
                </div>
                
                <div className="flex flex-row gap-8 items-stretch">
                  {p.imageUrl ? (
                    <>
                      <div className="w-1/2 h-[450px] border-4 border-black rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-1/2 p-6 border-4 border-black rounded-2xl bg-yellow-50/50 flex items-center text-left">
                        <p className="text-black font-extrabold leading-relaxed" style={{ fontSize: '18pt' }}>
                          {p.textContent}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full p-8 border-4 border-black rounded-2xl bg-yellow-50/50 text-left">
                      <p className="text-black font-extrabold leading-relaxed" style={{ fontSize: '18pt' }}>
                        {p.textContent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t-2 border-gray-200 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                📚 Generated by Morganville Graphic Novels Academy • Comic Genre: {readingBook.genre}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
