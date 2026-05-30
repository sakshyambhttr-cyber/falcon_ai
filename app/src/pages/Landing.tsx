import React from 'react'

export default function Landing({ enter }: { enter: () => void }){
  return (
    <div className="landing-hero">
      <div className="glass card hero">
        <h1>Founder Falcon</h1>
        <p>AI OS to generate PRDs, validate ideas, and build roadmaps.</p>
        <button className="cta" onClick={enter}>Enter Workspace</button>
      </div>
    </div>
  )
}
