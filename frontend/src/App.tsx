import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './layout/Shell.tsx';
import { LoginPage } from './funcionalidades/login/pagina.tsx';
import { DashboardPage } from './funcionalidades/dashboard/pagina.tsx';
import { PaginaInventario } from './funcionalidades/inventario/pagina.tsx';
import { PaginaMovimentos } from './funcionalidades/movimentos/pagina.tsx';
import { PaginaEmConstrucao } from './funcionalidades/_placeholder/PaginaEmConstrucao.tsx';
import { RotaProtegida } from './auth/RotaProtegida.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RotaProtegida />}>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RotaProtegida accao="verDashboard"><DashboardPage /></RotaProtegida>} />
          <Route path="inventario" element={<RotaProtegida accao="verInventario"><PaginaInventario /></RotaProtegida>} />
          <Route path="movimentos" element={<RotaProtegida accao="verMovimentos"><PaginaMovimentos /></RotaProtegida>} />
          <Route path="requisicoes" element={<RotaProtegida accao="verRequisicoes"><PaginaEmConstrucao titulo="Requisições" /></RotaProtegida>} />
          <Route path="relatorios" element={<RotaProtegida accao="verRelatorios"><PaginaEmConstrucao titulo="Relatórios" /></RotaProtegida>} />
          <Route path="utilizadores" element={<RotaProtegida accao="gerirUtilizadores"><PaginaEmConstrucao titulo="Utilizadores" /></RotaProtegida>} />
          <Route path="categorias" element={<RotaProtegida accao="gerirCategorias"><PaginaEmConstrucao titulo="Categorias" /></RotaProtegida>} />
          <Route path="configuracoes" element={<RotaProtegida accao="verConfiguracoes"><PaginaEmConstrucao titulo="Configurações" /></RotaProtegida>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}