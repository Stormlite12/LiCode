import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import type { Problem } from '../types';

export default function MatchFound() {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [roomId, setRoomId] = useState<string>('');
    const [opponentId, setOpponentId] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        // Join queue when component loads
        socket.emit('join_queue');
        console.log('Joined queue, waiting for match...');

        socket.on('queue_status', (status) => {
            console.log('Queue status:', status);
        });

        socket.on('match_found', ({ roomId, opponentId, problem }) => {
            console.log('Match found!', { roomId, opponentId, problem });
            setRoomId(roomId);
            setOpponentId(opponentId);
            setProblem(problem);
            
            setTimeout(() => {
                navigate('/editor', { state: { roomId, problem } });
            }, 3000);
        });

        return () => {
            socket.off('queue_status');
            socket.off('match_found');
        };
    }, [navigate]);

    if (!problem) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white text-2xl mb-4">Finding opponent...</div>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full text-white shadow-2xl border border-white/10">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full p-4 mb-4 border border-white/20">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">Match Found</h1>
                        <p className="text-lg text-gray-400">Opponent: {opponentId}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 text-left border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold">{problem.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                problem.difficulty === 'easy' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                                problem.difficulty === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                                'bg-red-500/20 border-red-500/50 text-red-300'
                            }`}>
                                {problem.difficulty.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-400 mb-4">{problem.description}</p>
                        
                        {problem.examples[0] && (
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                                <p className="text-sm font-semibold mb-2 text-white">Example:</p>
                                <p className="text-sm text-gray-400">Input: <span className="text-green-400">{problem.examples[0].input}</span></p>
                                <p className="text-sm text-gray-400">Output: <span className="text-blue-400">{problem.examples[0].output}</span></p>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-lg mb-2">Starting in...</p>
                        <div className="text-6xl font-bold animate-pulse">3</div>
                    </div>
                </div>
            </div>
        </div>
    );
}