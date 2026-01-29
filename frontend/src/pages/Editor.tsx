import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import Editor from '@monaco-editor/react';
import type { Problem, TestResults } from '../types';

export default function CodeEditor() {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId, problem } = location.state as { roomId: string; problem: Problem };
    
    const [code, setCode] = useState<string>(problem.starterCode.javascript);
    const [language, setLanguage] = useState<'javascript' | 'python' | 'java'>('javascript');
    const [opponentSubmitted, setOpponentSubmitted] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);
    const [testResults, setTestResults] = useState<TestResults | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        socket.on('opponent_submitted', () => setOpponentSubmitted(true));
        socket.on('testing_code', () => setIsTesting(true));
        socket.on('test_results', (results: TestResults) => {
            setTestResults(results);
            setIsTesting(false);
            setIsRunning(false);
        });
        socket.on('run_results', (results: TestResults) => {
            setTestResults(results);
            setIsRunning(false);
        });
        socket.on('submission_error', (error: string) => {
            alert(`Error: ${error}`);
            setIsTesting(false);
            setHasSubmitted(false);
            setIsRunning(false);
        });
        socket.on('reveal_solutions', ({ solutions, winner, problem }) => {
            navigate('/results', { state: { solutions, winner, problem } });
        });

        return () => {
            clearInterval(timer);
            socket.off('opponent_submitted');
            socket.off('testing_code');
            socket.off('test_results');
            socket.off('run_results');
            socket.off('submission_error');
            socket.off('reveal_solutions');
        };
    }, [navigate]);

    const handleLanguageChange = (newLang: 'javascript' | 'python' | 'java') => {
        setLanguage(newLang);
        setCode(problem.starterCode[newLang]);
    };

    const handleRun = () => {
        if (isRunning || hasSubmitted) return;
        setIsRunning(true);
        setTestResults(null);
        socket.emit('run_code', { code, language });
    };

    const handleSubmit = () => {
        if (hasSubmitted) return;
        socket.emit('submit_code', { code, language });
        setHasSubmitted(true);
        setIsTesting(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen flex flex-col bg-black">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-white">{problem.title}</h1>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                        problem.difficulty === 'easy' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                        problem.difficulty === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                        'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                        {problem.difficulty.toUpperCase()}
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className={`text-lg font-mono font-semibold ${
                        timeLeft < 60 ? 'text-red-400' : 'text-white'
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                    
                    {opponentSubmitted && !hasSubmitted && (
                        <div className="text-yellow-400 text-sm font-medium px-3 py-1 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            Opponent submitted
                        </div>
                    )}
                    
                    <button
                        onClick={handleRun}
                        disabled={isRunning || hasSubmitted}
                        className={`px-5 py-2 rounded-lg font-medium transition-all border text-sm ${
                            isRunning || hasSubmitted
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed border-white/10'
                                : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                        }`}
                    >
                        {isRunning ? 'Running...' : 'Run'}
                    </button>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={hasSubmitted}
                        className={`px-5 py-2 rounded-lg font-medium transition-all border text-sm ${
                            hasSubmitted
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed border-white/10'
                                : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                        }`}
                    >
                        {hasSubmitted ? 'Submitted' : 'Submit'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Problem Panel */}
                <div className="w-1/3 bg-white/5 backdrop-blur-xl p-6 overflow-y-auto border-r border-white/10">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Description</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">{problem.description}</p>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Examples</h2>
                            {problem.examples.map((example, idx) => (
                                <div key={idx} className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-3 border border-white/5">
                                    <p className="text-sm text-gray-400 mb-1">Input: <span className="text-green-400 font-mono">{example.input}</span></p>
                                    <p className="text-sm text-gray-400 mb-1">Output: <span className="text-blue-400 font-mono">{example.output}</span></p>
                                    {example.explanation && (
                                        <p className="text-sm text-gray-500 mt-2">{example.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Constraints</h2>
                            <ul className="space-y-2">
                                {problem.constraints.map((constraint, idx) => (
                                    <li key={idx} className="text-sm text-gray-400 pl-4 border-l-2 border-white/10">{constraint}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Test Cases</h2>
                            {problem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                                <div key={idx} className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-2 border border-white/5">
                                    <p className="text-sm text-gray-400">Input: <span className="text-green-400 font-mono text-xs">{tc.input}</span></p>
                                    <p className="text-sm text-gray-400">Expected: <span className="text-blue-400 font-mono text-xs">{tc.expectedOutput}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor Panel */}
                <div className="flex-1 flex flex-col">
                    <div className="bg-white/5 px-4 py-2 flex gap-2 border-b border-white/10">
                        {(['javascript', 'python', 'java'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`px-4 py-1.5 rounded-lg border transition-all text-sm ${
                                    language === lang
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border-white/10'
                                }`}
                            >
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1">
                        <Editor
                            height="100%"
                            language={language}
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Test Results */}
                    {(isTesting || isRunning || testResults) && (
                        <div className="h-1/3 bg-white/5 backdrop-blur-xl border-t border-white/10 overflow-y-auto p-4">
                            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Test Results</h3>
                            
                            {(isTesting || isRunning) ? (
                                <div className="text-yellow-400 flex items-center gap-2 text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                                    {isTesting ? 'Testing...' : 'Running...'}
                                </div>
                            ) : testResults ? (
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className={`text-base font-semibold ${
                                            testResults.passed === testResults.total ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {testResults.passed} / {testResults.total} Passed
                                        </span>
                                        <div className="flex-1 max-w-xs ml-4">
                                            <div className="w-full bg-white/10 rounded-full h-2 border border-white/5">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        testResults.passed === testResults.total ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(testResults.passed / testResults.total) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {testResults.results.map((result, idx) => (
                                        <div key={idx} className={`mb-3 p-3 rounded-lg ${
                                            result.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                                        }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white text-sm font-medium">Test {idx + 1}</span>
                                                <span className={`text-xs font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                    {result.passed ? 'PASSED' : 'FAILED'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 space-y-1">
                                                <p>Input: <span className="text-blue-300 font-mono">{result.input}</span></p>
                                                <p>Expected: <span className="text-green-300 font-mono">{result.expected}</span></p>
                                                <p>Output: <span className={`font-mono ${result.passed ? 'text-green-300' : 'text-red-300'}`}>{result.actual || 'None'}</span></p>
                                                {result.error && <p className="text-red-400">Error: {result.error}</p>}
                                                <p className="text-gray-500">{result.time}ms | {result.memory}KB</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}