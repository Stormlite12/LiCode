import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import type { Problem } from '../types';

interface QueueStats {
    position: number;
    totalWaiting: number;
    estimatedWaitTime: number;
}

interface RoomInfo {
    roomId: string;
    host: string;
    players: string[];
    difficulty: string;
    isReady: boolean;
}

export default function Lobby() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'menu' | 'queue' | 'create' | 'join' | 'room'>('menu');
    const [queueStats, setQueueStats] = useState<QueueStats>({ position: 0, totalWaiting: 0, estimatedWaitTime: 0 });
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'any'>('any');
    const [roomCode, setRoomCode] = useState('');
    const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        socket.on('queue_update', (stats: QueueStats) => setQueueStats(stats));
        socket.on('match_found', ({ roomId, problem }: { roomId: string; problem: Problem }) => {
            navigate('/editor', { state: { roomId, problem } });
        });
        socket.on('room_created', (roomInfo: RoomInfo) => {
            setCurrentRoom(roomInfo);
            setMode('room');
            setError('');
        });
        socket.on('room_joined', (roomInfo: RoomInfo) => {
            setCurrentRoom(roomInfo);
            setMode('room');
            setError('');
        });
        socket.on('room_updated', (roomInfo: RoomInfo) => setCurrentRoom(roomInfo));
        socket.on('room_error', (message: string) => setError(message));
        socket.on('room_match_start', ({ problem }: { problem: Problem }) => {
            if (currentRoom) navigate('/editor', { state: { roomId: currentRoom.roomId, problem } });
        });

        return () => {
            socket.off('queue_update');
            socket.off('match_found');
            socket.off('room_created');
            socket.off('room_joined');
            socket.off('room_updated');
            socket.off('room_error');
            socket.off('room_match_start');
        };
    }, [navigate, currentRoom]);

    const handleQuickMatch = () => {
        setMode('queue');
        socket.emit('join_queue', { difficulty: selectedDifficulty });
    };

    const handleLeaveQueue = () => {
        setMode('menu');
        socket.emit('leave_queue');
    };

    const handleCreateRoom = () => socket.emit('create_room', { difficulty: selectedDifficulty });

    const handleJoinRoom = () => {
        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }
        socket.emit('join_room', { roomCode: roomCode.toUpperCase() });
    };

    const handleLeaveRoom = () => {
        if (currentRoom) {
            socket.emit('leave_room', { roomId: currentRoom.roomId });
            setCurrentRoom(null);
            setMode('menu');
            setRoomCode('');
        }
    };

    const handleStartMatch = () => {
        if (currentRoom) socket.emit('start_room_match', { roomId: currentRoom.roomId });
    };

    const copyRoomCode = () => {
        if (currentRoom) {
            navigator.clipboard.writeText(currentRoom.roomId);
            alert('Room code copied!');
        }
    };

    const getDifficultyColor = (diff: string) => {
        if (diff === 'easy') return 'text-green-400 border-green-500/30';
        if (diff === 'medium') return 'text-yellow-400 border-yellow-500/30';
        if (diff === 'hard') return 'text-red-400 border-red-500/30';
        return 'text-white border-white/20';
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">LiCode Arena</h1>
                    <p className="text-lg text-gray-400">Real-time 1v1 Coding Battles</p>
                </div>

                {/* Main Menu */}
                {mode === 'menu' && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-6">Select Difficulty</h2>
                        
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {(['any', 'easy', 'medium', 'hard'] as const).map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => setSelectedDifficulty(diff)}
                                    className={`p-3 rounded-xl font-medium transition-all ${
                                        selectedDifficulty === diff
                                            ? 'bg-white/20 text-white border-2 border-white/40'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleQuickMatch}
                                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/15 text-white font-semibold py-5 px-8 rounded-xl transition-all border border-white/20"
                            >
                                Quick Match
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMode('create')}
                                    className="bg-white/5 hover:bg-white/10 text-white font-medium py-4 px-6 rounded-xl transition-all border border-white/10"
                                >
                                    Create Room
                                </button>
                                <button
                                    onClick={() => setMode('join')}
                                    className="bg-white/5 hover:bg-white/10 text-white font-medium py-4 px-6 rounded-xl transition-all border border-white/10"
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-3">
                            {[
                                { label: 'Players Online', value: '1,234' },
                                { label: 'Active Matches', value: '42' },
                                { label: 'Avg Wait Time', value: '~30s' }
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-gray-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Queue */}
                {mode === 'queue' && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <div className="text-center">
                            <div className="mb-8">
                                <div className="w-24 h-24 border-4 border-white/10 border-t-white/50 rounded-full animate-spin mx-auto"></div>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-4">Finding Opponent...</h2>
                            <p className="text-gray-400 mb-8">
                                Difficulty: <span className="text-white font-medium">{selectedDifficulty === 'any' ? 'Any' : selectedDifficulty}</span>
                            </p>
                            <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-3xl font-bold text-white">#{queueStats.position || 1}</div>
                                        <div className="text-sm text-gray-400">Position</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">{queueStats.totalWaiting || 0}</div>
                                        <div className="text-sm text-gray-400">Waiting</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLeaveQueue}
                                className="bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-3 px-8 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Room */}
                {mode === 'create' && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Create Custom Room</h2>
                        <div className="bg-white/5 rounded-xl p-6 mb-6 text-center border border-white/10">
                            <p className="text-gray-400">Difficulty: <span className="text-white font-medium text-lg">{selectedDifficulty}</span></p>
                        </div>
                        <button
                            onClick={handleCreateRoom}
                            className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-5 px-8 rounded-xl transition-all mb-4 border border-white/20"
                        >
                            Generate Room Code
                        </button>
                        <button
                            onClick={() => setMode('menu')}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-8 rounded-xl transition-all border border-white/10"
                        >
                            Back
                        </button>
                    </div>
                )}

                {/* Join Room */}
                {mode === 'join' && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Join Custom Room</h2>
                        <div className="mb-6">
                            <label className="block text-gray-400 mb-2 font-medium">Room Code</label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => {
                                    setRoomCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                placeholder="ABC123"
                                maxLength={6}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white text-2xl font-mono text-center uppercase focus:outline-none focus:border-white/40 transition-all"
                            />
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
                                <p className="text-red-300 text-center font-medium">{error}</p>
                            </div>
                        )}
                        <button
                            onClick={handleJoinRoom}
                            disabled={!roomCode.trim()}
                            className="w-full bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-semibold py-5 px-8 rounded-xl transition-all mb-4 border border-white/20"
                        >
                            Join Room
                        </button>
                        <button
                            onClick={() => {
                                setMode('menu');
                                setRoomCode('');
                                setError('');
                            }}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-8 rounded-xl transition-all border border-white/10"
                        >
                            Back
                        </button>
                    </div>
                )}

                {/* Room Waiting */}
                {mode === 'room' && currentRoom && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Custom Room</h2>
                        <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
                            <p className="text-gray-400 text-center mb-2 text-sm">Room Code</p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-4xl font-mono font-bold text-white tracking-wider">{currentRoom.roomId}</span>
                                <button
                                    onClick={copyRoomCode}
                                    className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
                                    title="Copy"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                            <p className="text-gray-400 text-center mb-4 text-sm">Players ({currentRoom.players.length}/2)</p>
                            <div className="space-y-3">
                                {currentRoom.players.map((playerId, idx) => (
                                    <div key={playerId} className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/30">
                                                {idx + 1}
                                            </div>
                                            <span className="text-white font-medium">
                                                {playerId === socket.id ? 'You' : 'Opponent'}
                                                {playerId === currentRoom.host && ' (Host)'}
                                            </span>
                                        </div>
                                        <span className="text-green-400 text-sm">Ready</span>
                                    </div>
                                ))}
                                {currentRoom.players.length < 2 && (
                                    <div className="bg-white/5 border border-dashed border-white/20 rounded-lg p-4 text-center">
                                        <span className="text-gray-400 text-sm">Waiting for opponent...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 mb-6 text-center border border-white/10">
                            <span className="text-gray-400 text-sm">Difficulty: </span>
                            <span className="text-white font-medium">{currentRoom.difficulty}</span>
                        </div>
                        <div className="space-y-3">
                            {currentRoom.host === socket.id && currentRoom.players.length === 2 ? (
                                <button
                                    onClick={handleStartMatch}
                                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-5 px-8 rounded-xl transition-all border border-white/20"
                                >
                                    Start Match
                                </button>
                            ) : (
                                <div className="bg-white/5 border border-white/20 rounded-xl p-4 text-center">
                                    <p className="text-gray-300 text-sm">
                                        {currentRoom.players.length < 2 ? 'Waiting for player...' : 'Waiting for host...'}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={handleLeaveRoom}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-3 px-8 rounded-xl transition-all"
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}