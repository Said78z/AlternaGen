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

export interface SEOArticleInput {
    keyword: string;
}

export interface SEOArticleOutput {
    seoTitle: string;
    metaDescription: string;
    article: string;
}

export async function generateSEOArticle(input: SEOArticleInput): Promise<SEOArticleOutput> {
    const { keyword } = input;

    const prompt = `Act as an expert SEO content writer.

Generate a 2000+ word, fully SEO-optimized article using the focus keyword: "${keyword}".

Follow these rules strictly:

1. First create a comprehensive outline with 15–17+ headings and subheadings (H1 through H6).
2. Use only ONE H1 heading for the article title.
3. Include H2, H3, H4, H5, and H6 subheadings throughout the article.
4. At the top of your response (before the article), provide:
   - SEO Title: a title that includes a number, a power word, and a sentiment word, naturally containing the keyword.
   - Meta Description: 150–160 characters, including the keyword naturally.
5. Use the focus keyword "${keyword}" naturally throughout the article at a density of 1–1.5%.
6. Include the keyword in:
   - The H1 title
   - The meta description
   - The first 10% of the article (first ~200 words)
   - At least one subheading
7. Write at a Grade 7 reading level (clear, simple sentences; short paragraphs).
8. Maintain a formal yet engaging tone.
9. Include:
   - Bullet point lists where appropriate
   - At least one table if helpful
   - At least 6 FAQs (in an FAQ section) before the conclusion
   - One relevant external link (use a real, authoritative URL)
10. Ensure 100% original, plagiarism-free content.
11. Demonstrate E-E-A-T: show experience, expertise, authority, and trustworthiness.
12. Minimum word count: 2000 words.

Format your response as valid JSON with exactly these three fields:
{
  "seoTitle": "<SEO title here>",
  "metaDescription": "<meta description here>",
  "article": "<full article in Markdown here>"
}

Do not include anything outside the JSON object.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 5500,
    });

    const raw = completion.choices[0].message.content || '{}';
    let parsed: SEOArticleOutput;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('Failed to parse SEO article response from AI model');
    }
    return parsed;
}
