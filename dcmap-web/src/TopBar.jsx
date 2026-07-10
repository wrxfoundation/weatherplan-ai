import { NavLink } from 'react-router-dom'

export default function TopBar() {
  return (
    <header className="topbar">
      <NavLink to="/" className="logo">
        명당 <em>AI</em>
        <small>한국 AI 데이터센터 부지 인텔리전스</small>
      </NavLink>
      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          맵
        </NavLink>
        <NavLink to="/calc" className={({ isActive }) => (isActive ? 'active' : '')}>
          GPU 계산기
        </NavLink>
      </nav>
    </header>
  )
}
