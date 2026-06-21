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
}

interface DBStructure {
  users: UserSchemaType[];
  books: BookSchemaType[];
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

const INITIAL_BOOKS: BookSchemaType[] = [
  {
    _id: "book_gatoreye_001",
    title: "The Incredible Gator-Eye",
    genre: "Detective Mystery",
    targetAgeGroup: "Ages 8-12",
    moralLesson: "Pay attention to the small details and the truth shows up.",
    blurbText: "When the city's gold-plated donuts go missing, only one swamp-dwelling super-sleuth can crack the case. Grab your magnifying glass — the chase is ON!",
    coverImageUrl: "/src/assets/images/incredible_gator_eye_cover_1782071096148.jpg",
    pageCount: 6,
    wordCount: 220,
    basePrice: 4.00,
    secretSlug: "gatoreye-7f3a9c",
    giveawayId: "give-gator-001",
    isPublished: true,
    pages: [
      {
        pageNumber: 1,
        textContent: "On Morganville's bright hills, of laughter there was plenty,\nAt Axelsauce's party, for guests of eight to twenty!\nBut right before the candles, a gasp rose through the room—\nThe gold-plated donuts vanished, leaving birthday gloom!\n(How can you eat baked gold? Well, nobody asks how;\nIt's cartoon pizza logic that we're eating right now!)",
        imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        textContent: "Young Axelsauce, brave Jake, and smart kid Little Rock,\nFormed up a rescue crew to beat the ticking clock!\n'Let's find the Gator-Sleuth!' they cried, in spirits high,\nAnd marched into the swamp to seek out Gator-Eye!",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        textContent: "The swamp was wet and green, but Gator-Eye was gone!\n(A missing super-sleuth! Yet still the quest went on!)\nThey found a magnifying lens, some mud, and green marsh slime,\nAnd saw a secret map of Mayor's Pep Rally time!\n'We'll look for minor crumbs!' said Jake, adjusting gear,\n'No mystery stands a chance when teammates are so near!'",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        textContent: "At bustling Pep Rally, paper balloons flew high,\nBut Axelsauce felt sad, a tear was in his eye.\n'Big feelings need some words,' Jake said with kindness sweet,\n'It's okay to feel upset when plans face a defeat.'\nThen Little Rock cried out, 'Look! Tiny sugar tracks!\nThey lead to the old street behind the town's key stacks!'",
        imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 5,
        textContent: "The tracks went all the way to Morganville's dusty gate,\nWhere stands a spooky house where haunted shadows wait!\nWhy hide fresh sticky pastries in dusty, ghostly floors?\nIt's cartoon logic, folks! They pushed the creaking doors!",
        imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 6,
        textContent: "They found the donut bandit—a raccoon named Sir Prance,\nWho only wanted shiny sweets to start a birthday dance!\nThey shared the golden treats, with teamwork clear and true,\nAnd learned that looking close is what wise heroes do!\n'The Big Lesson is learned!' the happy group did shout,\n'Pay attention to small details, and the truth will out!'",
        imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    _id: "book_allies_002",
    title: "The Amazing Animal Allies!",
    genre: "Action Comedy",
    targetAgeGroup: "Ages 8-12",
    moralLesson: "Teamwork makes the machinery work!",
    blurbText: "A wolf, a snake, a shark and a snorkeling piranha team up to stop the dreaded Banana Burglary. Things get slippery — and very, very silly.",
    coverImageUrl: "/src/assets/images/amazing_animal_allies_cover_1782071110180.jpg",
    pageCount: 6,
    wordCount: 190,
    basePrice: 5.00,
    secretSlug: "allies-2b8e1d",
    giveawayId: "give-allies-002",
    isPublished: true,
    pages: [
      {
        pageNumber: 1,
        textContent: "Meet the Allies: Fang the Wolf, Sly the Spectacled Snake, Chomp the Pirate Shark, and Bubbles the Snorkeling piranha! Today, they were faced with a giant crisis.",
        imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        textContent: "Dr. Gorilla had stolen every single bunch of yellow bananas in the tropical canopy! 'With these bananas, I shall build a giant rocket to slip the entire Earth!' he cackled.",
        imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        textContent: "'That is bananas!' hissed Sly, looking at the radar. Fang adjusted his cape, 'Team, to the Allied Mobile!' They leaped into action, crossing the jungle at lightning speed.",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        textContent: "At Dr. Gorilla's volcano base, they found millions of fruit crates being loaded. Chomp crashed through the metal fence with a giant splash! 'Crunch is my middle name!'",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 5,
        textContent: "Dr. Gorilla threw a slippery peel. Sly slithered around it and tied Gorilla's feet! Bubbles shot a water-jet from his snorkel, blasting the main rocket control console.",
        imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 6,
        textContent: "The rocket fired inside the cage, covering Dr. Gorilla in banana smoothie! The jungle was saved, and the Allies shared a giant fruit salad to celebrate.",
        imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    _id: "book_acorn_003",
    title: "The Great Acorn Adventure",
    genre: "Wacky Fantasy",
    targetAgeGroup: "Ages 6-10",
    moralLesson: "Creative shortcuts and kindness are magical!",
    blurbText: "Climb the tallest, wobblest, most gadget-stuffed treehouse in the world. There's a flying cat, a top-hat snail, and ZERO chill. WHIZZ!",
    coverImageUrl: "/src/assets/images/great_acorn_adventure_cover_1782071124481.jpg",
    pageCount: 6,
    wordCount: 180,
    basePrice: 4.00,
    secretSlug: "acorn-f79a2c",
    giveawayId: "give-acorn-003",
    isPublished: true,
    pages: [
      {
        pageNumber: 1,
        textContent: "Deep in the Whispering Woods stands the Wobble Treehouse—the tallest, messiest, most gadget-loaded structure ever built. Leo and Mia were about to climb it.",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        textContent: "Suddenly, a flying orange cat with butterfly wings zoomed out of the foliage! 'Whizz! The golden acorn of the treehouse root has been jammed!' she meowed frantically.",
        imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        textContent: "Leo looked up. Sir Barnaby, a tiny snail wearing a fancy black top hat, was sliding slowly up a main gear. 'Do not worry, citizens! I shall fix this in four hours!'",
        imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        textContent: "Mia had a better idea. She loaded herself into the Acorn-Launcher and fired! 'Boing!' She flew past the top-hat snail and reached the jammed cog in two seconds!",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 5,
        textContent: "With a giant wiggle and a tickle, Mia popped the golden acorn out of the gear mechanism! The entire treehouse started to hum and glow with magical golden light.",
        imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 6,
        textContent: "Winding slides opened everywhere! Leo, Mia, the top-hat snail and the flying cat slid all the way down, landing safely on a pile of moss. What a wacky woodland ride!",
        imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    _id: "book_pizza_004",
    title: "The Pizza Pilgrim",
    genre: "Space Comedy",
    targetAgeGroup: "Ages 8-12",
    moralLesson: "Laughter and warm cheese are the ultimate space fuel!",
    blurbText: "One brave little robot. One giant slice of pizza. One whole galaxy to save before the toppings get cold. Adventures in space await!",
    coverImageUrl: "/src/assets/images/pizza_pilgrim_cover_1782071140371.jpg",
    pageCount: 6,
    wordCount: 200,
    basePrice: 5.00,
    secretSlug: "pizza-92d8f1",
    giveawayId: "give-pizza-004",
    isPublished: true,
    pages: [
      {
        pageNumber: 1,
        textContent: "Orbiting Kepler-9 lived Bot-3000, a tiny chrome robot with a massive hunger. His trusty transport was a giant, hovering slice of extra-cheese pepperoni pizza!",
        imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        textContent: "Beep-boop-bzz! The evil Space Seagulls were descending on the solar system, threatening to eat all the planet rings as if they were giant crispy onion rings!",
        imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        textContent: "Bot-3000 pulled out his legendary Golden Laser Sword. 'Prepare to be toasted, feathered fowl!' he announced, slicing through asteroid dust with style.",
        imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        textContent: "He rode his hot, gooey pizza board right through the seagull fleet, throwing extra-hot jalapeño peppers which made the seagulls sneeze uncontrollably!",
        imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 5,
        textContent: "The giant alpha seagull tried to swallow Bot-3000 whole! But he stuffed a giant glob of mozzarella cheese in its beak, sealing it shut with a sticky, gooey glue!",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 6,
        textContent: "The seagulls flew away in defeat. Bot-3000 sat on his cosmic slice of pizza, looked at the sparkling stars, and celebrated with a byte of olive oil. Space saved!",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
      }
    ]
  }
];

export class DBStore {
  private static init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBStructure = {
        users: [
          {
            _id: "user_default_jason",
            username: "jason",
            email: "jason@comicbook.xyz",
            passwordHash: "jason123", // mock storage
            virtualCoins: 1000000,
            badges: [
              { badgeId: "first_comic", title: "Comic Cadet", unlockedAt: new Date().toISOString() }
            ],
            ownedBooks: [
              { bookId: "book_gatoreye_001", unlockedVia: "giveaway" }
            ]
          }
        ],
        books: INITIAL_BOOKS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } else {
      // If DB file exists, read and make sure our 4 new custom core books are dynamically mapped, replacing old placeholders.
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(content);
        if (data && Array.isArray(data.books)) {
          // Filter out any stale book pointers
          const hasGator = data.books.some((b: any) => b._id === "book_gatoreye_001");
          if (!hasGator) {
            // Filter old boilerplate entries
            const filtered = data.books.filter((b: any) => 
              b._id !== "book_super_detectives" && 
              b._id !== "book_robo_puppies" && 
              b._id !== "book_marshmallow_monster" &&
              b._id !== "book_gatoreye_001" &&
              b._id !== "book_allies_002" &&
              b._id !== "book_acorn_003" &&
              b._id !== "book_pizza_004"
            );
            data.books = [...INITIAL_BOOKS, ...filtered];
            
            // Migrate default user ownedBooks to have gatoreye instead of super_detectives
            if (Array.isArray(data.users)) {
              data.users.forEach((u: any) => {
                if (Array.isArray(u.ownedBooks)) {
                  u.ownedBooks = u.ownedBooks.map((ob: any) => {
                    if (ob.bookId === "book_super_detectives") {
                      return { bookId: "book_gatoreye_001", unlockedVia: "giveaway" };
                    }
                    return ob;
                  });
                }
              });
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
          }
        }
      } catch (e) {
        console.error("Failed to migrate existing database file:", e);
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
      return data;
    } catch (e) {
      // Recovery fallback
      return { users: [], books: INITIAL_BOOKS };
    }
  }

  private static write(data: DBStructure) {
    this.init();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
