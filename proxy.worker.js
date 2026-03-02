/*
CORS Proxy

This worker is used to proxy requests to the target URL and add CORS headers to the response.

Usage:
https://your-worker.workers.dev/?url=https://api.example.com/endpoint

Example:
https://cdn.corsfix.workers.dev/?url=https://api.example.com/endpoint
*/

// ─── Config ──────────────────────────────────────────────────
// Supports: "*" (all), "*.domain.com" (wildcard), exact strings
// eslint-disable-next-line import/no-anonymous-default-export
const ORIGINS = [
    // "*",
    "http://localhost:3000", // Local development
];

// ─── Pre-compiled at module load (runs once on cold start) ───
const ALLOW_ALL = ORIGINS.includes("*");
const EXACT_ORIGINS = new Set(); // O(1) lookup
const WILDCARD_REGEXES = []; // Pre-compiled regexes
for (const p of ORIGINS) {
    if (p === "*") continue;
    if (p.includes("*")) {
        WILDCARD_REGEXES.push(new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".+") + "$"));
    } else {
        EXACT_ORIGINS.add(p);
    }
}

// ─── Inlined helpers (zero allocation where possible) ────────
function isAllowed(origin) {
    if (!origin || ALLOW_ALL) return true;
    if (EXACT_ORIGINS.has(origin)) return true;
    for (let i = 0; i < WILDCARD_REGEXES.length; i++) {
        if (WILDCARD_REGEXES[i].test(origin)) return true;
    }
    return false;
}

function resolveOrigin(origin) {
    return ALLOW_ALL ? "*" : origin || "*";
}

// CORS headers to strip from upstream (static array, allocated once)
const CORS_STRIP = [
    "access-control-allow-origin",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-allow-credentials",
    "access-control-expose-headers",
    "access-control-max-age",
];

const METHODS = "GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS";

// ─── Extract ?url= without new URL() ────────────────────────
function extractTargetUrl(requestUrl) {
    let idx = requestUrl.indexOf("?url=");
    if (idx === -1) idx = requestUrl.indexOf("&url=");
    if (idx === -1) return null;
    const start = idx + 5;
    let end = requestUrl.indexOf("&", start);
    if (end === -1) end = requestUrl.length;
    return decodeURIComponent(requestUrl.substring(start, end));
}

export default {
    async fetch(request) {
        const method = request.method;

        // ─── Preflight (fastest path) ─────────────────────────
        if (method === "OPTIONS") {
            const origin = request.headers.get("Origin");
            if (!isAllowed(origin)) return new Response(null, { status: 403 });
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": resolveOrigin(origin),
                    "Access-Control-Allow-Methods": METHODS,
                    "Access-Control-Allow-Headers":
                        request.headers.get("Access-Control-Request-Headers") || "Content-Type,Authorization",
                    "Access-Control-Max-Age": "86400",
                    Vary: "Origin",
                },
            });
        }

        // ─── URL extraction (no new URL()) ────────────────────
        const targetUrl = extractTargetUrl(request.url);

        // ─── Demo page (cached Response clone) ────────────────
        if (!targetUrl) {
            return new Response(DEMO_HTML, {
                headers: { "content-type": "text/html;charset=UTF-8", "cache-control": "public, max-age=3600" },
            });
        }

        // ─── Origin check ─────────────────────────────────────
        const origin = request.headers.get("Origin");
        if (!isAllowed(origin)) return new Response("Origin not allowed", { status: 403 });

        const allowOrigin = resolveOrigin(origin);

        try {
            const h = new Headers(request.headers);
            h.delete("host");

            const upstream = await fetch(targetUrl, {
                method,
                headers: h,
                body: method !== "GET" && method !== "HEAD" ? request.body : null,
                redirect: "follow",
            });

            const rh = new Headers(upstream.headers);
            for (let i = 0; i < CORS_STRIP.length; i++) rh.delete(CORS_STRIP[i]);
            rh.set("Access-Control-Allow-Origin", allowOrigin);
            rh.set("Access-Control-Allow-Methods", METHODS);
            rh.set("Vary", "Origin");

            return new Response(upstream.body, {
                status: upstream.status,
                statusText: upstream.statusText,
                headers: rh,
            });
        } catch (e) {
            return new Response(e.message, {
                status: 502,
                headers: {
                    "Access-Control-Allow-Origin": allowOrigin,
                    "Content-Type": "text/plain",
                },
            });
        }
    },
};

const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CORS Proxy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root{
    --bg:#09090b;
    --bg-card:rgba(255,255,255,0.025);
    --bg-elevated:rgba(255,255,255,0.055);
    --border:rgba(255,255,255,0.07);
    --border-h:rgba(255,255,255,0.14);
    --tx:#fafafa;
    --tx-2:#a1a1aa;
    --tx-3:#52525b;
    --ac:#34d399;
    --ac-g:rgba(52,211,153,0.14);
    --err:#f87171;
    --err-g:rgba(248,113,113,0.12);
    --warn:#fbbf24;
    --mono:'DM Mono',ui-monospace,'SF Mono',monospace;
    --display:'Syne',system-ui,sans-serif;
    --body:system-ui,-apple-system,sans-serif;
    --r:12px;
  }

  body{
    font-family:var(--body);background:var(--bg);color:var(--tx);
    min-height:100dvh;line-height:1.6;-webkit-font-smoothing:antialiased;
  }
  body::before{
    content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);
    background-size:72px 72px;
  }

  .wrap{max-width:760px;margin:0 auto;padding:56px 24px 96px;position:relative;z-index:1}
  @media(max-width:480px){.wrap{padding:32px 16px 64px}}

  @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .a{animation:fu .55s ease-out both}
  .a1{animation-delay:.06s}.a2{animation-delay:.12s}.a3{animation-delay:.2s}
  .a4{animation-delay:.28s}.a5{animation-delay:.36s}

  /* ── Header ── */
  header{margin-bottom:48px}
  .chip{
    display:inline-flex;align-items:center;gap:7px;
    font-family:var(--mono);font-size:10px;font-weight:500;
    letter-spacing:.06em;text-transform:uppercase;
    color:var(--ac);background:var(--ac-g);
    border:1px solid rgba(52,211,153,0.18);
    padding:5px 14px;border-radius:100px;margin-bottom:24px;
  }
  .chip::before{
    content:'';width:6px;height:6px;background:var(--ac);
    border-radius:50%;animation:pulse 2s ease-in-out infinite;
  }
  h1{
    font-family:var(--display);font-size:clamp(34px,6.5vw,56px);
    font-weight:800;line-height:1.02;letter-spacing:-.035em;
  }
  h1 em{font-style:normal;color:var(--ac)}
  .subtitle{color:var(--tx-2);font-size:15px;margin-top:16px;max-width:420px;line-height:1.65}

  /* ── Card ── */
  .card{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--r);padding:20px;backdrop-filter:blur(12px);
  }
  .input-row{display:flex;gap:8px}
  @media(max-width:520px){.input-row{flex-direction:column}}

  input[type="url"]{
    flex:1;background:rgba(255,255,255,0.035);
    border:1px solid var(--border);border-radius:8px;
    padding:12px 16px;color:var(--tx);
    font-family:var(--mono);font-size:13px;
    outline:none;transition:border-color .2s,box-shadow .2s;
  }
  input[type="url"]::placeholder{color:var(--tx-3)}
  input[type="url"]:hover{border-color:var(--border-h)}
  input[type="url"]:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-g)}

  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    background:var(--ac);color:#022c22;border:none;border-radius:8px;
    padding:12px 24px;font-size:13px;font-weight:600;
    font-family:var(--body);cursor:pointer;
    transition:all .2s;white-space:nowrap;
  }
  .btn:hover{background:#6ee7b7;box-shadow:0 0 28px var(--ac-g)}
  .btn:active{transform:scale(.97)}
  .btn:disabled{opacity:.3;pointer-events:none}
  .btn svg{width:14px;height:14px}

  .controls{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
  .controls label{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:var(--tx-3);font-weight:500}
  .pills{display:flex;gap:4px}
  .pill{
    background:transparent;border:1px solid var(--border);border-radius:6px;
    padding:5px 12px;font-size:11px;font-family:var(--mono);font-weight:500;
    color:var(--tx-2);cursor:pointer;transition:all .15s;
  }
  .pill[data-active="true"]{background:rgba(255,255,255,0.07);border-color:var(--border-h);color:var(--tx)}
  .pill:hover:not([data-active="true"]){border-color:var(--border-h)}

  /* ── Results ── */
  .results{display:grid;gap:10px;margin-top:16px}
  @media(min-width:600px){.results{grid-template-columns:1fr 1fr}}

  .r-card{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--r);overflow:hidden;
    display:flex;flex-direction:column;backdrop-filter:blur(12px);
  }
  .r-head{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 16px;border-bottom:1px solid var(--border);
  }
  .r-title{font-size:11px;font-weight:500;color:var(--tx-2);letter-spacing:.02em}

  .st{font-size:11px;font-weight:500;font-family:var(--mono);padding:3px 10px;border-radius:100px}
  .s-ok{background:rgba(52,211,153,0.1);color:var(--ac)}
  .s-err{background:var(--err-g);color:var(--err)}
  .s-idle{background:rgba(255,255,255,0.035);color:var(--tx-3)}

  .r-body{
    padding:14px 16px;flex:1;font-family:var(--mono);font-size:11px;
    color:var(--tx-2);line-height:1.7;overflow-x:auto;
    white-space:pre-wrap;word-break:break-all;
    min-height:100px;max-height:280px;overflow-y:auto;
  }
  .r-body.empty{
    display:flex;align-items:center;justify-content:center;
    color:var(--tx-3);font-family:var(--body);font-size:13px;
  }
  .r-foot{
    padding:10px 16px;border-top:1px solid var(--border);
    font-size:11px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:38px;
  }
  .tag{
    display:inline-flex;align-items:center;
    background:rgba(255,255,255,0.035);border:1px solid var(--border);
    padding:2px 8px;border-radius:4px;
    font-family:var(--mono);font-size:10px;font-weight:500;color:var(--tx-2);
  }

  /* ── Sections ── */
  .section{margin-top:56px}
  .sec-label{
    font-family:var(--mono);font-size:10px;font-weight:500;
    letter-spacing:.12em;text-transform:uppercase;color:var(--tx-3);margin-bottom:12px;
  }
  .sec-title{
    font-family:var(--display);font-size:clamp(20px,3.5vw,28px);
    font-weight:700;letter-spacing:-.025em;margin-bottom:20px;
  }

  .info-grid{display:grid;gap:8px}
  @media(min-width:600px){.info-grid{grid-template-columns:1fr 1fr}}
  .info-card{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--r);padding:20px;transition:border-color .2s;
  }
  .info-card:hover{border-color:var(--border-h)}
  .info-card h3{font-family:var(--display);font-size:14px;font-weight:700;margin-bottom:6px}
  .info-card p{font-size:13px;color:var(--tx-2);line-height:1.6}
  code{
    font-family:var(--mono);font-size:11px;
    background:rgba(52,211,153,0.07);color:var(--ac);
    padding:2px 6px;border-radius:4px;border:1px solid rgba(52,211,153,0.1);
  }

  .code-wrap{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--r);overflow:hidden;
  }
  .code-head{
    display:flex;align-items:center;gap:7px;
    padding:12px 20px;border-bottom:1px solid var(--border);
  }
  .dot{width:8px;height:8px;border-radius:50%;background:var(--border-h)}
  .code-wrap pre{
    font-family:var(--mono);font-size:12px;
    color:var(--tx-2);line-height:1.8;padding:20px;margin:0;
    overflow-x:auto;white-space:pre;
  }
  .code-wrap .kw{color:var(--ac)}
  .code-wrap .str{color:var(--warn)}
  .code-wrap .cm{color:var(--tx-3)}

  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner{
    width:12px;height:12px;border:1.5px solid var(--border);
    border-top-color:var(--ac);border-radius:50%;
    animation:spin .55s linear infinite;display:inline-block;
  }

  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border-h);border-radius:2px}
  :focus-visible{outline:2px solid var(--ac);outline-offset:2px}

  .footer{
    margin-top:64px;padding-top:20px;border-top:1px solid var(--border);
    font-size:11px;color:var(--tx-3);text-align:center;
    font-family:var(--mono);letter-spacing:.03em;
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="a">
    <div class="chip">Active</div>
    <h1>CORS <em>Proxy</em></h1>
    <p class="subtitle">Compare direct vs proxied requests side-by-side. See CORS headers resolved in real time.</p>
  </header>

  <div class="card a a1">
    <div class="input-row">
      <input type="url" id="urlInput" placeholder="https://httpbin.org/get" spellcheck="false" />
      <button class="btn" id="sendBtn" onclick="runTest()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        Send
      </button>
    </div>
    <div class="controls">
      <label>Method</label>
      <div class="pills" id="methodPills">
        <button class="pill" data-active="true" onclick="pickMethod(this)">GET</button>
        <button class="pill" onclick="pickMethod(this)">POST</button>
        <button class="pill" onclick="pickMethod(this)">PUT</button>
        <button class="pill" onclick="pickMethod(this)">DELETE</button>
        <button class="pill" onclick="pickMethod(this)">HEAD</button>
      </div>
    </div>
  </div>

  <div class="results a a2">
    <div class="r-card">
      <div class="r-head">
        <span class="r-title">Direct</span>
        <span class="st s-idle" id="directBadge">Idle</span>
      </div>
      <div class="r-body empty" id="directBody">Hit Send to test</div>
      <div class="r-foot" id="directFoot"></div>
    </div>
    <div class="r-card">
      <div class="r-head">
        <span class="r-title">Via proxy</span>
        <span class="st s-idle" id="proxyBadge">Idle</span>
      </div>
      <div class="r-body empty" id="proxyBody">Hit Send to test</div>
      <div class="r-foot" id="proxyFoot"></div>
    </div>
  </div>

  <div class="section a a3">
    <p class="sec-label">Documentation</p>
    <h2 class="sec-title">How it works</h2>
    <div class="info-grid">
      <div class="info-card">
        <h3>Wildcard origins</h3>
        <p>Supports <code>*.domain.com</code> patterns matching any subdomain at any depth, with or without scheme.</p>
      </div>
      <div class="info-card">
        <h3>Full method support</h3>
        <p>Proxies <code>GET</code> <code>POST</code> <code>PUT</code> <code>DELETE</code> <code>PATCH</code> <code>HEAD</code> with automatic preflight.</p>
      </div>
      <div class="info-card">
        <h3>Header management</h3>
        <p>Forwards request headers, strips upstream CORS headers, and injects its own to prevent conflicts.</p>
      </div>
      <div class="info-card">
        <h3>Edge deployed</h3>
        <p>Runs on Cloudflare Workers at 300+ PoPs worldwide. Near-zero latency overhead.</p>
      </div>
    </div>
  </div>

  <div class="section a a4">
    <p class="sec-label">Integration</p>
    <h2 class="sec-title">Usage</h2>
    <div class="code-wrap">
      <div class="code-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <pre><span class="cm">// JavaScript</span>
<span class="kw">const</span> data = <span class="kw">await</span> fetch(
  <span class="str">\\\`\\\${PROXY}?url=\\\${encodeURIComponent(url)}\\\`</span>
).<span class="kw">then</span>(r => r.json());

<span class="cm">// cURL</span>
<span class="kw">curl</span> <span class="str">"https://&lt;worker&gt;.workers.dev?url=https://api.example.com/data"</span></pre>
    </div>
  </div>

  <div class="footer a a5">Cloudflare Workers &middot; CORS Proxy</div>

</div>

<script>
let method="GET";

function pickMethod(el){
  document.querySelectorAll("#methodPills .pill").forEach(p=>p.dataset.active="false");
  el.dataset.active="true";method=el.textContent;
}

function proxyUrl(t){return location.origin+"/?url="+encodeURIComponent(t)}
function trunc(s,n=2000){return s&&s.length>n?s.slice(0,n)+"\\n…truncated":s||""}

function setCard(pfx,{status,badge,body,time,statusCode,cors}){
  const b=document.getElementById(pfx+"Badge");
  const bd=document.getElementById(pfx+"Body");
  const ft=document.getElementById(pfx+"Foot");
  b.textContent=badge;
  b.className="st "+(status==="ok"?"s-ok":status==="err"?"s-err":"s-idle");
  bd.textContent=body;
  bd.className="r-body"+(body?"":" empty");
  let h="";
  if(time!==undefined)h+='<span class="tag">'+time+'ms</span>';
  if(statusCode)h+='<span class="tag">'+statusCode+'</span>';
  if(cors!==undefined)h+='<span class="tag" style="color:'+(cors?"var(--ac)":"var(--err)")+'">ACAO: '+(cors||"none")+'</span>';
  ft.innerHTML=h;
}

function setLoading(pfx){
  document.getElementById(pfx+"Badge").innerHTML='<span class="spinner"></span>';
  document.getElementById(pfx+"Badge").className="st s-idle";
  const bd=document.getElementById(pfx+"Body");
  bd.textContent="";bd.className="r-body empty";
  document.getElementById(pfx+"Foot").innerHTML="";
}

async function doFetch(url){
  const t0=performance.now();
  try{
    const res=await fetch(url,{method});
    const elapsed=Math.round(performance.now()-t0);
    const ct=res.headers.get("content-type")||"";
    let body;
    if(method==="HEAD"){
      body=[...res.headers.entries()].map(([k,v])=>k+": "+v).join("\\n");
    }else if(ct.includes("json")){
      body=JSON.stringify(await res.json(),null,2);
    }else{
      body=await res.text();
    }
    const cors=res.headers.get("access-control-allow-origin");
    return{status:res.ok?"ok":"err",badge:res.status+" "+res.statusText,body:trunc(body),time:elapsed,statusCode:res.status,cors};
  }catch(e){
    return{status:"err",badge:"Failed",body:"Error: "+e.message+"\\n\\nBrowsers block cross-origin requests without proper CORS headers. The proxy solves this.",time:Math.round(performance.now()-t0),statusCode:null,cors:null};
  }
}

async function runTest(){
  const input=document.getElementById("urlInput");
  let url=input.value.trim();
  if(!url){url="https://httpbin.org/get";input.value=url}
  document.getElementById("sendBtn").disabled=true;
  setLoading("direct");setLoading("proxy");
  const[d,p]=await Promise.all([doFetch(url),doFetch(proxyUrl(url))]);
  setCard("direct",d);setCard("proxy",p);
  document.getElementById("sendBtn").disabled=false;
}

document.getElementById("urlInput").addEventListener("keydown",e=>{if(e.key==="Enter")runTest()});
</script>
</body>
</html>`;
