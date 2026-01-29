import { useLocation, useNavigate } from 'react-router-dom';
import type { Problem } from '../types';

export default function Results() {
    const location = useLocation();
    const navigate = useNavigate();
    const { solutions, problem, winner } = location.state as {
        solutions: Array<{ socketId: string; code: string; testResults: any }>;
        problem: Problem;
        winner: string;
    };

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Match Results</h1>
                    <p className="text-gray-400">{problem.title}</p>
                </div>

                {winner && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20 text-center">
                        <h2 className="text-2xl font-semibold text-white mb-2">Winner</h2>
                        <p className="text-green-400 text-lg font-mono">{winner}</p>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {solutions.map((solution, idx) => (
                        <div key={solution.socketId} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Player {idx + 1}</h2>
                                {solution.testResults && (
                                    <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${
                                        solution.testResults.passed === solution.testResults.total
                                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                                    }`}>
                                        {solution.testResults.passed}/{solution.testResults.total} Passed
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mb-4 font-mono">{solution.socketId}</p>
                            <pre className="bg-black/50 backdrop-blur-sm text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-white/5">
                                {solution.code}
                            </pre>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/15 text-white font-semibold py-3 px-8 rounded-xl transition-all border border-white/20"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}