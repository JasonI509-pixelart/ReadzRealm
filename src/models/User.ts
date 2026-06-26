import { DBStore, UserSchemaType, UserBadge, OwnedBookItem } from './dbStore';

export class UserInstance implements UserSchemaType {
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

  constructor(fields: any) {
    this._id = fields._id || "";
    this.username = fields.username || "";
    this.email = fields.email || "";
    this.passwordHash = fields.passwordHash || "";
    this.virtualCoins = fields.virtualCoins ?? 1000000;
    this.badges = fields.badges || [];
    this.ownedBooks = fields.ownedBooks || [];
    this.bannedUntil = fields.bannedUntil;
    this.banReason = fields.banReason;
    this.staredBookIds = fields.staredBookIds || [];
    this.clickedBuyBookIds = fields.clickedBuyBookIds || [];
    this.recentReadBookIds = fields.recentReadBookIds || [];
    this.status = fields.status || "free";
    this.lastClickedBookId = fields.lastClickedBookId;
    this.bookmarkedBookIds = fields.bookmarkedBookIds || [];
    this.pagesReadHistory = fields.pagesReadHistory || [];
    this.level = fields.level ?? 1;
    this.completedBookIdsForLevel = fields.completedBookIdsForLevel || [];
  }

  async save(): Promise<UserInstance> {
    if (!this._id) {
      const created = await DBStore.createUser({
        username: this.username,
        email: this.email,
        passwordHash: this.passwordHash,
        virtualCoins: this.virtualCoins,
        badges: this.badges,
        ownedBooks: this.ownedBooks,
        bannedUntil: this.bannedUntil,
        banReason: this.banReason,
        staredBookIds: this.staredBookIds,
        clickedBuyBookIds: this.clickedBuyBookIds,
        recentReadBookIds: this.recentReadBookIds,
        status: this.status,
        lastClickedBookId: this.lastClickedBookId,
        bookmarkedBookIds: this.bookmarkedBookIds,
        pagesReadHistory: this.pagesReadHistory,
        level: this.level,
        completedBookIdsForLevel: this.completedBookIdsForLevel
      });
      this._id = created._id;
    } else {
      await DBStore.updateUser(this._id, {
        username: this.username,
        email: this.email,
        passwordHash: this.passwordHash,
        virtualCoins: this.virtualCoins,
        badges: this.badges,
        ownedBooks: this.ownedBooks,
        bannedUntil: this.bannedUntil,
        banReason: this.banReason,
        staredBookIds: this.staredBookIds,
        clickedBuyBookIds: this.clickedBuyBookIds,
        recentReadBookIds: this.recentReadBookIds,
        status: this.status,
        lastClickedBookId: this.lastClickedBookId,
        bookmarkedBookIds: this.bookmarkedBookIds,
        pagesReadHistory: this.pagesReadHistory,
        level: this.level,
        completedBookIdsForLevel: this.completedBookIdsForLevel
      });
    }
    return this;
  }
}

export const UserModel = {
  find: async (query: any = {}) => {
    const list = await DBStore.findUsers(query);
    return list.map(item => new UserInstance(item));
  },
  findOne: async (query: any = {}) => {
    const list = await DBStore.findUsers(query);
    return list.length > 0 ? new UserInstance(list[0]) : null;
  },
  findById: async (id: string) => {
    if (!id) return null;
    const user = await DBStore.findUserById(id);
    return user ? new UserInstance(user) : null;
  },
  create: async (fields: any) => {
    const instance = new UserInstance(fields);
    await instance.save();
    return instance;
  }
};
