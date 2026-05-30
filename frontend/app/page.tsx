import React from 'react'
import ThemeProvider from '../components/ThemeProvider'
import Button from '../components/Button'
import Card from '../components/Card'
import LayoutGrid from '../components/LayoutGrid'

export default function HomePage(){
  return (
    <ThemeProvider>
      <main style={{padding: '48px'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <img src="/images/logo.svg" alt="Founder Falcon" style={{height:36}} />
          <div>
            <Button variant="ghost" style={{marginRight:12}}>Sign in</Button>
            <Button variant="primary">Launch App</Button>
          </div>
        </header>

        <section style={{display:'grid',gridTemplateColumns:'1fr 520px',gap:32,alignItems:'center',marginTop:48}}>
          <div>
            <div style={{display:'inline-block',padding:'8px 14px',borderRadius:999,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.04)',color:'#bfeaf6',marginBottom:18}}>AI COFOUNDER. VOICE-FIRST. OUTCOME-DRIVEN.</div>
            <h1 style={{fontSize:56,lineHeight:1.03,margin:0,color:'#e9fbff'}}>Build startups with AI intelligence</h1>
            <p style={{marginTop:18,color:'#cfeff4',maxWidth:620}}>Speak your idea. Get validation, product strategy, technical architecture, and a roadmap — all through a real-time voice conversation powered by Murf Falcon.</p>

            <div style={{display:'flex',gap:12,marginTop:24}}>
              <Button variant="primary">Enter Workspace</Button>
              <Button variant="outline">Watch Demo</Button>
            </div>

            <div style={{display:'flex',gap:28,marginTop:32,alignItems:'center'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <img src="/images/voice.svg" alt="Voice assistant" style={{width:36,height:36}} />
                <small style={{marginTop:8}}>Voice Powered</small>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <img src="/images/prd.svg" alt="AI PRD generator" style={{width:36,height:36}} />
                <small style={{marginTop:8}}>AI Co-founder</small>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <img src="/images/global.svg" alt="Scholarship finder" style={{width:36,height:36}} />
                <small style={{marginTop:8}}>Real Outputs</small>
              </div>
            </div>
          </div>

          <aside>
            <Card>
              <div style={{width:'100%',height:420,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))',borderRadius:12}}>
                <img src="/images/demo-mock.jpeg" alt="Workspace mock" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} />
              </div>
            </Card>
          </aside>
        </section>

        <section style={{marginTop:64}}>
          <h2 style={{textAlign:'center',color:'#e9fbff'}}>Everything you need to go from idea to execution</h2>
          <p style={{textAlign:'center',color:'#cfeff4'}}>One conversation. Endless clarity.</p>

          <div style={{marginTop:28}}>
            <LayoutGrid columns={4} gap={20}>
              <Card>
                <img src="/images/prd.svg" alt="AI PRD generator" style={{width:32,height:32,marginBottom:12}} />
                <h3>AI PRD generator</h3>
                <p>Challenge assumptions, analyze market fit, and get a data-backed validation score.</p>
              </Card>
              <Card>
                <img src="/images/global.svg" alt="Scholarship finder" style={{width:32,height:32,marginBottom:12}} />
                <h3>Scholarship finder</h3>
                <p>Generate PRDs, define core features, user stories, and success metrics.</p>
              </Card>
              <Card>
                <img src="/images/voice.svg" alt="Voice assistant" style={{width:32,height:32,marginBottom:12}} />
                <h3>Voice assistant</h3>
                <p>Get a complete technical design specification, system architecture, and API structure.</p>
              </Card>
              <Card>
                <img src="/images/demo-mock.jpeg" alt="Workspace demo" style={{width:32,height:32,marginBottom:12}} />
                <h3>Demo preview</h3>
                <p>Real-time, natural conversations powered by Murf Falcon's ultra-realistic voice.</p>
              </Card>
            </LayoutGrid>
          </div>
        </section>
      </main>
    </ThemeProvider>
  )
}
