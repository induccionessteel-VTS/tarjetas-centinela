import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PerfilTrabajador from './PerfilTrabajador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/perfil/:rut" element={<PerfilTrabajador />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
