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
    industry: string;
    targetAudience: string;
    writingStyle: 'concise' | 'expert' | 'storytelling';
    objective: 'visibility' | 'engagement' | 'awareness';
    topic?: string;
    baseText?: string;
}

export interface LinkedInPostVariants {
    variant1: string; // Concise (80-100 words)
    variant2: string; // Professional/expert (150-200 words)
    variant3: string; // Long storytelling (250-300 words)
}

export async function generateLinkedInPost(input: LinkedInPostInput): Promise<LinkedInPostVariants> {
    const topicSection = input.baseText
        ? `Texte de base fourni: "${input.baseText}"`
        : input.topic
        ? `Thématique: ${input.topic}`
        : '';

    const objectiveMap: Record<string, string> = {
        visibility: 'visibilité organique',
        engagement: 'engagement (likes, commentaires, partages)',
        awareness: 'notoriété de marque',
    };

    const styleMap: Record<string, string> = {
        concise: 'concis et percutant',
        expert: 'professionnel et expert',
        storytelling: 'storytelling narratif',
    };

    const prompt = `Tu es un expert en marketing LinkedIn et en création de contenu professionnel.

Génère trois variantes d'un post LinkedIn optimisé pour:
- Secteur / spécialisation: ${input.industry}
- Audience cible: ${input.targetAudience}
- Style d'écriture souhaité: ${styleMap[input.writingStyle]}
- Objectif principal: ${objectiveMap[input.objective]}
${topicSection ? `- ${topicSection}` : ''}

Respecte la structure AIDA (Attention, Interest, Desire, Action) pour chaque variante.
Chaque post doit contenir: une accroche forte, un corps (storytelling ou éducatif) et un appel à l'action percutant.
Intègre des mots-clés SEO pertinents pour LinkedIn afin d'améliorer la visibilité organique.
Adapte le ton à l'audience cible et assure la cohérence entre les variantes.

Réponds UNIQUEMENT au format JSON valide suivant, sans texte supplémentaire:
{
  "variant1": "<Variante 1 – Concise et percutante, 80-100 mots>",
  "variant2": "<Variante 2 – Professionnelle et experte, 150-200 mots>",
  "variant3": "<Variante 3 – Longue, orientée storytelling, 250-300 mots>"
}`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
    });

    const content = completion.choices[0].message.content || '{}';
    try {
        return JSON.parse(content) as LinkedInPostVariants;
    } catch {
        throw new Error('Failed to parse LinkedIn post variants from AI response');
    }
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
