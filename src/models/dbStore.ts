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
  chapterTitle?: string;
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
  "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
];

const INITIAL_BOOKS: BookSchemaType[] = [
  {
    _id: "book_echo_starlight",
    title: "The Echo of Starlight",
    genre: "Sci-Fi / Mystery",
    targetAgeGroup: "Ages 13+",
    moralLesson: "Knowledge and truth can dismantle oppression, and true freedom requires the courage to imagine—and fight for—a world beyond the one you were born into.",
    blurbText: "In the smog-choked, subterranean city of Core-Nine, teenager Kaelen Gray is a scavenger of old-world technology. When he uncovers a discarded device that receives a mysterious distress signal from a distant, supposedly barren planet, his discovery makes him a target for the ruling Collective. Pursued by oppressive authorities, Kaelen must piece together the device's secrets and rally a group of outcasts to decode the transmission. Together, they risk everything to expose the truth about a celestial world, daring to lead their desperate city out of the shadows and up into the stars.",
    coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
    pageCount: 4,
    wordCount: 1200,
    basePrice: 4.00,
    secretSlug: "starlight-echo-special",
    giveawayId: "free-starlight-key-99",
    isPublished: true,
    isPictureBook: false,
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "The Scavenger's Signal",
        textContent: "The mechanical tooth of the crane groaned against the reinforced steel bulkhead of Sector 4. For seventeen-year-old Kaelen Gray, the screech was just another lullaby in the endless, rhythmic industrial noise of Core-Nine. In the cavernous, smog-choked heart of the subterranean city, daylight was nothing more than a myth told by the elders. Here, existence was measured by tonnage: tons of refined minerals, tons of scrap metal, and tons of recycled air. Kaelen wiped a streak of oily soot from his forehead and adjusted his respirator. His pneumatic mag-gloves were humming, clinging stubbornly to the rusted hull of an archaic freighter that had crashed into the lower sectors centuries ago. These wrecks were his playground—and his livelihood.",
        imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        chapterTitle: "A Warning in the Dark",
        textContent: "\"Any luck, kid?\" crackled a raspy voice over his earpiece. It was Silas, the grizzled, one-eyed owner of the local salvage shop and the only person in Core-Nine Kaelen considered family. \"Nothing but broken circuit boards and melted copper, Silas,\" Kaelen sighed, using a crowbar to pry open a dented access panel. \"It’s like the Collective scrubbed this entire sector clean before walling it off.\" \"Keep digging,\" Silas urged. \"The Collective's enforcement droids are patrolling near the water recyclers today. If they catch you this far out, they'll ship you to the hydro-mines for sure. Find me something valuable so we can pay off the air-tax this week.\" Kaelen rolled his eyes, even though Silas couldn't see it. The Collective controlled every breath the citizens took, rationing oxygen based on labor quotas.",
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        chapterTitle: "The Hidden Crystal",
        textContent: "Just as Kaelen was about to give up and ascend the maintenance shaft, he noticed a faint, unnatural glimmer beneath a thick layer of sediment. He engaged his mag-gloves to maximum power and wrenched a heavy, fused control console out of the wall. Behind it sat a small, crystalline data-drive, no larger than a matchbook. It was pristine—completely untouched by the rust and decay that swallowed everything else in Core-Nine. A faint, bioluminescent blue pulse flickered from its core. Curiosity overriding his common sense, Kaelen pulled his splicing tool from his utility belt and bypassed the drive's physical locks. His internal heads-up display whirred to life as the drive interfaced with his respirator’s visor. A stream of corrupted data flooded his vision.",
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        chapterTitle: "A Vision of Greenery",
        textContent: "A holographic projection flickered to life just above his palm. It was the image of a woman with bright, unscarred skin and wind-swept hair, standing in front of a horizon filled with vibrant, lush greenery. Kaelen’s breath hitched. He had never seen a plant that wasn't grey or genetically modified to survive the smog. \"To whoever finds this,\" the woman's voice was clear, laced with an eerie, captivating melody. \"We are still here. The stars are not empty. Please, look up.\" The projection cut out, leaving Kaelen in the dark, silent wreck. He quickly pocketed the crystal. He couldn't let them find it. He had a choice to make: return to his mundane life as a scavenger and pretend he saw nothing, or risk everything to uncover the truth behind the beacon.",
        imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    _id: "book_library_lost_hours",
    title: "The Library of Lost Hours",
    genre: "Urban Fantasy / Cozy Mystery",
    targetAgeGroup: "Ages 13+",
    moralLesson: "Time is our most precious currency, and the moments we think we are \"wasting\" often hold the truest magic of being alive.",
    blurbText: "In the rain-slicked streets of London, hidden inside an ordinary antique shop, lies the Library of Lost Hours. This secret sanctuary stores the literal time that people waste, procrastinate, or lose to daydreaming. Thirty-year-old archivist Clara Finch spends her quiet days categorizing these jars of shimmering, golden time. But when a rare vault is broken into, and a priceless century of \"stolen time\" goes missing, Clara is accused of the crime. To clear her name, she must team up with a cynical clocksmith and dive into London's magical underbelly, racing against a literal ticking clock before the thief uses the stolen century to rewrite history.",
    coverImageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600",
    pageCount: 4,
    wordCount: 1100,
    basePrice: 4.00,
    secretSlug: "library-hours-special",
    giveawayId: "free-library-key-88",
    isPublished: true,
    isPictureBook: false,
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "The Golden Jar",
        textContent: "The chime above the door of Finch & Fable Antiques didn't ring; it hummed. It was a low, resonant sound that vibrated in the floorboards, a sound only heard by people who were looking for something they couldn't name. Clara Finch adjusted her wire-rimmed glasses and used a silk cloth to wipe a speck of dust from a brass pocket watch. To the tourists wandering through Bloomsbury, her shop was just a cluttered haven for Victorian furniture and outdated maps. But behind the heavy oak bookshelf in the back room lay London’s best-kept secret: the Library of Lost Hours.",
        imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        chapterTitle: "Liquid Time",
        textContent: "Clara was an archivist, but she didn't deal in books. She dealt in time. \"Late again, Arthur,\" Clara murmured without looking up as the shop door clicked shut. A lanky man in a tweed waistcoat stepped inside, shaking raindrops from his umbrella. Arthur Vance was a clocksmith, a man whose hands were perpetually stained with gear oil and magic. \"Traffic on the Underground was abysmal, Clara. I swear the city lost twenty minutes to collective frustration today.\" \"Actually, it was twenty-four minutes,\" Clara corrected gently, pointing a finger toward the back room. \"I felt the pull in the vault just a moment ago. A lovely shade of amber.\"",
        imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        chapterTitle: "The Rotunda of Jars",
        textContent: "When people procrastinated, stared blankly out of train windows, or put off writing that final chapter, that \"lost\" time didn't just vanish into the ether. It condensed. It became a tangible, glowing liquid that Clara and her secret society harvested and archived. The Library kept the world’s temporal balance stable. Clara led Arthur through the hidden doorway behind the bookshelf, descending a spiral staircase into a vast, subterranean rotunda. Shelves stretched stories high, packed with thousands of glass jars. Each jar glowed with varying intensities of golden light, tagged with names, dates, and emotional frequencies.",
        imageUrl: "https://images.unsplash.com/photo-1518373714866-3f1478910eb0?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        chapterTitle: "A Shattered Vault",
        textContent: "\"I need you to calibrate the seal on Vault Seven,\" Clara said, walking toward the center of the room. \"The daydreaming hours from the local art university are fermenting. They’re getting volatile.\" Arthur didn't answer. Clara turned around and saw him staring at the center pedestal. The floor-to-ceiling glass case that normally housed the crown jewel of their collection—the Year 1926—was shattered. The glass lay in a neat, shimmering circle on the stone floor. The pedestal was bare. The Year 1926 was gone, and the thief now possessed enough time to undo the world.",
        imageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    _id: "book_taste_tomorrow",
    title: "The Taste of Tomorrow",
    genre: "Cyberpunk / Neo-Noir Thriller",
    targetAgeGroup: "Ages 13+",
    moralLesson: "True humanity lies in our flaws and messy memories, and we must never sacrifice our ethics or our empathy for comfort and luxury.",
    blurbText: "In the neon-drenched megacity of Neo-Chicago, natural food is a myth. The population survives on synthetic nutrient gel, while the elite dine on bio-printed delicacies. Thirty-two-year-old Jax Mercer is a \"flavor smuggler,\" risking his life to black-market real, organic ingredients. But when he is hired to steal a top-secret capsule from the world’s largest food conglomerate, he discovers a horrifying truth: the corporation’s new, highly addictive luxury flavor is mapped from the memories and emotions of missing street kids. Suddenly targeted by corporate assassins, Jax must team up with a cynical tech-hacker to expose the recipe before the food supply becomes the ultimate tool for mind control.",
    coverImageUrl: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600",
    pageCount: 4,
    wordCount: 1150,
    basePrice: 4.00,
    secretSlug: "taste-tomorrow-special",
    giveawayId: "free-taste-key-77",
    isPublished: true,
    isPictureBook: false,
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "The Last Lemon",
        textContent: "The rain in Sector 8 always tasted like copper and wet batteries. Jax Mercer pulled the collar of his oilskin trench coat up against the chemical drizzle and ducked into the neon shadow of an alleyway. His cybernetic eye whirred, switching to thermal vision to scan the darkness. No corporate drones. No Enforcers. Just the rhythmic hum of giant air scrubbers vibrating through the asphalt. Jax pulled a locked, temperature-controlled briefcase tight against his chest. Inside lay a prize that men would kill for in the year 2091: three fresh, organic lemons.",
        imageUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 2,
        chapterTitle: "Rations and Rumors",
        textContent: "To the millions of citizens living in the stacked hab-blocks of Neo-Chicago, real fruit was a fairy tale. They lived on Synth-Chew—a gray, rubbery paste that provided vitamins but tasted like cardboard. Real flavor was a luxury restricted to the corporate boardrooms in the Upper Sky-Grid. Jax knocked three times on a rusted steel door. A slot slid open, revealing a pair of bloodshot eyes behind a dirty visor. \"Did you get them?\" a voice rasped. \"Yeah,\" Jax whispered. \"Open up, Chef. It's pouring acid out here.\"",
        imageUrl: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 3,
        chapterTitle: "Underground Citrus",
        textContent: "The heavy door unbolted with a loud hiss. Jax stepped into the humid heat of an illegal underground kitchen. Here, the wealthy paid thousands of credits for the illegal thrill of tasting real history. Chef Leo, a burly man with cybernetic prosthetic hands, snatched the briefcase. He punched in the code, and as the lid popped open, the sharp, vibrant scent of citrus cut through the heavy smell of grease and ozone. Leo gasped, touching the yellow rind like it was gold. \"Incredible. How did you get past their biometrics?\"",
        imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"
      },
      {
        pageNumber: 4,
        chapterTitle: "The Glowing Purple Vial",
        textContent: "\"Don't ask,\" Jax said, wiping water from his face. \"Just pay me my credits.\" Before Leo could transfer the funds, the kitchen’s police scanners began to wail. “Warning: Corporate strike team inbound.” \"They tracked the fruit's genetic signature,\" Jax cursed, drawing his plasma pistol. \"They didn't follow me. They followed the lemons.\" The roof exploded. Glass and concrete rained down as three heavily armored corporate commandos dropped in. They reached into Leo’s pocket and pulled out a small, glowing purple vial. Jax was now the only witness left alive.",
        imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600"
      }
    ]
  }
];

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
        defaultBookId: INITIAL_BOOKS[0]?._id || ""
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(emptyState, null, 2), 'utf-8');
    } else {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(content);
        
        // Ensure initial high quality books exist
        let changed = false;
        if (!data.books) {
          data.books = [];
          changed = true;
        }
        
        for (const initialBook of INITIAL_BOOKS) {
          const exists = data.books.some((b: any) => b._id === initialBook._id);
          if (!exists) {
            data.books.push(initialBook);
            changed = true;
          }
        }
        
        if (!data.defaultBookId && INITIAL_BOOKS.length > 0) {
          data.defaultBookId = INITIAL_BOOKS[0]._id;
          changed = true;
        }

        // Clean any legacy books if found
        const hasLegacy = data.books && data.books.some((b: any) => 
          b._id.startsWith("book_gatoreye") || 
          b._id.startsWith("book_allies") || 
          b._id.startsWith("book_acorn") || 
          b._id.startsWith("book_pizza")
        );
        if (hasLegacy) {
          data.books = data.books.filter((b: any) => 
            !b._id.startsWith("book_gatoreye") && 
            !b._id.startsWith("book_allies") && 
            !b._id.startsWith("book_acorn") && 
            !b._id.startsWith("book_pizza")
          );
          changed = true;
          console.log("🧹 DB STORE: Cleared legacy books from persistent db.json storage.");
        }

        if (changed) {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      } catch (e) {
        // Ignore or recover
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
        const qVal = (query as any)[key];
        const uVal = (user as any)[key];
        if (key === 'email' && typeof qVal === 'string' && typeof uVal === 'string') {
          if (qVal.toLowerCase() !== uVal.toLowerCase()) {
            return false;
          }
        } else {
          if (uVal !== qVal) {
            return false;
          }
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
