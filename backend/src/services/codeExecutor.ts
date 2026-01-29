import axios from 'axios';

const JUDGE0_API = process.env.JUDGE0_URL || 'http://localhost:2358';

interface ExecutionResult {
    status: {
        id: number;
        description: string;
    };
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    time: string | null;
    memory: number | null;
    message?: string;
}

const languageIds: Record<string, number> = {
    javascript: 63, // Node.js
    python: 71,     // Python 3
    java: 62        // Java
};

export async function executeCode(
    code: string,
    language: string,
    input: string
): Promise<ExecutionResult> {
    try {
        console.log(`Executing ${language} code with input: ${input.substring(0, 50)}...`);
        
        const submitResponse = await axios.post(
            `${JUDGE0_API}/submissions?base64_encoded=false&wait=true`,
            {
                source_code: code,
                language_id: languageIds[language],
                stdin: input,
                cpu_time_limit: 5,      // Increased from 2
                wall_time_limit: 10,    // Added
                memory_limit: 256000,   // Increased from 128000
                max_processes_and_or_threads: 60,
                enable_network: false
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            }
        );

        console.log('Judge0 response:', JSON.stringify(submitResponse.data, null, 2));
        return submitResponse.data;
        
    } catch (error: any) {
        console.error('Code execution error:', error.response?.data || error.message);
        
        // Return error result instead of throwing
        return {
            status: {
                id: 13, // Internal Error
                description: 'Internal Error'
            },
            stdout: null,
            stderr: error.response?.data?.stderr || null,
            compile_output: null,
            time: '0',
            memory: 0,
            message: error.response?.data?.message || error.message
        };
    }
}

export async function runTestCases(
    code: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string }>
): Promise<{ passed: number; total: number; results: any[] }> {
    const results = [];
    let passed = 0;

    console.log(`Running ${testCases.length} test cases for ${language}...`);

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`Test case ${i + 1}: input="${testCase.input}"`);
        
        try {
            const result = await executeCode(code, language, testCase.input);
            
            // Check status
            const isAccepted = result.status.id === 3;
            const output = (result.stdout?.trim() || '').replace(/\r\n/g, '\n');
            const expected = testCase.expectedOutput.trim().replace(/\r\n/g, '\n');
            const isPassed = isAccepted && output === expected;
            
            console.log(`Test ${i + 1} result: ${isPassed ? 'PASS' : 'FAIL'} (status: ${result.status.description})`);
            console.log(`  Expected: "${expected}"`);
            console.log(`  Got: "${output}"`);
            
            if (isPassed) passed++;
            
            results.push({
                input: testCase.input,
                expected,
                actual: output,
                passed: isPassed,
                error: result.stderr || result.compile_output || result.message || null,
                time: result.time || '0',
                memory: result.memory || 0,
                status: result.status.description
            });
        } catch (error: any) {
            console.error(`Test ${i + 1} failed with error:`, error.message);
            results.push({
                input: testCase.input,
                expected: testCase.expectedOutput,
                actual: '',
                passed: false,
                error: error.message,
                time: '0',
                memory: 0,
                status: 'Error'
            });
        }
    }

    console.log(`Test results: ${passed}/${testCases.length} passed`);
    return { passed, total: testCases.length, results };
}

export async function checkJudge0Health(): Promise<boolean> {
    try {
        const response = await axios.get(`${JUDGE0_API}/about`, { timeout: 5000 });
        console.log('Judge0 health check: OK', response.data);
        return response.status === 200;
    } catch (error) {
        console.error('Judge0 health check: FAILED', error);
        return false;
    }
}