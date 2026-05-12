import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WordManager {
  private allWords: string[] = [];
  private usedWords: Set<string> = new Set();
  private categories: string[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const words = await prisma.word.findMany();
      this.allWords = words.map(w => w.word);
      this.categories = [...new Set(words.map(w => w.category))];
      this.initialized = true;
      console.log(`WordManager initialized with ${this.allWords.length} words from SQLite database.`);
    } catch (e) {
      console.error('Failed to load words from DB, falling back to basic list.', e);
      this.allWords = ['apple', 'banana', 'cat', 'dog', 'house', 'tree'];
      this.initialized = true;
    }
  }

  getRandomWords(count: number = 3): string[] {
    if (!this.initialized || this.allWords.length === 0) {
      return ['apple', 'banana', 'cat'].slice(0, count);
    }
    
    // Filter out used words if possible
    let available = this.allWords.filter(w => !this.usedWords.has(w));
    
    // If we've used too many, reset
    if (available.length < count) {
      this.usedWords.clear();
      available = [...this.allWords];
    }

    // Fisher-Yates shuffle and pick
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, count);
    selected.forEach(w => this.usedWords.add(w));
    return selected;
  }

  resetUsedWords(): void {
    this.usedWords.clear();
  }

  getAllWords(): string[] {
    return [...this.allWords];
  }

  getCategories(): string[] {
    return [...this.categories];
  }
}

