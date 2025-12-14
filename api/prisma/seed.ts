import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const offers = [
    {
        title: "Dévellopeur Fullstack React/Node - Alternance",
        company: "TechCorp",
        location: "Paris (Remote Friendly)",
        description: "Nous cherchons un alternant passionné pour travailler sur notre SaaS. Stack: Next.js, Postgres, Prisma.",
        tags: ["React", "Node.js", "TypeScript"],
        source: "SEED",
        url: "https://techcorp.com/jobs/1"
    },
    {
        title: "Assistant Chef de Projet Digital",
        company: "DigitalAgency",
        location: "Lyon",
        description: "Accompagnement des clients dans leur transformation digitale. Gestion de projet agile.",
        tags: ["Gestion de projet", "Agile", "Communication"],
        source: "SEED",
        url: "https://digitalagency.com/jobs/2"
    },
    {
        title: "Alternance Marketing Digital & Growth",
        company: "StartupX",
        location: "Bordeaux",
        description: "Gérer l'acquisition et le SEO. Création de contenu.",
        tags: ["Marketing", "SEO", "Copywriting"],
        source: "SEED",
        url: "https://startupx.com/jobs/3"
    }
];

async function main() {
    console.log('🌱 Seeding Job Offers...');

    for (const offer of offers) {
        await prisma.jobOffer.upsert({
            where: { url: offer.url },
            update: {},
            create: {
                ...offer,
                sourceRef: uuidv4(),
            }
        });
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
