import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Analytics } from './pages/Analytics'
import { Docs } from './pages/Docs'
import { Earn } from './pages/Earn'
import { Explore } from './pages/Explore'
import { Home } from './pages/Home'
import { Flow } from './pages/Flow'
import { Payouts } from './pages/Payouts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/pay" element={<Payouts />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
