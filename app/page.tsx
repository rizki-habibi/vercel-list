"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  GitBranch,
  Globe,
  LayoutGrid,
  List,
  Menu,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  homepage?: string | null;
  size: number;
  language: string | null;
  deploymentProvider?: string | null;
  contentState?: "EMPTY" | "MINIMAL" | "FILLED";
};

type Deploy = {
  uid: string;
  name: string;
  url?: string;
  createdAt: number;
  readyState: string;
  repoId?: string;
  meta?: { githubCommitSha?: string; githubCommitRef?: string };
};

type Project = Repo & { deployment?: Deploy };

type Provider = "Semua" | "Vercel" | "Railway" | "Netlify" | "Render" | "Fly.io" | "Cloudflare" | "GitHub Pages" | "Firebase" | "Lainnya";
type ContentFilter = "Semua" | "Terisi" | "Minim" | "Kosong";
type DeployFilter = "Semua" | "Terdeploy" | "Belum deploy";

function auditRepo(repo: Repo) {
  let score = 0;
  const reasons: string[] = [];
  if (repo.size > 0) { score += 45; reasons.push("Repository memiliki isi Git"); }
  else reasons.push("Repository tidak memiliki data Git");
  if (repo.language) { score += 20; reasons.push("Bahasa " + repo.language + " terdeteksi"); }
  if (repo.description?.trim()) { score += 15; reasons.push("Deskripsi project tersedia"); }
  if (repo.homepage) { score += 10; reasons.push("Alamat website tersedia"); }
  if (repo.stargazers_count > 0) { score += 5; reasons.push("Memiliki rating GitHub"); }
  const recent = Date.now() - Date.parse(repo.updated_at) < 180 * 24 * 60 * 60 * 1000;
  if (recent) { score += 5; reasons.push("Aktif diperbarui"); }
  const status = repo.size === 0 ? "KOSONG" : score < 55 ? "MINIM" : "TERISI";
  return { score: Math.min(score, 100), status, reasons };
}

function providerMatch(provider: string | null | undefined, selected: Provider) {
  if (selected === "Semua") return true;
  if (selected === "Lainnya") return Boolean(provider && !["Vercel","Railway","Netlify","Render","Fly.io","Cloudflare","GitHub Pages","Firebase"].includes(provider));
  return provider === selected;
}

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [deploys, setDeploys] = useState<Deploy[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [notice, setNotice] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [provider, setProvider] = useState<Provider>("Semua");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("Semua");
  const [deployFilter, setDeployFilter] = useState<DeployFilter>("Semua");
  const [websiteOnly, setWebsiteOnly] = useState<"Semua" | "Ada website" | "Tanpa website">("Semua");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memuat data");
      setRepos(data.repos || []);
      setDeploys(data.deploys || []);
      setNotice(data.notifications || []);
    } catch (error) {
      setNotice([error instanceof Error ? error.message : "Gagal memuat data"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const allProjects = useMemo<Project[]>(() => repos.map((repo) => ({
    ...repo,
    deployment: deploys.find((deploy) => deploy.name === repo.name),
  })), [repos, deploys]);

  const audits = useMemo(() => allProjects.map((project) => ({
    project,
    audit: auditRepo(project),
  })), [allProjects]);

  const projects = useMemo<Project[]>(() => {
    const search = q.trim().toLowerCase();
    return allProjects.filter((project) => {
      const audit = auditRepo(project);
      const deployed = Boolean(project.deployment);
      const matchesSearch = !search || [project.name, project.full_name, project.description || "", project.language || "", project.deploymentProvider || ""].join(" ").toLowerCase().includes(search);
      const matchesContent = contentFilter === "Semua" || (contentFilter === "Terisi" && audit.status === "TERISI") || (contentFilter === "Minim" && audit.status === "MINIM") || (contentFilter === "Kosong" && audit.status === "KOSONG");
      const matchesDeploy = deployFilter === "Semua" || (deployFilter === "Terdeploy" && deployed) || (deployFilter === "Belum deploy" && !deployed);
      const matchesWebsite = websiteOnly === "Semua" || (websiteOnly === "Ada website" && Boolean(project.homepage)) || (websiteOnly === "Tanpa website" && !project.homepage);
      return matchesSearch && providerMatch(project.deploymentProvider, provider) && matchesContent && matchesDeploy && matchesWebsite;
    });
  }, [allProjects, q, provider, contentFilter, deployFilter, websiteOnly]);

  const stats = {
    repos: repos.length,
    deployed: allProjects.filter((p) => p.deployment).length,
    stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
    empty: audits.filter((x) => x.audit.status === "KOSONG").length,
    minimal: audits.filter((x) => x.audit.status === "MINIM").length,
    filled: audits.filter((x) => x.audit.status === "TERISI").length,
    providers: new Set(repos.map((r) => r.deploymentProvider).filter(Boolean)).size,
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="logo"><Globe size={21} /></div>
          <div><b>Deployment Hub</b><span>GitHub × semua platform deployment</span></div>
        </div>
        <nav className={menu ? "nav open" : "nav"}>
          <a href="#projects">Project</a><a href="#smart-audit">Analisis</a><a href="#activity">Aktivitas</a><a href="/admin" className="adminNav">Admin</a>
        </nav>
        <div className="actions">
          <button className="iconBtn" title="Notifikasi" type="button"><Bell size={19} />{notice.length > 0 && <i>{notice.length}</i>}</button>
          <button className="menuBtn" onClick={() => setMenu((v) => !v)} type="button" aria-label="Buka menu">{menu ? <X /> : <Menu />}</button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">MULTI-PLATFORM DEPLOYMENT MONITOR</div>
          <h1>Semua project.<br /><em>Satu pusat pantauan.</em></h1>
          <p>Deteksi repository, website, dan platform deployment dari project GitHub. Tidak dibatasi Vercel: Railway, Netlify, Render, Fly.io, Cloudflare, GitHub Pages, Firebase, dan provider lain yang dapat dikenali ikut ditampilkan.</p>
          <div className="heroBtns">
            <button className="primary" onClick={load} type="button"><RefreshCw size={17} className={loading ? "spin" : ""} />Sinkronkan sekarang</button>
            <a className="secondary" href="/admin"><ShieldCheck size={15} />Panel admin</a>
          </div>
        </div>
        <div className="heroCard">
          <div className="live"><span />LIVE MONITOR</div>
          <strong>{stats.deployed}</strong>
          <small>deployment terdeteksi</small>
          <div className="providerMini"><Server size={14} /> {stats.providers} platform terdeteksi</div>
          <div className="pulse" />
        </div>
      </section>

      <section className="stats">
        <Stat icon={<GitBranch />} label="Repository" value={stats.repos} />
        <Stat icon={<Globe />} label="Ter-deploy" value={stats.deployed} />
        <Stat icon={<Star />} label="Total rating GitHub" value={stats.stars} />
        <Stat icon={<Sparkles />} label="Project terisi" value={stats.filled} />
      </section>

      <section className="smartAudit" id="smart-audit">
        <div className="auditHead">
          <div><div className="eyebrow">SMART PROJECT AUDIT</div><h2>Analisis cerdas isi repository</h2><p>Sistem menilai metadata GitHub untuk menemukan project yang terisi, minim, atau benar-benar kosong.</p></div>
          <div className="auditBadge"><Sparkles size={16} /> ANALISIS OTOMATIS</div>
        </div>
        <div className="auditStats">
          <div className="auditFilled"><b>{stats.filled}</b><span>Terisi</span></div>
          <div className="auditMinimal"><b>{stats.minimal}</b><span>Minim</span></div>
          <div className="auditEmpty"><b>{stats.empty}</b><span>Kosong</span></div>
          <div><b>{stats.providers}</b><span>Platform</span></div>
        </div>
        <div className="auditList">
          {audits.sort((a,b) => b.audit.score - a.audit.score).slice(0, 8).map(({project,audit}) => (
            <div className="auditRow" key={project.id}>
              <div className="auditIcon"><Sparkles size={16}/></div>
              <div className="auditMain"><b>{project.name}</b><span>{audit.status} · {audit.score}/100 · {project.deploymentProvider || "Platform belum terdeteksi"}</span></div>
              <div className="auditReasons">{audit.reasons.slice(0,2).map((r,i)=><span key={i}>{r}</span>)}</div>
            </div>
          ))}
          {audits.length === 0 && <div className="empty">Belum ada repository untuk dianalisis.</div>}
        </div>
      </section>

      <section className="content" id="projects">
        <div className="sectionHead">
          <div><div className="eyebrow">PROJECTS</div><h2>Repository, website & deployment</h2></div>
          <div className="viewBtns">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} type="button" aria-label="Tampilan grid"><LayoutGrid /></button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} type="button" aria-label="Tampilan daftar"><List /></button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search"><Search size={18}/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari repository, bahasa, platform, atau deskripsi..." /></div>
          <button className="refresh" onClick={load} type="button"><RefreshCw size={17}/> Refresh</button>
        </div>

        <div className="filterPanel">
          <div className="filterTitle"><Filter size={15}/> Filter project</div>
          <FilterSelect label="Platform" value={provider} onChange={(v) => setProvider(v as Provider)} options={["Semua","Vercel","Railway","Netlify","Render","Fly.io","Cloudflare","GitHub Pages","Firebase","Lainnya"]} />
          <FilterSelect label="Isi" value={contentFilter} onChange={(v) => setContentFilter(v as ContentFilter)} options={["Semua","Terisi","Minim","Kosong"]} />
          <FilterSelect label="Deployment" value={deployFilter} onChange={(v) => setDeployFilter(v as DeployFilter)} options={["Semua","Terdeploy","Belum deploy"]} />
          <FilterSelect label="Website" value={websiteOnly} onChange={(v) => setWebsiteOnly(v as typeof websiteOnly)} options={["Semua","Ada website","Tanpa website"]} />
          <button className="clearFilter" onClick={() => { setProvider("Semua"); setContentFilter("Semua"); setDeployFilter("Semua"); setWebsiteOnly("Semua"); setQ(""); }} type="button">Reset</button>
        </div>

        <div className="resultInfo"><span><b>{projects.length}</b> dari {repos.length} project</span><span>Provider aktif: <b>{provider}</b></span></div>

        {notice.length > 0 && <div className="notices">{notice.map((message,index)=><div key={index}><AlertCircle size={16}/>{message}</div>)}</div>}

        {projects.length === 0 ? <div className="empty"><GitBranch size={40}/><h3>Project tidak ditemukan</h3><p>Coba ubah kata pencarian atau filter.</p></div> :
          <div className={view === "grid" ? "grid" : "list"}>{projects.map((project)=><ProjectCard key={project.id} p={project}/>)}</div>}
      </section>

      <section className="activity" id="activity">
        <div className="sectionHead"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Aktivitas deployment</h2></div></div>
        <div className="timeline">
          {notice.length > 0 ? notice.map((message,index)=><div className="event" key={index}><div className="eventIcon"><Bell size={16}/></div><div><b>{message}</b><span>Perubahan terdeteksi saat sinkronisasi terakhir.</span></div></div>) :
            <div className="event"><div className="eventIcon"><CheckCircle2/></div><div><b>Sistem siap memantau</b><span>Provider deployment dan kondisi repository akan dianalisis dari data yang tersedia.</span></div></div>}
        </div>
      </section>

      <footer><div><b>Deployment Hub</b><span>Dashboard deployment multi-platform berbasis TypeScript.</span></div><span>GitHub • Vercel • Railway • platform lainnya</span></footer>
    </main>
  );
}

function FilterSelect({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:string[]}) {
  return <label className="filterSelect"><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((option)=><option key={option}>{option}</option>)}</select></label>;
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:number}) {
  return <div className="stat"><div className="statIcon">{icon}</div><div><strong>{value.toLocaleString("id-ID")}</strong><span>{label}</span></div></div>;
}

function ProjectCard({p}:{p:Project}) {
  const deployment = p.deployment;
  const state = deployment?.readyState || "NOT_DEPLOYED";
  const live = p.homepage || deployment?.url || null;
  const normalizedLive = live ? (live.startsWith("http") ? live : "https://" + live) : null;
  const audit = auditRepo(p);
  return <article className="card">
    <div className="cardTop">
      <div className="repoIcon"><GitBranch/></div>
      <div className="cardTitle"><h3>{p.name}</h3><span>{p.full_name}</span></div>
      <div className={`status ${state.toLowerCase()}`}><span/>{state === "READY" ? "Online" : state === "NOT_DEPLOYED" ? "Belum deploy" : state}</div>
    </div>
    <div className="badges">
      <span className={`providerBadge ${(p.deploymentProvider || "none").toLowerCase().replace(/[^a-z0-9]+/g,"-")}`}><Server size={12}/>{p.deploymentProvider || "Belum terdeteksi"}</span>
      <span className={`contentBadge ${audit.status.toLowerCase()}`}><Sparkles size={12}/>{audit.status} · {audit.score}</span>
      {p.language && <span className="languageBadge">{p.language}</span>}
    </div>
    {normalizedLive ? <div className="sitePreview">
      <div className="previewBar"><span className="previewDot"/><span className="previewDot"/><span className="previewDot"/><span className="previewUrl">{normalizedLive.replace(/^https?:\/\//,"").replace(/\/$/,"")}</span><a href={normalizedLive} target="_blank" rel="noreferrer" aria-label="Buka website"><ExternalLink size={14}/></a></div>
      <iframe src={normalizedLive} title={`Preview website ${p.name}`} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"/>
      <div className="previewFallback"><span>Preview website</span><a href={normalizedLive} target="_blank" rel="noreferrer">Buka website</a></div>
    </div> : <div className="noPreview"><Globe size={25}/><span>Belum ada alamat website yang terdeteksi</span></div>}
    <p>{p.description || "Tidak ada deskripsi repository."}</p>
    <div className="meta"><span><Star size={15}/>{p.stargazers_count} rating</span><span><GitBranch size={15}/>{deployment?.meta?.githubCommitRef || "GitHub"}</span><span><Clock3 size={15}/>{new Date(p.updated_at).toLocaleDateString("id-ID")}</span></div>
    <div className="cardBtns"><a href={p.html_url} target="_blank" rel="noreferrer"><GitBranch size={16}/>Repository</a>{normalizedLive ? <a className="liveBtn" href={normalizedLive} target="_blank" rel="noreferrer"><Globe size={16}/>Lihat website</a> : <span className="disabled"><Globe size={16}/>Website belum tersedia</span>}</div>
  </article>;
}
