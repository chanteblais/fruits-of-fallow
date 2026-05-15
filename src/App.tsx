import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import Nav from './components/Nav'
import Home from './pages/Home'
import JournalList from './pages/Journal'
import EntryForm from './pages/Journal/EntryForm'
import EntryDetail from './pages/Journal/EntryDetail'
import CardLibrary from './pages/CardLibrary'
import SymbolLexicon from './pages/SymbolLexicon'
import Attunement from './pages/Attunement'
import LivingArcana from './pages/LivingArcana/index'
import LivingArcanaCard from './pages/LivingArcana/CardPage'
import Weaving from './pages/Weaving'
import ThreadView from './pages/Weaving/ThreadView'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-shell">
          <Nav />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/journal" element={<JournalList />} />
              <Route path="/journal/new" element={<EntryForm />} />
              <Route path="/journal/:id/edit" element={<EntryForm />} />
              <Route path="/journal/:id" element={<EntryDetail />} />
              <Route path="/cards" element={<CardLibrary />} />
              <Route path="/symbols" element={<SymbolLexicon />} />
              <Route path="/attunement" element={<Attunement />} />
              <Route path="/study" element={<Navigate to="/attunement" replace />} />
              <Route path="/living-thread" element={<Weaving />} />
              <Route path="/living-thread/:id" element={<ThreadView />} />
              <Route path="/living-arcana" element={<LivingArcana />} />
              <Route path="/living-arcana/:cardId" element={<LivingArcanaCard />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
