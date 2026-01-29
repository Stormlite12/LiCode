import { Server, Socket } from "socket.io";
import { userRooms, roomSubmissions, roomProblems } from "../state/gameState";
import { getProblemById } from "../data/problems";
import { runTestCases } from "../services/codeExecutor";
import type { RevealSolutionsData, Submission } from "../types";
import { canSubmit } from "../middleware/rateLimiter";
import { validateCode, validateLanguage } from "../utils/validation";

export function handleDuel(io: Server, socket: Socket) {
    // NEW: Handle Run button (test without submitting)
    socket.on("run_code", async ({ code, language }: { code: string; language: string }) => {
        // ✅ Add validation
        const codeValidation = validateCode(code);
        if (!codeValidation.valid) {
            socket.emit("submission_error", codeValidation.error);
            return;
        }

        if (!validateLanguage(language)) {
            socket.emit("submission_error", "Invalid language");
            return;
        }

        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const problemId = roomProblems.get(roomId);
        const problem = problemId ? getProblemById(problemId) : null;
        
        if (!problem) {
            socket.emit("submission_error", "Problem not found");
            return;
        }

        try {
            // Only run visible test cases for Run button
            const visibleTestCases = problem.testCases.filter(tc => !tc.isHidden);
            const testResults = await runTestCases(code, language, visibleTestCases);
            
            socket.emit("run_results", testResults);
            console.log(`User ${socket.id} ran code: ${testResults.passed}/${testResults.total} passed`);
        } catch (error) {
            console.error("Run execution error:", error);
            socket.emit("submission_error", "Failed to run test cases");
        }
    });

    // EXISTING: Handle Submit button (final submission)
    socket.on("submit_code", async ({ code, language }: { code: string; language: string }) => {
        // ✅ Add rate limiting
        if (!canSubmit(socket.id)) {
            socket.emit("submission_error", "Rate limit exceeded. Wait 1 minute.");
            return;
        }

        // ✅ Add validation
        const codeValidation = validateCode(code);
        if (!codeValidation.valid) {
            socket.emit("submission_error", codeValidation.error);
            return;
        }

        if (!validateLanguage(language)) {
            socket.emit("submission_error", "Invalid language");
            return;
        }

        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const submissions = roomSubmissions.get(roomId);
        if (!submissions) return;

        const problemId = roomProblems.get(roomId);
        const problem = problemId ? getProblemById(problemId) : null;
        
        if (!problem) {
            socket.emit("submission_error", "Problem not found");
            return;
        }

        const submission: Submission = {
            code,
            language,
            testResults: null,
            submitTime: Date.now()
        };

        submissions.set(socket.id, submission);
        socket.emit("testing_code", "Running test cases...");

        try {
            // Run ALL test cases (including hidden ones) for submission
            const testResults = await runTestCases(code, language, problem.testCases);
            submission.testResults = testResults;

            socket.emit("test_results", testResults);
            socket.to(roomId).emit("opponent_submitted");

            if (submissions.size === 2) {
                const results = Array.from(submissions.entries()).map(([sId, sub]) => ({
                    socketId: sId,
                    code: sub.code,
                    language: sub.language,
                    testResults: sub.testResults,
                    submitTime: sub.submitTime
                }));

                const winner = determineWinner(results);
                const revealData: RevealSolutionsData = { solutions: results, winner, problem };
                
                io.to(roomId).emit("reveal_solutions", revealData);
                console.log(`Match complete. Winner: ${winner}`);
            }
        } catch (error) {
            console.error("Test execution error:", error);
            socket.emit("submission_error", "Failed to run test cases");
        }
    });
}

function determineWinner(results: any[]): string {
    const [p1, p2] = results;
    
    if (!p1.testResults || !p2.testResults) {
        return p1.testResults ? p1.socketId : p2.socketId;
    }
    
    if (p1.testResults.passed > p2.testResults.passed) return p1.socketId;
    if (p2.testResults.passed > p1.testResults.passed) return p2.socketId;
    
    if (p1.submitTime < p2.submitTime) return p1.socketId;
    return p2.socketId;
}
