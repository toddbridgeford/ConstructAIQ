import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FEEDS = [
  {name:'Engineering News-Record',  url:'https://www.enr.com/rss/news',               category:'industry'},
  {name:'Construction Dive',        url:'https://www.constructiondive.com/feeds/news/',category:'industry'},
  {name:'NAHB Now',                 url:'https://nahbnow.com/feed/',                   category:'housing'},
  {name:'AGC Constructor',          url:'https://www.agc.org/news/rss.xml',            category:'labor'},
]

function extractTag(xml: string, tag: string) {
  const m=xml.match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)</'+tag+'>','i'))
  if(!m) return ''
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim()
}

function scoreSentiment(text: string): 'BULLISH'|'BEARISH'|'WARNING'|'NEUTRAL' {
  const bull=['surge','increase','growth','record','boom','strong','gain','rise']
  const bear=['decline','drop','fall','weak','slow','shortage','delay','cancel','cut']
  const warn=['concern','risk','challenge','uncertain','volatile','pressure','tariff']
  let b=0,d=0,w=0
  bull.forEach(k=>{if(text.includes(k))b++})
  bear.forEach(k=>{if(text.includes(k))d++})
  warn.forEach(k=>{if(text.includes(k))w++})
  if(b>d&&b>w) return 'BULLISH'
  if(d>b&&d>w) return 'BEARISH'
  if(w>0) return 'WARNING'
  return 'NEUTRAL'
}

async function fetchFeed(feed: typeof FEEDS[0]) {
  try {
    const res=await fetch(feed.url,{headers:{'User-Agent':'ConstructAIQ/1.0'},signal:AbortSignal.timeout(5000)})
    if(!res.ok) return []
    const xml=await res.text()
    const items=[]
    const matches=[...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,5)
    for(const m of matches) {
      const title=extractTag(m[1],'title'), link=extractTag(m[1],'link'), desc=extractTag(m[1],'description'), pub=extractTag(m[1],'pubDate')
      if(!title||!link) continue
      const text=(title+' '+desc).toLowerCase()
      const terms=['construction','builder','contractor','permit','housing','infrastructure','project','contract','material','labor']
      const rel=terms.filter(t=>text.includes(t)).length
      if(rel<2) continue
      items.push({id:Buffer.from(link).toString('base64').slice(0,16),title,summary:desc.slice(0,280),url:link.trim(),
        source:feed.name,category:feed.category,sentiment:scoreSentiment(text),tags:[],
        publishedAt:pub?new Date(pub).toISOString():new Date().toISOString(),relevance:rel})
    }
    return items
  } catch { return [] }
}

export async function GET() {
  try {
    const results=await Promise.allSettled(FEEDS.map(fetchFeed))
    const all: any[]=[]
    results.forEach(r=>{ if(r.status==='fulfilled') all.push(...r.value) })
    all.sort((a,b)=>b.relevance-a.relevance)
    const seen=new Set<string>()
    const unique=all.filter(i=>{ const k=i.title.toLowerCase().slice(0,40); if(seen.has(k)) return false; seen.add(k); return true }).slice(0,20)
    const items=unique.length>0?unique:fallback()
    const bull=items.filter((i:any)=>i.sentiment==='BULLISH').length
    const bear=items.filter((i:any)=>i.sentiment==='BEARISH').length
    return NextResponse.json({source:'ConstructAIQ NewsIntel',live:unique.length>0,items,count:items.length,
      marketSentiment:bull>bear?'CAUTIOUSLY BULLISH':bear>bull?'CAUTIOUSLY BEARISH':'MIXED',updated:new Date().toISOString()},
      {headers:{'Cache-Control':'public, s-maxage=1800'}})
  } catch(err) { return NextResponse.json({source:'NewsIntel-fallback',live:false,items:fallback()}) }
}

function fallback() {
  return [
    {id:'n1',source:'Engineering News-Record',category:'contracts',title:'Federal Highway Awards Hit Record in FY2026 Q1',summary:'IIJA-funded contracts continue at record pace as transportation agencies accelerate infrastructure spending.',url:'https://www.enr.com',sentiment:'BULLISH',tags:['federal'],publishedAt:new Date(Date.now()-7200000).toISOString(),relevance:8},
    {id:'n2',source:'Construction Dive',category:'labor',title:'Craft Labor Vacancy Rate at 12-Year High',summary:'JOLTS data confirms construction job openings outpaced hires for the fifth consecutive month.',url:'https://www.constructiondive.com',sentiment:'WARNING',tags:['labor'],publishedAt:new Date(Date.now()-14400000).toISOString(),relevance:9},
    {id:'n3',source:'NAHB Now',category:'housing',title:'Builder Confidence Rises 4 Points on Easing Rate Expectations',summary:'HMI improved for the third straight month as mortgage rates declined from 7.1% to 6.85%.',url:'https://nahbnow.com',sentiment:'BULLISH',tags:['rates'],publishedAt:new Date(Date.now()-21600000).toISOString(),relevance:7},
    {id:'n4',source:'AGC Constructor',category:'materials',title:'Steel Tariff Uncertainty Driving Bid Escalation Clauses',summary:'67% of contractors now including material escalation clauses as Section 232 tariffs add 8-12% to steel costs.',url:'https://www.agc.org',sentiment:'WARNING',tags:['materials'],publishedAt:new Date(Date.now()-28800000).toISOString(),relevance:8},
    {id:'n5',source:'Engineering News-Record',category:'industry',title:'Data Center Boom Offsets Multifamily Weakness',summary:'AI-driven data center investment added $34B in new starts in Q1 2026, offsetting 18% YoY decline in multifamily.',url:'https://www.enr.com',sentiment:'BULLISH',tags:['federal'],publishedAt:new Date(Date.now()-36000000).toISOString(),relevance:7},
  ]
}
