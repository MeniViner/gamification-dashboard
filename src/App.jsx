import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BoothsManagement from './pages/BoothsManagement';
import LogoManager from './pages/LogoManager';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/booths" element={<BoothsManagement />} />
                <Route path="/admin/logos" element={<LogoManager />} />
            </Routes>
        </BrowserRouter>
    );
}
