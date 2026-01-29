export interface MatchFoundData {
    roomId: string;
    opponentId: string;
    problem: Problem;
}

export interface TestResults {
    passed: number;
    total: number;
    results: Array<{
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
        error: string | null;
        time: string;
        memory: number;
        status: string;
    }>;
}



export interface Submission {
    code: string;
    language: string;
    testResults: TestResults | null;
    submitTime: number;
}

export interface RevealSolutionsData {
    solutions: Array<{
        socketId: string;
        code: string;
        language: string;
        testResults: TestResults | null;
        submitTime: number;
    }>;
    winner: string;
    problem: Problem;
}


export interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    examples: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    constraints: string[];
    testCases: Array<{
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }>;
    starterCode: {
        javascript: string;
        python: string;
        java: string;
    };
}
