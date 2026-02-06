import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface NoteContent {
    text: string;
    isBold: boolean;
    isItalic: boolean;
    isHeading: boolean;
    isBulletPoint: boolean;
    checklistItems?: Array<ChecklistItem>;
}
export interface Note {
    id: string;
    title: string;
    content: Array<NoteContent>;
    owner: Principal;
    dueDate?: Time;
    progress: Progress;
    target?: bigint;
    timestamp: Time;
    category: Category;
    images: Array<ExternalBlob>;
}
export type Time = bigint;
export interface ChecklistItem {
    checked: boolean;
    text: string;
}
export interface UserProfile {
    name: string;
}
export enum Category {
    prioritas = "prioritas",
    santai = "santai",
    medium = "medium"
}
export enum Progress {
    belumMulai = "belumMulai",
    selesai = "selesai",
    sedangDikerjakan = "sedangDikerjakan"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addImageToNote(noteId: string, image: ExternalBlob): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checklistToggle(noteId: string, itemText: string): Promise<void>;
    createNote(title: string, content: Array<NoteContent>, images: Array<ExternalBlob>, progress: Progress, category: Category, target: bigint | null, dueDate: Time | null): Promise<string>;
    deleteNote(id: string): Promise<void>;
    filterNotesByCategory(category: Category): Promise<Array<Note>>;
    filterNotesByProgress(progress: Progress): Promise<Array<Note>>;
    getAllNotes(): Promise<Array<Note>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getNote(id: string): Promise<Note>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateNote(id: string, title: string, content: Array<NoteContent>, images: Array<ExternalBlob>, progress: Progress, category: Category, target: bigint | null, dueDate: Time | null): Promise<void>;
}
