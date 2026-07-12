import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import CustomCursor from './components/animations/CustomCursor';
import GrainOverlay from './components/animations/GrainOverlay';

function App() {
  return (
    <>
      <GrainOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* Future Routes */}
            <Route path="shop" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Shop - Coming Soon</div>} />
            <Route path="login" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Login - Coming Soon</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
