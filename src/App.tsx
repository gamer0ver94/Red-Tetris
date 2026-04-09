import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Join from './pages/Join'
import Lobby from './pages/Lobby'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/join" element={<Join/>}/>
          <Route path="/lobby" element={<Lobby/>}/>
          <Route path="/game" element={<Lobby/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
