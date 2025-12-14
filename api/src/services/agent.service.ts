import prisma from '../utils/database';
import { TaskStatus } from '@prisma/client';

export type TaskType = 'FETCH_OFFERS' | 'RUN_MATCH' | 'GENERATE_CV' | 'DAILY_BRIEF';

export async function createTask(userId: string, type: string, input: any = {}) {
    return prisma.agentTask.create({
        data: {
            userId,
            taskType: type,
            status: TaskStatus.QUEUED,
            input: input,
        }
    });
}

export async function processNextTask() {
    // 1. Find queued task
    const task = await prisma.agentTask.findFirst({
        where: { status: TaskStatus.QUEUED },
        orderBy: { createdAt: 'asc' }
    });

    if (!task) return null;

    // 2. Mark running
    await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: TaskStatus.RUNNING }
    });

    try {
        let output = {};

        switch (task.taskType) {
            case 'FETCH_OFFERS':
                // Call Offer Service (mock for now)
                output = { message: "Offers fetched (mock)", count: 5 };
                break;
            case 'RUN_MATCH':
                // Call Matching Service
                output = { message: "Matching run complete", matches: 3 };
                break;
            case 'DAILY_BRIEF':
                output = { message: "Brief generated" };
                break;
            default:
                throw new Error(`Unknown task type: ${task.taskType}`);
        }

        // 3. Mark success
        await prisma.agentTask.update({
            where: { id: task.id },
            data: { status: TaskStatus.SUCCESS, output }
        });

        return task;

    } catch (error: any) {
        // 4. Mark failed
        await prisma.agentTask.update({
            where: { id: task.id },
            data: {
                status: TaskStatus.FAILED,
                output: { error: error.message }
            }
        });
        return task;
    }
}
