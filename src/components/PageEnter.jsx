import { useLocation } from 'react-router-dom'

export function PageEnter({ children }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  )
}
