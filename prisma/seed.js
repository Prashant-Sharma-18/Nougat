const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BRANDS = [
  {
    id: "prod_amazon_us",
    name: "Amazon.com Gift Card",
    category: "Retail",
    currencyCode: "USD",
    minRecipientVal: 10,
    maxRecipientVal: 500,
    logoUrl: "https://images.unsplash.com/photo-1523474253246-63e607d5bc1d?w=300&auto=format&fit=crop&q=80",
    description: "Shop millions of items, digital downloads, electronics, books, and more on Amazon.com.",
    denominations: [10, 25, 50, 100],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_apple_us",
    name: "Apple Gift Card",
    category: "Tech",
    currencyCode: "USD",
    minRecipientVal: 15,
    maxRecipientVal: 500,
    logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&auto=format&fit=crop&q=80",
    description: "Redeem for Apple hardware, accessories, App Store games, Apple Music, and iCloud storage.",
    denominations: [15, 25, 50, 100],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_starbucks_us",
    name: "Starbucks Card",
    category: "Food & Drink",
    currencyCode: "USD",
    minRecipientVal: 10,
    maxRecipientVal: 100,
    logoUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80",
    description: "Enjoy your favorite morning roast, handcrafted espresso, cold brew, or fresh bakery snack.",
    denominations: [10, 15, 25, 50],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_target_us",
    name: "Target eGiftCard",
    category: "Retail",
    currencyCode: "USD",
    minRecipientVal: 10,
    maxRecipientVal: 300,
    logoUrl: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=300&auto=format&fit=crop&q=80",
    description: "From household essentials and groceries to home décor and apparel, expect more and pay less.",
    denominations: [10, 25, 50, 100],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_uber_us",
    name: "Uber & Uber Eats",
    category: "Travel",
    currencyCode: "USD",
    minRecipientVal: 15,
    maxRecipientVal: 200,
    logoUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&auto=format&fit=crop&q=80",
    description: "One card for reliable rides across town or favorite restaurant meals delivered hot to your doorstep.",
    denominations: [15, 25, 50, 100],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_nike_us",
    name: "Nike Digital Gift Card",
    category: "Retail",
    currencyCode: "USD",
    minRecipientVal: 25,
    maxRecipientVal: 500,
    logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
    description: "Unlock world-class athletic footwear, performance training gear, and sport-inspired lifestyle wear.",
    denominations: [25, 50, 100, 200],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_spotify_us",
    name: "Spotify Premium",
    category: "Entertainment",
    currencyCode: "USD",
    minRecipientVal: 10,
    maxRecipientVal: 60,
    logoUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=300&auto=format&fit=crop&q=80",
    description: "Millions of songs and podcasts ad-free, with offline playback and high-fidelity sound.",
    denominations: [10, 30, 60],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_airbnb_us",
    name: "Airbnb Gift Card",
    category: "Travel",
    currencyCode: "USD",
    minRecipientVal: 50,
    maxRecipientVal: 500,
    logoUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&auto=format&fit=crop&q=80",
    description: "Give the gift of getaway, unforgettable travel experiences, beachfront villas, and cozy cabins.",
    denominations: [50, 100, 200],
    pointsPerUnit: 100.0,
    isActive: true,
  },
  {
    id: "prod_steam_us",
    name: "Steam Wallet Code",
    category: "Entertainment",
    currencyCode: "USD",
    minRecipientVal: 10,
    maxRecipientVal: 100,
    logoUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80",
    description: "Access thousands of PC games, downloadable content, and community marketplace items.",
    denominations: [10, 20, 50, 100],
    pointsPerUnit: 100.0,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding Gift Card Loyalty Platform database...");

  // 1. Seed Brands
  for (const brand of BRANDS) {
    await prisma.brandCatalogCache.upsert({
      where: { id: brand.id },
      update: brand,
      create: brand,
    });
    console.log(`Upserted brand: ${brand.name}`);
  }

  // 2. Seed Demo Users
  const user1 = await prisma.user.upsert({
    where: { email: "alex.demo@loyaltyrewards.io" },
    update: {},
    create: {
      email: "alex.demo@loyaltyrewards.io",
      name: "Alex Morgan",
      role: "USER",
      pointBalance: 7500, // $75.00
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sarah.vip@loyaltyrewards.io" },
    update: {},
    create: {
      email: "sarah.vip@loyaltyrewards.io",
      name: "Sarah Jenkins (VIP)",
      role: "USER",
      pointBalance: 25000, // $250.00
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@loyaltyrewards.io" },
    update: {},
    create: {
      email: "admin@loyaltyrewards.io",
      name: "Platform Administrator",
      role: "ADMIN",
      pointBalance: 50000,
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: "elena.corp@acmeworkspace.com" },
    update: {},
    create: {
      email: "elena.corp@acmeworkspace.com",
      name: "Elena Rostova (Acme Corp)",
      role: "ADMIN",
      pointBalance: 125000,
    },
  });

  // 3. Seed point ledger transactions if user has none
  const existingLedger = await prisma.pointLedger.findFirst({
    where: { userId: user1.id },
  });

  if (!existingLedger) {
    await prisma.pointLedger.createMany({
      data: [
        {
          userId: user1.id,
          amount: 5000,
          type: "EARNED",
          description: "New Member Registration & Tier 1 Welcome Bonus",
          referenceId: "WELCOME-5000",
          createdAt: new Date(Date.now() - 7 * 86400000),
        },
        {
          userId: user1.id,
          amount: 1500,
          type: "EARNED",
          description: "Online Store Purchase ($150.00 spend at 10 pts/$)",
          referenceId: "PURCHASE-ORD-8812",
          createdAt: new Date(Date.now() - 4 * 86400000),
        },
        {
          userId: user1.id,
          amount: 1000,
          type: "EARNED",
          description: "Completed Annual Satisfaction Survey",
          referenceId: "SURVEY-2026",
          createdAt: new Date(Date.now() - 2 * 86400000),
        },
      ],
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

