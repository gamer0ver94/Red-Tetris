import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Join from './pages/Join'
import Lobby from './pages/Lobby'
import { socketContext } from "./socket/socketContext";
import { socket } from "./socket/socket"
function App() {
  return (
    <>
      <socketContext.Provider value={socket}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/join" element={<Join/>}/>
            <Route path="/lobby" element={<Lobby/>}/>
            <Route path="/game" element={<Lobby/>}/>
          </Routes>
        </BrowserRouter>
      </socketContext.Provider>
    </>
  )
}

export default App
