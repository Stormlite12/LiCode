import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Editor from './pages/Editor';
import Results from './pages/Results';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Lobby />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/results" element={<Results />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
