import { prisma } from "../src/services/prisma";

async function seed() {
  await prisma.coloringBook.createMany({
    data: [
      {
        title: "Азбука",
        description: "От А до Я",
        isActive: true,
      },
      {
        title: "Собаки",
        description: "Собаки - друзья человека",
        isActive: true,
      },
      {
        title: "Для Соньки",
        description: "Картинки для Соньки",
        isActive: true,
      },
    ],
  });

  await prisma.coloringPage.createMany({
    data: [
      {
        title: "Истоки дружбы",
        orderIndex: 1,
        description:
          "Собаки были одомашнены человеком более 15 тысяч лет назад, и с тех пор помогают нам в жизни.",
        coloringBookId: 2,
      },
      {
        title: "Корги",
        orderIndex: 2,
        description:
          "Корги - это порода собак родом из Великобритании. Несмотря на небольшой размер, это настоящая пастушья собака, умная и верная.",
        coloringBookId: 2,
      },
      {
        title: "Сенбернар",
        orderIndex: 3,
        description:
          "Сенбернар - это порода собак родом из Швейцарии. Это большая и мощная собака, у нее отличное чувство направления и обоняния. Сенбернары помогают отыскивать и спасать людей в горах.",
        coloringBookId: 2,
      },
      {
        title: "Ши-тцу",
        orderIndex: 4,
        description:
          "Ши-тцу - это порода декоративных собак из Китая. Их название переводится как 'маленький лев', а самих собак разводили при императорском дворе.",
        coloringBookId: 2,
      },
      {
        title: "Махито",
        orderIndex: 1,
        coloringBookId: 3,
      },
      {
        title: "Саске вирнись в Каноху",
        orderIndex: 2,
        coloringBookId: 3,
      },
      {
        title: "Каз",
        orderIndex: 3,
        coloringBookId: 3,
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
