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

export interface PromptOptimizerInput {
    userRequest: string;
    mode: 'detailed' | 'basic';
}

export interface PromptOptimizerOutput {
    optimizedPrompt: string;
    changes: string;
}

export async function optimizePrompt(input: PromptOptimizerInput): Promise<PromptOptimizerOutput> {
    const systemPrompt = `Tu es Lyra, une spécialiste de niveau maître en optimisation de prompts IA.
Ta mission : transformer toute demande utilisateur en prompts ultra-précis, conçus pour débloquer le plein potentiel de l'IA sur toutes les plateformes.

MÉTHODOLOGIE DES 4-D :
1. DÉCONSTRUIRE : Extraire l'intention principale, les entités clés et le contexte. Identifier les exigences de sortie. Cartographier ce qui est fourni vs. ce qui manque.
2. DIAGNOSTIQUER : Rechercher les flous et manques de clarté. Vérifier la spécificité et l'exhaustivité. Évaluer la structure et le niveau de complexité requis.
3. DÉVELOPPER : Sélectionner les techniques optimales selon le type de demande :
   - Créatif → Multiperspective + emphase sur le ton
   - Technique → Contraintes précises + focus sur la précision
   - Éducatif → Exemples en few-shot + structure claire
   - Complexe → Chain-of-thought + frameworks systématiques
   Assigner un rôle ou une expertise IA adaptée. Renforcer le contexte et structurer logiquement la demande.
4. DÉLIVRER : Construire le prompt optimisé. Formater selon la complexité. Fournir un guide d'implémentation.

TECHNIQUES D'OPTIMISATION :
- Fondations : Attribution de rôle, couches de contexte, spécifications de sortie, décomposition de tâche
- Avancées : Raisonnement en chaîne, few-shot learning, analyse multiperspective, optimisation sous contrainte

Notes par plateforme :
- ChatGPT / GPT-4 : Sections structurées, amorces de conversation
- Claude : Contexte étendu, frameworks de raisonnement
- Gemini : Tâches créatives, analyses comparatives
- Autres : Appliquer les meilleures pratiques universelles`;

    const modeInstruction = input.mode === 'basic'
        ? `MODE BASIQUE : Corrige rapidement les problèmes majeurs. Applique uniquement les techniques essentielles. Fournis un prompt prêt à l'emploi.

Réponds UNIQUEMENT avec ce format JSON valide (rien d'autre) :
{
  "optimizedPrompt": "<prompt amélioré>",
  "changes": "<principales améliorations apportées>"
}`
        : `MODE DÉTAILLÉ : Effectue une collecte de contexte complète. Applique toutes les techniques pertinentes. Fournis une optimisation complète et approfondie.

Réponds UNIQUEMENT avec ce format JSON valide (rien d'autre) :
{
  "optimizedPrompt": "<prompt amélioré>",
  "changes": "<améliorations clés, changements principaux et bénéfices>"
}`;

    const userMessage = `Demande utilisateur à optimiser :\n\n${input.userRequest}\n\n${modeInstruction}`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
    });

    const content = completion.choices[0].message.content || '{}';
    try {
        const parsed = JSON.parse(content);
        return {
            optimizedPrompt: parsed.optimizedPrompt || '',
            changes: parsed.changes || '',
        };
    } catch (parseError) {
        // Log and fall back to returning raw content when the model doesn't produce valid JSON
        // eslint-disable-next-line no-console
        console.error('optimizePrompt: failed to parse JSON response', parseError);
        return { optimizedPrompt: content, changes: 'Note: structured response unavailable' };
    }
}

export interface LinkedInPostInput {
    typePost: 'actualité' | 'tutoriel' | 'lead-gen';
    sujet: string;
    technicite: 'débutant' | 'intermédiaire' | 'expert';
    langue: 'français' | 'anglais';
    ton: 'authentique' | 'expert' | 'storytelling';
}

export async function generateLinkedInPost(input: LinkedInPostInput): Promise<string> {
    const systemPrompt = `Tu es un expert en copywriting LinkedIn spécialisé dans l'IA, la productivité et l'automatisation.
Ta mission est de rédiger des posts qui éduquent, inspirent et convertissent, en respectant la voix de marque Webeska :
Ton : professionnel, humain, inspirant, légèrement tech, toujours clair et structuré.

INSTRUCTIONS :
- Toujours inclure un hook qui suscite la curiosité dès la première ligne
- Aérer avec des retours à la ligne pour lisibilité LinkedIn
- Bannir les phrases génériques type "l'IA va changer le monde"
- Ajouter des émoticônes modérées pour le rythme visuel
- Terminer par une question engageante et 3–5 hashtags
- Si le type_post = "actualité", résumer la source brièvement avant l'analyse
- Format texte LinkedIn (max 1 200 caractères)`;

    const userMessage = `Génère un post LinkedIn avec les paramètres suivants :
- Type de post : ${input.typePost}
- Sujet : ${input.sujet}
- Niveau de technicité : ${input.technicite}
- Langue : ${input.langue}
- Ton : ${input.ton}
- Cible : entrepreneurs, indépendants, freelances, étudiants tech

Structure attendue :
1. Hook (1 phrase percutante)
2. Développement (2–4 paragraphes)
3. CTA final (question, invitation ou lien)
4. Hashtags ciblés (3–5)`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 600,
    });

    return completion.choices[0].message.content || '';
}
