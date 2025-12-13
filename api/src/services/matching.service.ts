import prisma from '../utils/database';
import logger from '../utils/logger';

/**
 * Heuristic Matching Service
 * Calculates match score (0-100) based on:
 * - Skills overlap (40%)
 * - Location match (30%)
 * - Seniority match (30%)
 */

interface MatchResult {
    score: number;
    explanation: string;
}

/**
 * Calculate skills overlap score
 */
function calculateSkillsScore(userSkills: string[], jobRequirements?: string): number {
    if (!jobRequirements || userSkills.length === 0) return 0;

    const reqLower = jobRequirements.toLowerCase();
    const matchedSkills = userSkills.filter((skill) =>
        reqLower.includes(skill.toLowerCase())
    );

    const overlapRatio = matchedSkills.length / userSkills.length;
    return Math.round(overlapRatio * 100);
}

/**
 * Calculate location match score
 */
function calculateLocationScore(
    preferredLocations: string[],
    jobLocation?: string
): number {
    if (!jobLocation || preferredLocations.length === 0) return 50; // Neutral if no data

    const jobLoc = jobLocation.toLowerCase();
    const hasMatch = preferredLocations.some((loc) =>
        jobLoc.includes(loc.toLowerCase())
    );

    return hasMatch ? 100 : 0;
}

/**
 * Calculate seniority match score
 */
function calculateSeniorityScore(
    educationLevel?: string,
    jobTitle?: string
): number {
    if (!educationLevel || !jobTitle) return 50; // Neutral if no data

    const titleLower = jobTitle.toLowerCase();
    const levelLower = educationLevel.toLowerCase();

    // Simple heuristic: Bac+3/4 → Junior/Alternance, Bac+5 → Senior/Manager
    const isJuniorRole =
        titleLower.includes('junior') ||
        titleLower.includes('alternance') ||
        titleLower.includes('stage');
    const isSeniorRole =
        titleLower.includes('senior') ||
        titleLower.includes('manager') ||
        titleLower.includes('lead');

    const isJuniorLevel = levelLower.includes('bac+3') || levelLower.includes('bac+4');
    const isSeniorLevel = levelLower.includes('bac+5') || levelLower.includes('master');

    if ((isJuniorRole && isJuniorLevel) || (isSeniorRole && isSeniorLevel)) {
        return 100;
    } else if ((isJuniorRole && isSeniorLevel) || (isSeniorRole && isJuniorLevel)) {
        return 30; // Mismatch but not impossible
    }

    return 50; // Neutral
}

/**
 * Calculate overall match score
 */
export async function calculateMatchScore(
    userId: string,
    jobId: string
): Promise<MatchResult> {
    try {
        // Get user profile
        const profile = await prisma.profile.findUnique({
            where: { userId },
        });

        // Get job
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!profile || !job) {
            return {
                score: 0,
                explanation: 'Profile or job not found',
            };
        }

        // Calculate component scores
        const skillsScore = calculateSkillsScore(profile.skills, job.requirements || undefined);
        const locationScore = calculateLocationScore(
            profile.preferredLocations,
            job.location || undefined
        );
        const seniorityScore = calculateSeniorityScore(
            profile.educationLevel || undefined,
            job.title
        );

        // Weighted average
        const finalScore = Math.round(
            skillsScore * 0.4 + locationScore * 0.3 + seniorityScore * 0.3
        );

        // Generate explanation
        const explanation = generateExplanation(
            finalScore,
            skillsScore,
            locationScore,
            seniorityScore,
            profile,
            job
        );

        // Save to database
        await prisma.matchScore.upsert({
            where: {
                userId_jobId: {
                    userId,
                    jobId,
                },
            },
            update: {
                score: finalScore,
                explanation,
            },
            create: {
                userId,
                jobId,
                score: finalScore,
                explanation,
            },
        });

        return { score: finalScore, explanation };
    } catch (error) {
        logger.error('Calculate match score error:', error);
        return {
            score: 0,
            explanation: 'Error calculating match score',
        };
    }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
    finalScore: number,
    skillsScore: number,
    locationScore: number,
    seniorityScore: number,
    profile: any,
    job: any
): string {
    const parts: string[] = [];

    if (finalScore >= 70) {
        parts.push('🎯 Excellent match!');
    } else if (finalScore >= 50) {
        parts.push('👍 Good match.');
    } else {
        parts.push('⚠️ Partial match.');
    }

    // Skills
    if (skillsScore >= 70) {
        parts.push(`Your skills align well with the requirements.`);
    } else if (skillsScore >= 40) {
        parts.push(`Some of your skills match the requirements.`);
    } else {
        parts.push(`Limited skills overlap.`);
    }

    // Location
    if (locationScore === 100) {
        parts.push(`Location matches your preferences (${job.location}).`);
    } else if (locationScore === 0) {
        parts.push(`Location (${job.location}) is outside your preferred areas.`);
    }

    // Seniority
    if (seniorityScore >= 70) {
        parts.push(`Role level fits your education (${profile.educationLevel}).`);
    } else if (seniorityScore < 50) {
        parts.push(`Role level may not align with your experience.`);
    }

    return parts.join(' ');
}

/**
 * Batch calculate match scores for all user jobs
 */
export async function calculateAllMatchScores(userId: string): Promise<void> {
    try {
        const jobs = await prisma.job.findMany({
            where: { userId },
        });

        for (const job of jobs) {
            await calculateMatchScore(userId, job.id);
        }

        logger.info(`Calculated match scores for ${jobs.length} jobs (user: ${userId})`);
    } catch (error) {
        logger.error('Batch calculate match scores error:', error);
    }
}
