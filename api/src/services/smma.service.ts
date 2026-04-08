import OpenAI from 'openai';
import { z } from 'zod';
import logger from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ContentItemSchema = z.object({
    title: z.string(),
    channel: z.enum(['TIKTOK', 'REELS']),
    hook: z.string(),
    script: z.string(),
    cta: z.string(),
    onScreenText: z.string().optional(),
    beats: z.string().optional(),
    hashtags: z.array(z.string()).default([]),
});

const GenerationSchema = z.object({
    items: z.array(ContentItemSchema).length(30),
});

export type GeneratedItem = z.infer<typeof ContentItemSchema>;

export interface AgencyProfile {
    agencyName: string;
    niche: string;
    targetAudience: string;
    contentGoals: string;
    toneOfVoice: string;
    competitors?: string;
    uniqueValue?: string;
    language: string;
}

export async function generateContentIdeas(profile: AgencyProfile): Promise<GeneratedItem[]> {
    const langInstruction = profile.language === 'fr'
        ? 'Réponds UNIQUEMENT en français.'
        : 'Reply ONLY in English.';

    const prompt = `You are an expert SMMA content strategist. Generate exactly 30 content ideas for a social media agency.

Agency Profile:
- Agency Name: ${profile.agencyName}
- Niche: ${profile.niche}
- Target Audience: ${profile.targetAudience}
- Content Goals: ${profile.contentGoals}
- Tone of Voice: ${profile.toneOfVoice}
${profile.competitors ? `- Competitors: ${profile.competitors}` : ''}
${profile.uniqueValue ? `- Unique Value Proposition: ${profile.uniqueValue}` : ''}

${langInstruction}

Return a JSON object with an "items" array containing exactly 30 objects. Each object must have:
- title: string (content title)
- channel: "TIKTOK" or "REELS"
- hook: string (opening hook, first 3 seconds)
- script: string (full content script)
- cta: string (call to action)
- onScreenText: string (optional on-screen text/captions)
- beats: string (optional shots/beats breakdown)
- hashtags: string[] (5-10 relevant hashtags)

Alternate between TIKTOK and REELS channels. Make each idea unique and actionable.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(raw);
    const validated = GenerationSchema.parse(parsed);
    logger.info({ count: validated.items.length }, 'Content items generated');
    return validated.items;
}

export async function repurposeToReels(item: {
    title: string;
    hook: string;
    script: string;
    cta: string;
    hashtags: string[];
}, language: string): Promise<GeneratedItem> {
    const langInstruction = language === 'fr' ? 'Réponds UNIQUEMENT en français.' : 'Reply ONLY in English.';
    const prompt = `You are an expert at repurposing TikTok content for Instagram Reels.

Original TikTok content:
- Title: ${item.title}
- Hook: ${item.hook}
- Script: ${item.script}
- CTA: ${item.cta}
- Hashtags: ${item.hashtags.join(', ')}

${langInstruction}

Adapt this content for Instagram Reels. Key differences:
- Reels captions are longer and more polished
- Reels hashtags should include more community tags
- Adjust tone slightly more professional for Instagram
- Keep core message but adapt language/style

Return a single JSON object with fields: title, channel (must be "REELS"), hook, script, cta, onScreenText, beats, hashtags.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(raw);
    const validated = ContentItemSchema.parse({ ...parsed, channel: 'REELS' });
    return validated;
}
