import { prisma } from "../src/services/prisma";

async function seed() {
  await prisma.coloringBook.createMany({
    data: [
      {
        title: "Азбука",
        coverImage: "/covers/abc.jpg",
        description: "От А до Я",
        pageCount: 1,
        isActive: true,
      },
      {
        title: "Собаки",
        coverImage: "/covers/dogs.jpg",
        description: "Собаки - друзья человека",
        pageCount: 1,
        isActive: true,
      },
      {
        title: "Для Соньки",
        coverImage: "/covers/anime.jpg",
        description: "Картинки для Соньки",
        pageCount: 1,
        isActive: true,
      },
    ],
  });
}

seed()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
