import fs from 'fs';
import path from 'path';

// JSON database file location
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface UserBadge {
  badgeId: string;
  title: string;
  unlockedAt: Date | string;
}

export interface OwnedBookItem {
  bookId: string;
  unlockedVia: 'purchase' | 'giveaway';
}

export interface UserSchemaType {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  virtualCoins: number;
  badges: UserBadge[];
  ownedBooks: OwnedBookItem[];
  bannedUntil?: string;
  banReason?: string;
  staredBookIds?: string[];
  clickedBuyBookIds?: string[];
  recentReadBookIds?: string[];
  status?: string;
  lastClickedBookId?: string;
  bookmarkedBookIds?: string[];
  pagesReadHistory?: { date: string; count: number }[];
  level?: number;
  completedBookIdsForLevel?: string[];
  readingHistory?: { bookId: string; lastPage: number; lastAccessed: string }[];
  totalReadingTime?: number; // total seconds spent reading
  bookRatings?: { bookId: string; rating: number }[];
}

export interface BookPageType {
  pageNumber: number;
  textContent: string;
  imageUrl?: string;
}

export interface BookSchemaType {
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
  pages: BookPageType[];
  isPublished: boolean;
  isPictureBook?: boolean;
}

interface DBStructure {
  users: UserSchemaType[];
  books: BookSchemaType[];
  defaultBookId?: string;
}

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Default cartoon covers generated / compiled
const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600", // Book cover placeholder
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
];

const INITIAL_BOOKS: BookSchemaType[] = [];

export const COMIC_GENRES: string[] = [
  "Space Comedy", "Wacky Fantasy", "Action Comedy", "Detective Mystery", "Funny Sci-Fi",
  "Ninja Chickens", "Fart-Whistle Comedy", "Dino Dashers", "Super-Spy Pigs", "Zombie Cupcakes",
  "Toilet Paper Terror", "Banana Heists", "Silly Sorcery", "Giggling Goblins", "Cyber-Hamsters",
  "Alien Underwear", "Mutant Potatoes", "Pancake Pirates", "Robot Sleepover", "Gravity-Defying Sloths",
  "Lollipop Knights", "Laser-Tag Leopards", "Bubbling Baboons", "Skateboard Squirrels", "T-Rex Drummers",
  "Flying Fish-Sticks", "Ghostbusters Ghouls", "Peanut-Butter Pandas", "Screaming Snowmen", "Jellybean Jungles",
  "Marshmallow Monsters", "Wobbly Wizards", "Booming Balloons", "Clown Critters", "Pickle Princes",
  "Sneezing Snails", "Ticklish Tigers", "Wacky Werewolves", "Soda Volcanoes", "Cheesy Astronauts",
  "Sloppy Superheroes", "Glitter Gargoyles", "Disco Dinosaurs", "Barking Banjoes", "Singing Seagulls",
  "Plucky Penguins", "Mustache Monkeys", "Bouncing Bunnies", "Karate Koalas", "Pizza Pilgrims",
  "Cosmic Cows", "Flying Fleas", "Saucy Cyborgs", "Giggle Gangsters", "Detective Ducks",
  "Swamp Sleuths", "Munching Mammoths", "Whistling Whales", "Chuckle Chameleons", "Pudding Pixies",
  "Taco Turtles", "Waffle Walruses", "Doodle Dolphins", "Noodle Octopuses", "Wackier Wombats",
  "Pretzels & Pegasus", "Gumball Giants", "Hoverboard Hippos", "Popcorn Ponies", "Bacon Bandits",
  "Cactus Cowboys", "Quacking Queens", "Burping Badgers", "Fluffy Firefighters", "Joking Jellyfish",
  "Silly Sailors", "Glitchy Gadgets", "Rapping Rabbits", "Merry Moose", "Loopy Llamas",
  "Fuzzy Aliens", "Snorting Swine", "Wiggle Worms", "Honking Herons", "Dancing Deer",
  "Chewing Chimps", "Prankster Puppies", "Giggle Gorillas", "Snicker Sheeps", "Roaring Roosters",
  "Tickle Tortoises", "Sassy Sharks", "Wobble Wolves", "Snorlax Sloths", "Nutty Newts",
  "Krazy Kangaroos", "Zappy Zebras", "Funny Ferrets", "Baffled Badgers", "Peculiar Pelicans"
];

export class DBStore {
  private static init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Only write initial database on first-run if the file does not already exist
    if (!fs.existsSync(DB_FILE)) {
      const emptyState: DBStructure = {
        users: [],
        books: INITIAL_BOOKS,
        defaultBookId: ""
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(emptyState, null, 2), 'utf-8');
    } else {
      // One-time check: if existing db has legacy books, wipe them to satisfy "delete all books"
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(content);
        const hasLegacy = data.books && data.books.some((b: any) => 
          b._id.startsWith("book_gatoreye") || 
          b._id.startsWith("book_allies") || 
          b._id.startsWith("book_acorn") || 
          b._id.startsWith("book_pizza")
        );
        if (hasLegacy) {
          data.books = [];
          data.defaultBookId = "";
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
          console.log("🧹 DB STORE: Cleared legacy books from persistent db.json storage.");
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  private static read(): DBStructure {
    this.init();
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Ensure arrays exist
      if (!data.users) data.users = [];
      if (!data.books) data.books = [];
      if (!data.defaultBookId) data.defaultBookId = "";
      return data;
    } catch (e) {
      // Recovery fallback
      return { users: [], books: INITIAL_BOOKS, defaultBookId: "" };
    }
  }

  private static write(data: DBStructure) {
    this.init();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public static async getDefaultBookId(): Promise<string> {
    const data = this.read();
    return data.defaultBookId || "";
  }

  public static async setDefaultBookId(id: string): Promise<void> {
    const data = this.read();
    data.defaultBookId = id;
    this.write(data);
  }

  // --- BOOK MODEL METHODS ---
  public static async findBooks(query: Partial<BookSchemaType> = {}): Promise<BookSchemaType[]> {
    const data = this.read();
    return data.books.filter(book => {
      for (const key in query) {
        if ((book as any)[key] !== (query as any)[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public static async findBookById(id: string): Promise<BookSchemaType | null> {
    const data = this.read();
    return data.books.find(b => b._id === id) || null;
  }

  public static async findBookBySlug(slug: string): Promise<BookSchemaType | null> {
    const data = this.read();
    return data.books.find(b => b.secretSlug === slug) || null;
  }

  public static async findBookByGiveawayId(giveawayId: string): Promise<BookSchemaType | null> {
    const data = this.read();
    return data.books.find(b => b.giveawayId === giveawayId) || null;
  }

  public static async createBook(bookFields: Omit<BookSchemaType, '_id'>): Promise<BookSchemaType> {
    const data = this.read();
    const newBook: BookSchemaType = {
      ...bookFields,
      _id: "book_" + generateId()
    };
    data.books.push(newBook);
    this.write(data);
    return newBook;
  }

  public static async updateBook(id: string, updates: Partial<BookSchemaType>): Promise<BookSchemaType | null> {
    const data = this.read();
    const idx = data.books.findIndex(b => b._id === id);
    if (idx === -1) return null;
    data.books[idx] = { ...data.books[idx], ...updates };
    this.write(data);
    return data.books[idx];
  }

  public static async deleteBook(id: string): Promise<boolean> {
    const data = this.read();
    const initialLength = data.books.length;
    data.books = data.books.filter(b => b._id !== id);
    if (data.books.length === initialLength) return false;
    this.write(data);
    return true;
  }

  // --- USER MODEL METHODS ---
  public static async findUsers(query: Partial<UserSchemaType> = {}): Promise<UserSchemaType[]> {
    const data = this.read();
    return data.users.filter(user => {
      for (const key in query) {
        if ((user as any)[key] !== (query as any)[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public static async findUserById(id: string): Promise<UserSchemaType | null> {
    const data = this.read();
    return data.users.find(u => u._id === id) || null;
  }

  public static async findUserByEmail(email: string): Promise<UserSchemaType | null> {
    const data = this.read();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public static async createUser(userFields: Omit<UserSchemaType, '_id'>): Promise<UserSchemaType> {
    const data = this.read();
    const newUser: UserSchemaType = {
      ...userFields,
      _id: "user_" + generateId()
    };
    data.users.push(newUser);
    this.write(data);
    return newUser;
  }

  public static async updateUser(id: string, updates: Partial<UserSchemaType>): Promise<UserSchemaType | null> {
    const data = this.read();
    const idx = data.users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    this.write(data);
    return data.users[idx];
  }
}
