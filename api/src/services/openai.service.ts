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

export interface LinkedInPostInput {
    sector: string;
    targetAudience: string;
    writingStyle: 'concise' | 'expert' | 'storytelling';
    objective: 'visibility' | 'engagement' | 'awareness';
    baseContent?: string;
}

export interface LinkedInPostVariants {
    concise: string;
    professional: string;
    storytelling: string;
}

export async function generateLinkedInPost(input: LinkedInPostInput): Promise<LinkedInPostVariants> {
    const styleLabels: Record<string, string> = {
        concise: 'concis et percutant',
        expert: 'professionnel et expert',
        storytelling: 'storytelling narratif',
    };

    const objectiveLabels: Record<string, string> = {
        visibility: 'maximiser la visibilité organique',
        engagement: 'maximiser l\'engagement (commentaires, partages)',
        awareness: 'renforcer la notoriété personnelle',
    };

    const baseContentSection = input.baseContent
        ? `\nTexte de base fourni par l'utilisateur :\n"${input.baseContent}"\n`
        : '';

    const prompt = `Tu es un expert en marketing LinkedIn et en personal branding. Génère trois variantes de posts LinkedIn optimisés en français pour un professionnel du secteur "${input.sector}".

Audience cible : ${input.targetAudience}
Style souhaité : ${styleLabels[input.writingStyle] || input.writingStyle}
Objectif principal : ${objectiveLabels[input.objective] || input.objective}
${baseContentSection}
Chaque post doit :
- Respecter la structure AIDA (Attention, Interest, Desire, Action)
- Commencer par une accroche forte
- Contenir un appel à l'action percutant
- Inclure des mots-clés SEO pertinents pour LinkedIn
- Adapter le ton à l'audience cible

Génère exactement les trois variantes suivantes, séparées par "---VARIANT---" :

VARIANTE 1 (Concise et percutante, 80-100 mots) :
[post ici]

---VARIANT---

VARIANTE 2 (Professionnelle et experte, 150-200 mots) :
[post ici]

---VARIANT---

VARIANTE 3 (Longue, orientée storytelling, 250-300 mots) :
[post ici]

Retourne uniquement les trois textes des posts séparés par "---VARIANT---", sans les titres de section.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
    });

    const content = completion.choices[0].message.content || '';
    const parts = content.split('---VARIANT---').map((p: string) => p.trim());

    if (parts.length !== 3 || parts.some((p: string) => !p)) {
        throw new Error('LinkedIn post generation returned an unexpected format');
    }

    return {
        concise: parts[0],
        professional: parts[1],
        storytelling: parts[2],
    };
}
