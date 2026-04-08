import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import logger from '../utils/logger';
import { CreateVisionRequest, UpdateVisionRequest } from '../types';

/**
 * Récupère la vision de l'utilisateur courant
 * GET /vision
 */
export const getVision = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'NON_AUTORISE', message: 'Non authentifié' },
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'UTILISATEUR_NON_TROUVE', message: 'Utilisateur introuvable' },
            });
            return;
        }

        const vision = await prisma.userVision.findUnique({
            where: { userId: user.id },
        });

        if (!vision) {
            res.status(404).json({
                success: false,
                error: { code: 'VISION_NON_TROUVEE', message: 'Vision non trouvée' },
            });
            return;
        }

        res.json({ success: true, data: vision });
    } catch (error: any) {
        logger.error('Erreur récupération vision:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERREUR_SERVEUR', message: 'Échec de la récupération de la vision' },
        });
    }
};

/**
 * Crée la vision de l'utilisateur courant
 * POST /vision
 */
export const createVision = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'NON_AUTORISE', message: 'Non authentifié' },
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
            include: { vision: true },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'UTILISATEUR_NON_TROUVE', message: 'Utilisateur introuvable' },
            });
            return;
        }

        if (user.vision) {
            res.status(400).json({
                success: false,
                error: { code: 'VISION_EXISTE', message: 'La vision existe déjà' },
            });
            return;
        }

        const data: CreateVisionRequest = req.body;

        if (!data.targetRoles || data.targetRoles.length === 0) {
            res.status(400).json({
                success: false,
                error: { code: 'DONNEES_INVALIDES', message: 'Les rôles cibles sont requis' },
            });
            return;
        }

        const vision = await prisma.userVision.create({
            data: {
                userId: user.id,
                dreams: data.dreams,
                constraints: data.constraints,
                preferredIndustries: data.preferredIndustries || [],
                targetRoles: data.targetRoles,
                alterGoal: data.alterGoal,
            },
        });

        res.status(201).json({ success: true, data: vision });
    } catch (error: any) {
        logger.error('Erreur création vision:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERREUR_SERVEUR', message: 'Échec de la création de la vision' },
        });
    }
};

/**
 * Met à jour la vision de l'utilisateur courant
 * PUT /vision
 */
export const updateVision = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'NON_AUTORISE', message: 'Non authentifié' },
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'UTILISATEUR_NON_TROUVE', message: 'Utilisateur introuvable' },
            });
            return;
        }

        const existing = await prisma.userVision.findUnique({
            where: { userId: user.id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: { code: 'VISION_NON_TROUVEE', message: 'Vision non trouvée' },
            });
            return;
        }

        const data: UpdateVisionRequest = req.body;

        const vision = await prisma.userVision.update({
            where: { userId: user.id },
            data: {
                ...(data.dreams !== undefined && { dreams: data.dreams }),
                ...(data.constraints !== undefined && { constraints: data.constraints }),
                ...(data.preferredIndustries !== undefined && { preferredIndustries: data.preferredIndustries }),
                ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles }),
                ...(data.alterGoal !== undefined && { alterGoal: data.alterGoal }),
            },
        });

        res.json({ success: true, data: vision });
    } catch (error: any) {
        logger.error('Erreur mise à jour vision:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERREUR_SERVEUR', message: 'Échec de la mise à jour de la vision' },
        });
    }
};

/**
 * Supprime la vision de l'utilisateur courant
 * DELETE /vision
 */
export const deleteVision = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'NON_AUTORISE', message: 'Non authentifié' },
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'UTILISATEUR_NON_TROUVE', message: 'Utilisateur introuvable' },
            });
            return;
        }

        const existing = await prisma.userVision.findUnique({
            where: { userId: user.id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: { code: 'VISION_NON_TROUVEE', message: 'Vision non trouvée' },
            });
            return;
        }

        await prisma.userVision.delete({
            where: { userId: user.id },
        });

        res.json({ success: true, message: 'Vision supprimée avec succès' });
    } catch (error: any) {
        logger.error('Erreur suppression vision:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERREUR_SERVEUR', message: 'Échec de la suppression de la vision' },
        });
    }
};
