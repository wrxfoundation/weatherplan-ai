import { createContext, useContext, useState, ReactNode } from 'react'

export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9'
export type ModuleMode = 'demo' | 'live'

type ModeState = {
  modes: Record<ModuleId, ModuleMode>
  setMode: (id: ModuleId, mode: ModuleMode) => void
}

const ALL_DEMO = Object.fromEntries(
  (['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'] as ModuleId[]).map(id => [id, 'demo']),
) as Record<ModuleId, ModuleMode>

const ModeContext = createContext<ModeState>({ modes: ALL_DEMO, setMode: () => {} })

export function ModeProvider({ children }: { children: ReactNode }) {
  const [modes, setModes] = useState<Record<ModuleId, ModuleMode>>(ALL_DEMO)
  const setMode = (id: ModuleId, mode: ModuleMode) => setModes(m => ({ ...m, [id]: mode }))
  return <ModeContext.Provider value={{ modes, setMode }}>{children}</ModeContext.Provider>
}

export const useModes = () => useContext(ModeContext)
