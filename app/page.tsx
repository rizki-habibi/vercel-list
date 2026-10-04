"use client";
import {useEffect,useMemo,useState} from "react";
import {Bell,ExternalLink,Github,Globe,Search,RefreshCw,Star,Trash2,LayoutGrid,List,CheckCircle2,AlertCircle,Clock3,GitBranch,Menu,X} from "lucide-react";

type Repo={id:number,name:string,full_name:string,description:string|null,html_url:string,updated_at:string,stargazers_count:number,fork:boolean,archived:boolean};
type Deploy={uid:string,name:string,url?:string,createdAt:number,readyState:string,repoId?:string,meta?:{githubCommitSha?:string;githubCommitRef?:string}};
type Project=Repo & {deployment?:Deploy};

const mockRepos:Repo[]=[];
const mockDeploys:Deploy[]=[];

export default function Home(){
 const [repos,setRepos]=useState<Repo[]>(mockRepos),[deploys,setDeploys]=useState<Deploy[]>(mockDeploys);
 const [q,setQ]=useState(""),[loading,setLoading]=useState(false),[view,setView]=useState<"grid"|"list">("grid"),[notice,setNotice]=useState<string[]>([]);
 const [menu,setMenu]=useState(false);

 const load=async()=>{
  setLoading(true);
  try{
   const r=await fetch("/api/projects",{cache:"no-store"}); const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Gagal memuat data");
   setRepos(d.repos||[]); setDeploys(d.deploys||[]); setNotice(d.notifications||[]);
  }catch(e){setNotice([e instanceof Error?e.message:"Gagal memuat data"]);}finally{setLoading(false);}
 };
 useEffect(()=>{load()},[]);
 const projects=useMemo<Project[]>(()=>repos.map(r=>({...r,deployment:deploys.find(d=>d.name===r.name)})).filter(p=>{const s=q.toLowerCase();return !s||p.name.toLowerCase().includes(s)||(p.description||"").toLowerCase().includes(s)}),[repos,deploys,q]);
 const stats={repos:repos.length,deployed:repos.filter(r=>deploys.some(d=>d.name===r.name)).length,stars:repos.reduce((n,r)=>n+r.stargazers_count,0),failed:deploys.filter(d=>["ERROR","CANCELED"].includes(d.readyState)).length};

 return <main>
  <header className="topbar"><div className="brand"><div className="logo"><Globe size={21}/></div><div><b>Vercel List</b><span>Project deployment hub</span></div></div>
   <nav className={menu?"nav open":"nav"}><a href="#projects">Project</a><a href="#activity">Aktivitas</a><a href="#about">Tentang</a></nav>
   <div className="actions"><button className="iconBtn" title="Notifikasi"><Bell size={19}/><i>{notice.length}</i></button><button className="menuBtn" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div>
  </header>
  <section className="hero"><div><div className="eyebrow">GITHUB × VERCEL</div><h1>Semua project.<br/><em>Satu dashboard.</em></h1><p>Repository GitHub dan deployment Vercel tampil otomatis dalam satu tempat. Cari, pantau status, buka website, dan lihat aktivitas terbaru.</p>
   <div className="heroBtns"><button className="primary" onClick={load}><RefreshCw size={17} className={loading?"spin":""}/> Sinkronkan sekarang</button><a className="secondary" href="https://vercel.com/dashboard" target="_blank">Buka Vercel <ExternalLink size={15}/></a></div>
  </div><div className="heroCard"><div className="live"><span></span> LIVE MONITOR</div><strong>{stats.deployed}</strong><small>deployment terdeteksi</small><div className="pulse"></div></div></section>
  <section className="stats"><Stat icon={<Github/>} label="Repository" value={stats.repos}/><Stat icon={<Globe/>} label="Ter-deploy" value={stats.deployed}/><Stat icon={<Star/>} label="Total rating GitHub" value={stats.stars}/><Stat icon={<AlertCircle/>} label="Deployment bermasalah" value={stats.failed}/></section>
  <section className="content" id="projects"><div className="sectionHead"><div><div className="eyebrow">PROJECTS</div><h2>Repository & website</h2></div><div className="viewBtns"><button className={view==="grid"?"active":""} onClick={()=>setView("grid")}><LayoutGrid/></button><button className={view==="list"?"active":""} onClick={()=>setView("list")}><List/></button></div></div>
   <div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari repository, deskripsi, atau nama project..."/></div><button className="refresh" onClick={load}><RefreshCw size={17}/> Refresh</button></div>
   {notice.length>0&&<div className="notices">{notice.map((n,i)=><div key={i}><AlertCircle size={16}/>{n}</div>)}</div>}
   {projects.length===0?<div className="empty"><Github size={40}/><h3>Belum ada data project</h3><p>Isi GITHUB_TOKEN dan VERCEL_TOKEN di environment Vercel, lalu deploy ulang.</p></div>:
   <div className={view==="grid"?"grid":"list"}>{projects.map(p=><ProjectCard key={p.id} p={p}/>)}</div>}
  </section>
  <section className="activity" id="activity"><div className="sectionHead"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Notifikasi terbaru</h2></div></div><div className="timeline">{notice.length?notice.map((n,i)=><div className="event" key={i}><div className="eventIcon"><Bell size={16}/></div><div><b>{n}</b><span>Perubahan terdeteksi saat sinkronisasi terakhir.</span></div></div>):<div className="event"><div className="eventIcon"><CheckCircle2/></div><div><b>Sistem siap memantau</b><span>Deployment baru, perubahan status, dan repository yang dihapus akan dicatat di sini.</span></div></div>}</div></section>
  <footer id="about"><div><b>Vercel List</b><span>Dashboard deployment pribadi berbasis TypeScript.</span></div><span>GitHub repository • Vercel deployment</span></footer>
 </main>
}
function Stat({icon,label,value}:{icon:React.ReactNode,label:string,value:number}){return <div className="stat"><div className="statIcon">{icon}</div><div><strong>{value.toLocaleString("id-ID")}</strong><span>{label}</span></div></div>}
function ProjectCard({p}:{p:Project}){const d=p.deployment;const state=d?.readyState||"NOT_DEPLOYED";const live=d?.url?(d.url.startsWith("http")?d.url:"https://"+d.url):null;return <article className="card"><div className="cardTop"><div className="repoIcon"><Github/></div><div className="cardTitle"><h3>{p.name}</h3><span>{p.full_name}</span></div><div className={"status "+state.toLowerCase()}><span></span>{state==="READY"?"Online":state==="NOT_DEPLOYED"?"Belum deploy":state}</div></div><p>{p.description||"Tidak ada deskripsi repository."}</p><div className="meta"><span><Star size={15}/>{p.stargazers_count} rating</span><span><GitBranch size={15}/>{d?.meta?.githubCommitRef||"main"}</span><span><Clock3 size={15}/>{new Date(p.updated_at).toLocaleDateString("id-ID")}</span></div><div className="cardBtns"><a href={p.html_url} target="_blank"><Github size={16}/> Repository</a>{live?<a className="liveBtn" href={live} target="_blank"><Globe size={16}/> Lihat website</a>:<span className="disabled"><Globe size={16}/> Website belum tersedia</span>}</div></article>}
