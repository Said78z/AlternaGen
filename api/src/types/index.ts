// TypeScript type definitions for AlternaGen API

export interface User {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Profile {
    id: string;
    userId: string;
    educationLevel?: string;
    fieldOfStudy?: string;
    skills: string[];
    preferredLocations: string[];
    preferredSectors: string[];
    cvUrl?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Job {
    id: string;
    userId: string;
    title: string;
    company: string;
    location?: string;
    description?: string;
    requirements?: string;
    url: string;
    source?: string;
    savedAt: Date;
    createdAt: Date;
}

export enum ApplicationStatus {
    SAVED = 'SAVED',
    APPLIED = 'APPLIED',
    INTERVIEW = 'INTERVIEW',
    OFFER = 'OFFER',
    REJECTED = 'REJECTED',
}

export interface Application {
    id: string;
    userId: string;
    jobId: string;
    status: ApplicationStatus;
    notes?: string;
    appliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface MatchScore {
    id: string;
    userId: string;
    jobId: string;
    score: number; // 0-100
    explanation?: string;
    calculatedAt: Date;
}

// API Request/Response types

export interface CreateProfileRequest {
    educationLevel?: string;
    fieldOfStudy?: string;
    skills: string[];
    preferredLocations: string[];
    preferredSectors: string[];
    bio?: string;
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> { }

export interface CreateJobRequest {
    title: string;
    company: string;
    location?: string;
    description?: string;
    requirements?: string;
    url: string;
    source?: string;
}

export interface CreateApplicationRequest {
    jobId: string;
    status?: ApplicationStatus;
    notes?: string;
}

export interface UpdateApplicationRequest {
    status?: ApplicationStatus;
    notes?: string;
    appliedAt?: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Clerk webhook types
export interface ClerkWebhookEvent {
    type: string;
    data: {
        id: string;
        email_addresses: Array<{
            email_address: string;
            id: string;
        }>;
        first_name?: string;
        last_name?: string;
    };
}
