import type { Submission } from "../types";

export let waitingQueue: Array<string> = [];
export const userRooms = new Map<string, string>();
export const roomSubmissions = new Map<string, Map<string, Submission>>();
export const roomProblems = new Map<string, string>(); // roomId -> problemId

export function setWaitingQueue(newQueue: Array<string>) {
    waitingQueue = newQueue;
}
