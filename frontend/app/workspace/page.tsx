import React from 'react'
import '../../styles/design.css'
import ThemeProvider from '../../components/ThemeProvider'
import WorkspaceScreen from '../../components/WorkspaceScreen'

export default function WorkspacePage(){
  return (
    <ThemeProvider>
      <WorkspaceScreen />
    </ThemeProvider>
  )
}
