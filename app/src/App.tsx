import React, { useState } from 'react'
import Landing from './pages/Landing'
import Workspace from './pages/Workspace'

export default function App(){
  const [inWorkspace, setInWorkspace] = useState(false)
  return inWorkspace ? <Workspace /> : <Landing enter={() => setInWorkspace(true)} />
}
