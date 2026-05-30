import React from 'react'

export type SidebarShellProps = {
  children?: React.ReactNode
  className?: string
}

export default function SidebarShell({ children, className = '' }: SidebarShellProps){
  return (
    <aside className={["ff-sidebar-shell", className].filter(Boolean).join(' ')}>
      <div className="ff-sidebar-content">{children}</div>
    </aside>
  )
}
