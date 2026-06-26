import { DBStore, BookSchemaType, BookPageType } from './dbStore';

export class BookInstance implements BookSchemaType {
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

  constructor(fields: any) {
    this._id = fields._id || "";
    this.title = fields.title || "";
    this.genre = fields.genre || "";
    this.targetAgeGroup = fields.targetAgeGroup || fields.ageGroup || "";
    this.moralLesson = fields.moralLesson || "";
    this.blurbText = fields.blurbText || "";
    this.coverImageUrl = fields.coverImageUrl || "";
    this.pageCount = fields.pageCount || 0;
    this.wordCount = fields.wordCount || 0;
    this.basePrice = fields.basePrice ?? 4.00;
    this.secretSlug = fields.secretSlug || "";
    this.giveawayId = fields.giveawayId || "";
    this.pages = fields.pages || [];
    this.isPublished = fields.isPublished ?? false;
    this.isPictureBook = fields.isPictureBook ?? false;
  }

  async save(): Promise<BookInstance> {
    if (!this._id) {
      const created = await DBStore.createBook({
        title: this.title,
        genre: this.genre,
        targetAgeGroup: this.targetAgeGroup,
        moralLesson: this.moralLesson,
        blurbText: this.blurbText,
        coverImageUrl: this.coverImageUrl,
        pageCount: this.pageCount,
        wordCount: this.wordCount,
        basePrice: this.basePrice,
        secretSlug: this.secretSlug,
        giveawayId: this.giveawayId,
        pages: this.pages,
        isPublished: this.isPublished,
        isPictureBook: this.isPictureBook
      });
      this._id = created._id;
    } else {
      await DBStore.updateBook(this._id, {
        title: this.title,
        genre: this.genre,
        targetAgeGroup: this.targetAgeGroup,
        moralLesson: this.moralLesson,
        blurbText: this.blurbText,
        coverImageUrl: this.coverImageUrl,
        pageCount: this.pageCount,
        wordCount: this.wordCount,
        basePrice: this.basePrice,
        secretSlug: this.secretSlug,
        giveawayId: this.giveawayId,
        pages: this.pages,
        isPublished: this.isPublished,
        isPictureBook: this.isPictureBook
      });
    }
    return this;
  }
}

// We mock standard new BookModel(fields) syntax
export const BookModel = Object.assign(
  function(this: any, fields: any) {
    if (!(this instanceof BookModel)) {
      return new (BookModel as any)(fields);
    }
    return new BookInstance(fields);
  } as any,
  {
    find: async (query: any = {}) => {
      const list = await DBStore.findBooks(query);
      return list.map(item => new BookInstance(item));
    },
    findOne: async (query: any = {}) => {
      const list = await DBStore.findBooks(query);
      return list.length > 0 ? new BookInstance(list[0]) : null;
    },
    findById: async (id: string) => {
      if (!id) return null;
      const b = await DBStore.findBookById(id);
      return b ? new BookInstance(b) : null;
    },
    create: async (fields: any) => {
      const instance = new BookInstance(fields);
      await instance.save();
      return instance;
    },
    delete: async (id: string) => {
      const { DBStore } = await import('./dbStore');
      return await DBStore.deleteBook(id);
    }
  }
);
