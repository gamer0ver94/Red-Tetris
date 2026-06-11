import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import { socketContext } from "./socket/socketContext";
import { socket } from "./socket/socket"
import GamePage from './pages/GamePage'
import { Navigate } from "react-router-dom";
import { ROUTES } from './Types/Routes.tsx';
import ScorePage from './pages/ScorePage.tsx'
function App() {
  return (
    <>
      <socketContext.Provider value={socket}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.REGISTER} replace />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage/>}/>
            <Route path={ROUTES.HOME} element={<HomePage/>}/>
            <Route path={ROUTES.LOBBY} element={<LobbyPage/>}/>
            <Route path={ROUTES.GAME} element={<GamePage/>}/>
            <Route path={ROUTES.SCORE} element={<ScorePage/>}/>
          </Routes>
        </BrowserRouter>
      </socketContext.Provider>
    </>
  )
}

export default App
