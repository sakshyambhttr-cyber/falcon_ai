export type LayoutIssue =
  | 'missing-nav'
  | 'missing-topbar'
  | 'empty-bottom-gap'
  | 'overflow-x'
  | 'shell-height'
  | 'workspace-grid'

export type LayoutHealResult = {
  issues: LayoutIssue[]
  patched: boolean
}

const ROOT_VARS = {
  topbar: '--ff-topbar-h',
  bottomNav: '--ff-bottomnav-h'
} as const

export function scanLayoutIssues(): LayoutIssue[] {
  if (typeof document === 'undefined') return []

  const issues: LayoutIssue[] = []

  if (!document.querySelector('.ff-bottom-nav')) issues.push('missing-nav')
  if (!document.querySelector('.ff-topbar')) issues.push('missing-topbar')

  const shell = document.querySelector('.ff-app-shell')
  const main = document.querySelector('.ff-app-main')

  if (shell) {
    const shellRect = shell.getBoundingClientRect()
    if (shellRect.height < window.innerHeight * 0.85) issues.push('shell-height')
  }

  if (main) {
    const mainRect = main.getBoundingClientRect()
    const gapBelow = window.innerHeight - mainRect.bottom
    if (gapBelow > 140) issues.push('empty-bottom-gap')
  }

  if (document.documentElement.scrollWidth > window.innerWidth + 2) {
    issues.push('overflow-x')
  }

  return issues
}

export function applyLayoutFix(issues: LayoutIssue[]): boolean {
  if (!issues.length || typeof document === 'undefined') return false

  const root = document.documentElement
  root.style.setProperty(ROOT_VARS.topbar, '52px')
  root.style.setProperty(ROOT_VARS.bottomNav, '76px')
  root.classList.add('ff-layout-healed')

  const shell = document.querySelector('.ff-app-shell')
  if (shell) {
    shell.classList.add('ff-shell-patched')
    ;(shell as HTMLElement).style.minHeight = '100dvh'
    ;(shell as HTMLElement).style.display = 'flex'
    ;(shell as HTMLElement).style.flexDirection = 'column'
  }

  const main = document.querySelector('.ff-app-main')
  if (main) {
    const el = main as HTMLElement
    el.style.flex = '1'
    el.style.minHeight = '0'
    if (issues.includes('empty-bottom-gap') || issues.includes('shell-height')) {
      el.style.minHeight = 'calc(100dvh - var(--ff-topbar-h) - var(--ff-bottomnav-h))'
    }
    el.style.paddingBottom = 'calc(var(--ff-bottomnav-h) + env(safe-area-inset-bottom, 0px))'
  }

  if (issues.includes('overflow-x')) {
    root.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
  }

  if (issues.includes('workspace-grid')) {
    normalizeWorkspaceGrid()
  }

  reattachBottomNav(issues.includes('missing-nav'))

  return true
}

export function reattachBottomNav(force = false) {
  const nav = document.querySelector('.ff-bottom-nav')
  if (!nav) {
    if (force && typeof document !== 'undefined') {
      console.warn('[layout-heal] Bottom nav missing — shell should render BottomNav')
    }
    return
  }
  const el = nav as HTMLElement
  el.style.display = 'block'
  el.style.visibility = 'visible'
  el.style.position = 'fixed'
  el.style.bottom = '0'
  el.style.left = '0'
  el.style.right = '0'
  el.style.zIndex = '200'
}

export function normalizeWorkspaceGrid() {
  const ws = document.querySelector('.ff-analysis-workspace')
  if (!ws) return
  const el = ws as HTMLElement
  el.style.display = ''
  el.style.gridTemplateColumns = ''
}

export function runLayoutHealCycle(): LayoutHealResult {
  const issues = scanLayoutIssues()
  const patched = applyLayoutFix(issues)
  return { issues, patched }
}
