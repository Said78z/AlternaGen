import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CVInput {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    education: {
        degree: string;
        school: string;
        year: string;
    }[];
    experience: {
        title: string;
        company: string;
        duration: string;
        description: string;
    }[];
    skills: string[];
    languages: string[];
}

export interface CoverLetterInput {
    firstName: string;
    lastName: string;
    company: string;
    position: string;
    motivation: string;
    skills: string[];
}

export async function generateCV(input: CVInput): Promise<string> {
    const prompt = `Tu es un expert en rédaction de CV pour étudiants français cherchant une alternance.

Génère un CV professionnel et moderne en français pour:
- Nom: ${input.firstName} ${input.lastName}
- Email: ${input.email}
- Téléphone: ${input.phone}

Formation:
${input.education.map(e => `- ${e.degree} à ${e.school} (${e.year})`).join('\n')}

Expérience:
${input.experience.map(e => `- ${e.title} chez ${e.company} (${e.duration}): ${e.description}`).join('\n')}

Compétences: ${input.skills.join(', ')}
Langues: ${input.languages.join(', ')}

Format: Markdown professionnel avec sections claires. Sois concis et impactant. Mets en avant les compétences techniques et soft skills.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
    });

    return completion.choices[0].message.content || '';
}

export interface LinkedInPostInput {
    sector: string;
    targetAudience: string;
    writingStyle: 'concise' | 'expert' | 'storytelling';
    objective: 'visibility' | 'engagement' | 'awareness';
    baseText?: string;
}

export interface LinkedInPostVariants {
    variant1: string;
    variant2: string;
    variant3: string;
}

export async function generateLinkedInPost(input: LinkedInPostInput): Promise<LinkedInPostVariants> {
    const styleMap = {
        concise: 'concis et percutant',
        expert: 'professionnel et expert',
        storytelling: 'storytelling narratif',
    };

    const objectiveMap = {
        visibility: 'maximiser la visibilité organique',
        engagement: 'générer un maximum d\'engagement (likes, commentaires, partages)',
        awareness: 'renforcer la notoriété professionnelle',
    };

    const baseTextSection = input.baseText
        ? `\n\nTexte de base fourni par l'utilisateur (à réinterpréter et enrichir) :\n"${input.baseText}"`
        : '';

    const prompt = `Tu es un expert en marketing de contenu LinkedIn et en personal branding professionnel.

Génère TROIS variantes d'un post LinkedIn optimisé pour :
- Secteur / spécialisation : ${input.sector}
- Audience cible : ${input.targetAudience}
- Style d'écriture souhaité : ${styleMap[input.writingStyle]}
- Objectif principal : ${objectiveMap[input.objective]}${baseTextSection}

Chaque variante doit respecter la structure AIDA (Attention, Interest, Desire, Action) et inclure :
1. Une accroche forte (première ligne percutante)
2. Un corps engageant (storytelling ou éducatif selon la variante)
3. Un appel à l'action clair et percutant
4. Des mots-clés SEO LinkedIn pertinents pour le secteur
5. Des hashtags adaptés (3-5 maximum)

Contraintes strictes :
- Variante 1 – Concise et percutante : 80 à 100 mots maximum
- Variante 2 – Professionnelle et experte : 150 à 200 mots
- Variante 3 – Longue, orientée storytelling : 250 à 300 mots

Réponds UNIQUEMENT au format JSON suivant, sans texte avant ou après :
{
  "variant1": "...",
  "variant2": "...",
  "variant3": "..."
}`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content || '';
    let parsed: LinkedInPostVariants;
    try {
        parsed = JSON.parse(raw) as LinkedInPostVariants;
    } catch {
        throw new Error('LinkedIn post generation returned malformed JSON from AI model');
    }
    return parsed;
}

export async function generateCoverLetter(input: CoverLetterInput): Promise<string> {
    const prompt = `Tu es un expert en rédaction de lettres de motivation pour étudiants français cherchant une alternance.

Génère une lettre de motivation professionnelle et personnalisée en français pour:
- Candidat: ${input.firstName} ${input.lastName}
- Entreprise: ${input.company}
- Poste: ${input.position}
- Motivation: ${input.motivation}
- Compétences clés: ${input.skills.join(', ')}

Format: Lettre formelle française avec:
1. En-tête (coordonnées + entreprise)
2. Objet
3. Introduction accrocheuse
4. Paragraphe sur les compétences
5. Paragraphe sur la motivation
6. Conclusion et disponibilité
7. Formule de politesse

Sois authentique, enthousiaste et professionnel. Maximum 300 mots.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
    });

    return completion.choices[0].message.content || '';
}
