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