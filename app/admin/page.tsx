"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  GitBranch,
  Globe,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage?: string | null;
  updated_at: string;
  stargazers_count: number;
  private: boolean;
  visibility: string;
  website: string | null;
};

type ReadmeData = {
  found: boolean;
  content: string;
  headings?: string[];
  explanation?: string;
  message?: string;
  error?: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readme, setReadme] = useState<ReadmeData | null>(null);
  const [readmeRepo, setReadmeRepo] = useState("");
  const [readmeLoading, setReadmeLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Login gagal");
      setRepos(d.repos || []);
      setAdminPassword(password);
      setAuthenticated(true);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal sinkronisasi");
      setRepos(d.repos || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal sinkronisasi");
    } finally {
      setLoading(false);
    }
  }

  async function openReadme(repo: Repo) {
    setReadmeRepo(repo.full_name);
    setReadme(null);
    setReadmeLoading(true);
    try {
      const r = await fetch("/api/admin/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repo.full_name, password: adminPassword }),
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal membaca README.");
      setReadme(d);
    } catch (e) {
      setReadme({ found: false, content: "", error: e instanceof Error ? e.message : "Gagal membaca README." });
    } finally {
      setReadmeLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) =>
      [r.name, r.full_name, r.description || "", r.visibility]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [repos, query]);

  if (!authenticated) {
    return (
      <main className="adminLogin">
        <div className="adminLoginCard">
          <div className="adminShield"><ShieldCheck size={28} /></div>
          <div className="eyebrow">ADMIN AREA</div>
          <h1>Panel Admin</h1>
          <p>Masuk untuk melihat repository public dan private yang dapat diakses akun GitHub.</p>
          <form onSubmit={(e) => { e.preventDefault(); void login(); }}>
            <label>Password admin</label>
            <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
            {error && <div className="adminError">{error}</div>}
            <button className="primary adminSubmit" disabled={loading || !password} type="submit">
              <ShieldCheck size={17} /> {loading ? "Memeriksa..." : "Masuk ke Admin"}
            </button>
          </form>
          <a className="backHome" href="/">Kembali ke dashboard</a>
        </div>
      </main>
    );
  }

  const privateCount = repos.filter((r) => r.private).length;
  const publicCount = repos.length - privateCount;

  return (
    <main className="adminPage">
      <header className="adminTopbar">
        <div className="brand">
          <div className="logo"><ShieldCheck size={21} /></div>
          <div><b>Vercel List Admin</b><span>Semua repository GitHub</span></div>
        </div>
        <button className="secondary" onClick={() => { setAuthenticated(false); setRepos([]); }} type="button">
          <LogOut size={16} /> Keluar
        </button>
      </header>

      <section className="adminContent">
        <div className="adminHeading">
          <div>
            <div className="eyebrow">ADMIN DASHBOARD</div>
            <h1>Semua project</h1>
            <p>Repository public dan private yang dapat diakses token GitHub.</p>
          </div>
          <button className="refresh" onClick={() => void sync()} disabled={loading} type="button">
            <RefreshCw className={loading ? "spin" : ""} size={16} /> Sinkronkan
          </button>
        </div>

        {error && <div className="adminError adminPageError">{error}</div>}

        <div className="adminStats">
          <div><GitBranch /><strong>{repos.length}</strong><span>Total project</span></div>
          <div><Globe /><strong>{publicCount}</strong><span>Public</span></div>
          <div><Lock /><strong>{privateCount}</strong><span>Private</span></div>
          <div><Star /><strong>{repos.reduce((a, r) => a + r.stargazers_count, 0)}</strong><span>Total rating</span></div>
        </div>

        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari semua project..." />
          </div>
        </div>

        <div className="adminGrid">
          {filtered.map((r) => (
            <article className="adminCard" key={r.id}>
              <div className="adminCardTop">
                <div className="repoIcon"><GitBranch /></div>
                <div className="cardTitle"><h3>{r.name}</h3><span>{r.full_name}</span></div>
                <span className={r.private ? "visibility private" : "visibility public"}>
                  {r.private ? <Lock size={12} /> : <Globe size={12} />} {r.visibility}
                </span>
              </div>

              <p>{r.description || "Tidak ada deskripsi repository."}</p>

              <div className="meta">
                <span><Star size={14} />{r.stargazers_count}</span>
                <span>{new Date(r.updated_at).toLocaleDateString("id-ID")}</span>
              </div>

              <div className="cardBtns">
                <a href={r.html_url} target="_blank" rel="noreferrer"><GitBranch size={15} /> Repository</a>
                <button className="readmeBtn" onClick={() => void openReadme(r)} type="button">
                  <BookOpen size={15} /> README
                </button>
                {r.website
                  ? <a className="liveBtn" href={r.website} target="_blank" rel="noreferrer"><Globe size={15} /> Website</a>
                  : <span className="disabled"><Globe size={15} /> Belum ada website</span>}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty"><GitBranch size={35} /><h3>Project tidak ditemukan</h3></div>
        )}
      </section>

      {readmeRepo && (
        <div className="readmeOverlay" role="dialog" aria-modal="true" aria-label={"README " + readmeRepo}>
          <div className="readmeModal">
            <div className="readmeHeader">
              <div>
                <div className="eyebrow">DOKUMENTASI PROJECT</div>
                <h2>{readmeRepo}</h2>
              </div>
              <button className="iconClose" onClick={() => { setReadmeRepo(""); setReadme(null); }} type="button" aria-label="Tutup">
                <X size={19} />
              </button>
            </div>

            {readmeLoading ? (
              <div className="readmeLoading"><RefreshCw className="spin" size={22} /> Membaca README dari GitHub...</div>
            ) : readme?.error ? (
              <div className="adminError">{readme.error}</div>
            ) : !readme?.found ? (
              <div className="empty readmeEmpty"><BookOpen size={35} /><h3>README belum tersedia</h3><p>{readme?.message || "Repository ini belum memiliki README.md."}</p></div>
            ) : (
              <div className="readmeBody">
                <section className="readmeExplanation">
                  <div className="eyebrow">PENJELASAN SINGKAT</div>
                  <p>{readme.explanation || "README tersedia, tetapi belum memiliki paragraf penjelasan yang dapat diringkas otomatis."}</p>
                  {readme.headings?.length ? (
                    <div className="readmeTopics">
                      <b>Isi utama</b>
                      <div>{readme.headings.map((h, i) => <span key={i}>{h}</span>)}</div>
                    </div>
                  ) : null}
                </section>
                <section className="readmeRaw">
                  <div className="readmeRawHead"><BookOpen size={16} /> README.md</div>
                  <pre>{readme.content}</pre>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
