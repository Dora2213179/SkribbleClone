import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'animals',
    words: ['cat', 'dog', 'lion', 'tiger', 'elephant', 'giraffe', 'penguin', 'dolphin', 'rabbit', 'bear']
  },
  {
    name: 'objects',
    words: ['chair', 'table', 'bottle', 'umbrella', 'clock', 'laptop', 'guitar', 'bicycle', 'telescope', 'backpack']
  },
  {
    name: 'actions',
    words: ['running', 'swimming', 'dancing', 'jumping', 'cooking', 'sleeping', 'painting', 'reading', 'climbing', 'flying']
  },
  {
    name: 'food',
    words: ['pizza', 'burger', 'sushi', 'banana', 'sandwich', 'cake', 'noodles', 'donut', 'taco', 'mango']
  }
];

async function main() {
  console.log('Seeding database with words...');
  
  // Clear existing words
  await prisma.word.deleteMany({});
  
  let count = 0;
  for (const cat of categories) {
    for (const w of cat.words) {
      await prisma.word.create({
        data: {
          word: w,
          category: cat.name
        }
      });
      count++;
    }
  }
  
  console.log(`Successfully seeded ${count} words across ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
