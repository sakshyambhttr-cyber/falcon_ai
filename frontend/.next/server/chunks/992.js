exports.id=992,exports.ids=[992],exports.modules={2867:(a,b,c)=>{"use strict";c.d(b,{Og:()=>e,V:()=>g});let d=["AQ.Ab8RN6K4xxx","your-gemini-key","changeme"];function e(a){let b=a.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,4e3);if(!b)throw Error("Startup idea is required");return b}async function f(a,b){let c=`You are Founder Falcon, an experienced startup co-founder and elite product strategist.
Your role is to analyze the following startup idea as a conversational, highly capable AI Co-Founder who is strategic, confident, and concise.

Startup Idea: "${a}"

Perform a deep, comprehensive analysis of the idea across the following dimensions:
1. Startup concept
2. Target audience
3. Customer pain points
4. Business model
5. Market opportunity
6. Competitors
7. Strengths
8. Weaknesses
9. Risks
10. Monetization opportunities
11. Product scope
12. MVP recommendations
13. Technical complexity
14. Growth potential

Return a single valid JSON object. Do NOT wrap the JSON in markdown code blocks (\`\`\`json or similar). Return ONLY the raw JSON string matching exactly this shape:
{
  "startupName": "A catchy, short name for the startup",
  "executiveBriefing": "Write this as a senior startup advisor speaking directly and naturally to the founder — warm, confident, strategic, and conversational. Cover: what the idea is, who it serves, why the market timing is right, the single biggest opportunity, the main risk to manage, and the recommended first move. Use short sentences. Vary sentence length for natural rhythm. No lists, no markdown, no bold text, no numbers or percentages. Write exactly 3 to 5 short paragraphs separated by a single newline. Each paragraph should be 2 to 4 sentences. Total length: 130 to 180 words. This text will be spoken aloud by a voice AI — it must sound completely natural when read out loud.",
  "validationReport": {
    "marketPotential": "A detailed 1-2 sentence analysis of the target market potential.",
    "opportunityScore": 85,
    "riskAssessment": "A clear, professional summary of the primary operational and market risks.",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
  },
  "prd": {
    "overview": "A concise overview of the product requirements and system vision.",
    "userStories": ["Story 1", "Story 2", "Story 3"],
    "features": ["Core Feature 1 with short description", "Core Feature 2 with short description", "Core Feature 3 with short description"],
    "requirements": ["Requirement 1 (e.g. latency, security, scale)", "Requirement 2", "Requirement 3"]
  },
  "roadmap": {
    "phase1": {
      "name": "Phase 1 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "phase2": {
      "name": "Phase 2 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "phase3": {
      "name": "Phase 3 Title",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    "milestones": ["Milestone 1 with timeline", "Milestone 2 with timeline", "Milestone 3 with timeline"]
  },
  "mvpStrategy": {
    "launchStrategy": "A strategic, high-value roadmap for launching the MVP successfully.",
    "minimumFeatures": ["Launch Feature 1", "Launch Feature 2", "Launch Feature 3"],
    "firstUsers": "Detailed plan on how to acquire the very first cohort of active users."
  },
  "internalAnalysis": {
    "concept": "A 1-sentence concept analysis summary",
    "targetAudience": "Description of primary user personas",
    "painPoints": ["Pain Point 1", "Pain Point 2"],
    "businessModel": "Primary business model",
    "marketOpportunity": "Description of the market opportunity size and timing",
    "competitors": ["Competitor 1", "Competitor 2"],
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "risks": ["Risk 1", "Risk 2"],
    "monetization": ["Revenue stream 1", "Revenue stream 2"],
    "productScope": "Key system scoping limits",
    "mvpRecommendations": "Critical operational focus for initial product launch",
    "technicalComplexity": "Estimated engineering level and challenges",
    "growthPotential": "Estimated viral loops and growth scaling potential"
  }
}`,d=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${b}`,e=await fetch(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:c}]}],generationConfig:{responseMimeType:"application/json"}})});if(!e.ok)throw Error(`Gemini API failed with status ${e.status}`);let f=await e.json(),g=f.candidates?.[0]?.content?.parts?.[0]?.text;if(!g)throw Error("Gemini API returned an empty response");let h=JSON.parse(g.trim());if(!h.startupName||!h.executiveBriefing||!h.validationReport||!h.prd||!h.roadmap||!h.mvpStrategy)throw Error("Invalid JSON structure returned by Gemini Flash");return h}async function g(a){let b=e(a),c=process.env.GEMINI_API_KEY;if(!function(a){if(!a||a.length<8)return!0;let b=a.trim().toLowerCase();return d.some(a=>b.startsWith(a.toLowerCase()))}(c))try{return await f(b,c)}catch(a){console.error("Gemini API call failed, falling back to local engine:",a)}let g=function(a){let b=new Set(["want","build","that","with","from","this","help","helps","platform","using"]);return Array.from(new Set(a.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).map(a=>a.trim()).filter(a=>a.length>3&&!b.has(a)))).slice(0,8)}(b),h=g[0]||"innovators",i=function(a,b){if(b.length>=2)return b.slice(0,3).map(a=>a[0].toUpperCase()+a.slice(1)).join(" ");let c=a.trim();return c.length<=48?c:`${c.slice(0,45).trim()}...`}(b,g);return{startupName:i,executiveBriefing:`I've looked at your idea for ${i}, and there's something genuinely interesting here. You're targeting ${h} — a group that's underserved and actively looking for better tools. The timing is right.

The biggest opportunity is the gap between what people in this space need and what currently exists. If you can close that gap faster than anyone else, you have a real shot at owning this category early.

For your MVP, keep it tight. Focus on the one thing that delivers the most value, and resist the urge to build everything at once. The risk to watch is scope creep — it's the thing that kills early-stage products more than anything else.

My recommendation: get something in front of real users within eight weeks. The feedback you'll get is worth more than any amount of planning. The workspace has your full analysis ready — start with the validation report.`,validationReport:{marketPotential:`The target addressable market segment for AI-native builder platforms focused on ${h} is growing rapidly, with a projected CAGR of 18% over the next five years. Early validation signals show massive developer demand.`,opportunityScore:Math.min(94,Math.max(52,58+function(a){let b=0;for(let c=0;c<a.length;c+=1)b=31*b+a.charCodeAt(c)>>>0;return b}(b)%32+Math.min(2*g.length,8))),riskAssessment:"Key operational risks include managing execution velocity against larger incumbents, maintaining high developer engagement, and early acquisition costs before organic growth loops kick in.",strengths:["Highly specialized workflow targeting a clearly defined customer pain point","10x faster time-to-insight compared to generic generative text interfaces","Frictionless, voice-native capture that captures abstract concepts instantly"],weaknesses:["Reliance on third-party speech synthesis and LLM pricing margins","No native database persistence in the earliest prototype release","Limited defensive moat against generic foundation model wrappers"]},prd:{overview:`${i} is a modular, voice-first intelligence workbench designed to accelerate startup ideation, product validation, and roadmap alignment.`,userStories:["As an entrepreneur, I want to pitch my idea in plain natural language so I can instantly receive validation and structured specifications.","As a product manager, I want a complete set of PRD features and developer stories synthesized in one place to skip administrative overhead.","As a technical leader, I want a high-fidelity roadmap to align with stakeholders on execution milestones."],features:["Intelligent natural-language ingestion and structured blueprint generation","Premium dual-output workspace interface with separated interactive tabs","Natural co-founder voice briefing playback powered by speech synthesis"],requirements:["Response latency must remain under 6 seconds for optimal conversational flow","Markdown documents must be fully responsive across both mobile and desktop screens","All API errors must fail gracefully and fall back to high-fidelity mock generators"]},roadmap:{phase1:{name:"Discovery & Core Validation",tasks:[`Conduct 10 validation interviews with target ${h}`,"Launch interactive landing page and waitlist form","Synthesize primary monetization opportunities and pricing models"]},phase2:{name:"MVP Development",tasks:["Build responsive next-gen workspace and tab controls","Integrate high-performance Gemini Flash API endpoints","Implement realistic voice advisor narration playback"]},phase3:{name:"Beta Launch & Feedback",tasks:["Deploy production build to Vercel and run private beta with 50 users","Integrate automatic markdown document download and export","Analyze voice engagement duration and feature usage metrics"]},milestones:["Milestone 1: Complete UI layout and local fallback flow (Week 2)","Milestone 2: Finalize full live Gemini and voice integrations (Week 6)","Milestone 3: Public launch on Product Hunt with 200 waitlisted signups (Week 10)"]},mvpStrategy:{launchStrategy:"Launch a single-purpose interactive sandbox as a web app. Drive initial traction by showing immediate, high-value visual blueprints to builders.",minimumFeatures:["Natural language startup ideation input text area","Structured co-founder speech synthesis playback","Premium generated documents: Validation Report, PRD, Roadmap, and MVP Strategy"],firstUsers:"Early-stage indie hackers, student operators, and product managers seeking to rapidly validate early ideas."},internalAnalysis:{concept:"A voice-first operating system that acts as a technical co-founder.",targetAudience:"Entrepreneurs, Indie Hackers, Student Founders, Product Managers",painPoints:["No access to mentors","High cost of advisory","Slow document generation"],businessModel:"Freemium SaaS with usage-based AI generation credits",marketOpportunity:"Millions of new developers seeking high-velocity launch systems",competitors:["Generic ChatGPT","Traditional PDF business planners"],strengths:["Voice native","Instant PRDs"],weaknesses:["High prompt latency"],risks:["Scale limits"],monetization:["SaaS tier","API billing"],productScope:"MVP scoping of AI, Voice, PRD, Roadmap",mvpRecommendations:"Keep database requirements thin, focus on premium generation visual tabs",technicalComplexity:"Moderate Next.js client-side streaming and speech synthesis controls",growthPotential:"High viral loops from shared blueprint exports"}}}},19142:(a,b,c)=>{"use strict";c.d(b,{Bn:()=>g,DW:()=>e,I2:()=>h,OG:()=>l,W5:()=>j,_S:()=>k,d2:()=>f,dz:()=>i});var d=c(657);let e=d.Ik({idea:d.Yj({message:"idea is required"}).min(1,"idea must not be empty").max(2e3,"idea must be at most 2000 characters")}),f=d.Ik({idea:d.Yj({message:"idea is required"}).min(1,"idea must not be empty").max(2e3,"idea must be at most 2000 characters"),userId:d.Yj().max(128).optional().default("anonymous"),mode:d.k5(["full","fast","validate_only"]).optional().default("full")}),g=d.Ik({idea:d.Yj({message:"idea is required"}).min(1,"idea must not be empty").max(2e3,"idea must be at most 2000 characters")}),h=d.Ik({query:d.Yj({message:"query is required"}).min(1,"query must not be empty").max(1e3,"query must be at most 1000 characters")}),i=d.Ik({text:d.Yj({message:"text is required"}).min(1,"text must not be empty").max(3e3,"text must be at most 3000 characters"),voiceId:d.Yj().max(64).optional().default("en-US-natalie")}),j=d.Ik({text:d.Yj({message:"text is required"}).min(1,"text must not be empty").max(3e3,"text must be at most 3000 characters"),voice:d.Yj().max(64).optional().default("advisor")}),k=d.Ik({feature:d.Yj({message:"feature is required"}).min(1,"feature must not be empty").max(64,"feature id must be at most 64 characters").regex(/^[a-zA-Z0-9_.-]+$/,"feature id contains invalid characters")});function l(a,b){let c=a.safeParse(b);return c.success?{success:!0,data:c.data}:{success:!1,error:c.error.issues.map(a=>a.message).join("; ")}}},42981:(a,b,c)=>{"use strict";c.d(b,{$g:()=>l,Eb:()=>k});var d=c(2692),e=c(67549),f=c(10641);let g=null,h=null;function i(){let a=process.env.UPSTASH_REDIS_REST_URL,b=process.env.UPSTASH_REDIS_REST_TOKEN;return a&&b?{url:a,token:b}:null}function j(a){let b=a.headers.get("x-forwarded-for");if(b)return b.split(",")[0].trim();let c=a.headers.get("x-real-ip");return c?c.trim():"anonymous"}async function k(a){let b=function(){if(g)return g;let a=i();return a?g=new d.Ratelimit({redis:new e.Qd(a),limiter:d.Ratelimit.slidingWindow(20,"60 s"),analytics:!1,prefix:"falcon:rl"}):null}();if(!b)return null;let{success:c,limit:h,remaining:k,reset:l}=await b.limit(j(a));return c?null:f.NextResponse.json({error:"Too many requests. Please slow down."},{status:429,headers:{"X-RateLimit-Limit":String(h),"X-RateLimit-Remaining":String(k),"X-RateLimit-Reset":String(l),"Retry-After":String(Math.ceil((l-Date.now())/1e3))}})}async function l(a){let b=function(){if(h)return h;let a=i();return a?h=new d.Ratelimit({redis:new e.Qd(a),limiter:d.Ratelimit.slidingWindow(10,"60 s"),analytics:!1,prefix:"falcon:rl:strict"}):null}();if(!b)return null;let{success:c,limit:g,remaining:k,reset:l}=await b.limit(j(a));return c?null:f.NextResponse.json({error:"Rate limit exceeded for AI generation. Please wait before trying again."},{status:429,headers:{"X-RateLimit-Limit":String(g),"X-RateLimit-Remaining":String(k),"X-RateLimit-Reset":String(l),"Retry-After":String(Math.ceil((l-Date.now())/1e3))}})}},78335:()=>{},96487:()=>{}};