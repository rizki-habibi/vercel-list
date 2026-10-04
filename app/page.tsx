"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GitBranch,
  Globe,
  LayoutGrid,
  List,
  Menu,
  RefreshCw,
  Search,
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
};

type Deploy = {
  uid: string;
  name: string;
  url?: string;
  createdAt: number;
  readyState: string;
  repoId?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
};

type Project = Repo & { deployment?: Deploy };

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [deploys, setDeploys] = useState<Deploy[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [notice, setNotice] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat data");
      }

      setRepos(data.repos || []);
      setDeploys(data.deploys || []);
      setNotice(data.notifications || []);
    } catch (error) {
      setNotice([
        error instanceof Error ? error.message : "Gagal memuat data",
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const projects = useMemo<Project[]>(() => {
    const search = q.trim().toLowerCase();

    return repos
      .map((repo) => ({
        ...repo,
        deployment: deploys.find((deploy) => deploy.name === repo.name),
      }))
      .filter((project) => {
        if (!search) return true;

        return (
          project.name.toLowerCase().includes(search) ||
          project.full_name.toLowerCase().includes(search) ||
          (project.description || "").toLowerCase().includes(search)
        );
      });
  }, [repos, deploys, q]);

  const stats = {
    repos: repos.length,
    deployed: repos.filter((repo) =>
      deploys.some((deploy) => deploy.name === repo.name),
    ).length,
    stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
    failed: deploys.filter((deploy) =>
      ["ERROR", "CANCELED"].includes(deploy.readyState),
    ).length,
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <Globe size={21} />
          </div>
          <div>
            <b>Vercel List</b>
            <span>Project deployment hub</span>
          </div>
        </div>

        <nav className={menu ? "nav open" : "nav"}>
          <a href="#projects">Project</a>
          <a href="#activity">Aktivitas</a>
          <a href="#about">Tentang</a>
        </nav>

        <div className="actions">
          <button className="iconBtn" title="Notifikasi" type="button">
            <Bell size={19} />
            {notice.length > 0 && <i>{notice.length}</i>}
          </button>

          <button
            className="menuBtn"
            onClick={() => setMenu((current) => !current)}
            type="button"
            aria-label="Buka menu"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">GITHUB × VERCEL</div>
          <h1>
            Semua project.
            <br />
            <em>Satu dashboard.</em>
          </h1>
          <p>
            Repository GitHub dan deployment Vercel tampil otomatis dalam satu
            tempat. Cari, pantau status, buka website, dan lihat aktivitas
            terbaru.
          </p>

          <div className="heroBtns">
            <button className="primary" onClick={load} type="button">
              <RefreshCw size={17} className={loading ? "spin" : ""} />
              Sinkronkan sekarang
            </button>

            <a
              className="secondary"
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Buka Vercel <ExternalLink size={15} />
            </a>
          </div>
        </div>

        <div className="heroCard">
          <div className="live">
            <span />
            LIVE MONITOR
          </div>
          <strong>{stats.deployed}</strong>
          <small>deployment terdeteksi</small>
          <div className="pulse" />
        </div>
      </section>

      <section className="stats">
        <Stat icon={<GitBranch />} label="Repository" value={stats.repos} />
        <Stat icon={<Globe />} label="Ter-deploy" value={stats.deployed} />
        <Stat
          icon={<Star />}
          label="Total rating GitHub"
          value={stats.stars}
        />
        <Stat
          icon={<AlertCircle />}
          label="Deployment bermasalah"
          value={stats.failed}
        />
      </section>

      <section className="content" id="projects">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">PROJECTS</div>
            <h2>Repository & website</h2>
          </div>

          <div className="viewBtns">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              type="button"
              aria-label="Tampilan grid"
            >
              <LayoutGrid />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              type="button"
              aria-label="Tampilan daftar"
            >
              <List />
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cari repository, deskripsi, atau nama project..."
            />
          </div>

          <button className="refresh" onClick={load} type="button">
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {notice.length > 0 && (
          <div className="notices">
            {notice.map((message, index) => (
              <div key={`${message}-${index}`}>
                <AlertCircle size={16} />
                {message}
              </div>
            ))}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="empty">
            <GitBranch size={40} />
            <h3>Belum ada data project</h3>
            <p>
              Isi GITHUB_TOKEN dan VERCEL_TOKEN di environment Vercel, lalu
              deploy ulang.
            </p>
          </div>
        ) : (
          <div className={view === "grid" ? "grid" : "list"}>
            {projects.map((project) => (
              <ProjectCard key={project.id} p={project} />
            ))}
          </div>
        )}
      </section>

      <section className="activity" id="activity">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">RECENT ACTIVITY</div>
            <h2>Notifikasi terbaru</h2>
          </div>
        </div>

        <div className="timeline">
          {notice.length > 0 ? (
            notice.map((message, index) => (
              <div className="event" key={`${message}-${index}`}>
                <div className="eventIcon">
                  <Bell size={16} />
                </div>
                <div>
                  <b>{message}</b>
                  <span>Perubahan terdeteksi saat sinkronisasi terakhir.</span>
                </div>
              </div>
            ))
          ) : (
            <div className="event">
              <div className="eventIcon">
                <CheckCircle2 />
              </div>
              <div>
                <b>Sistem siap memantau</b>
                <span>
                  Deployment baru, perubahan status, dan repository yang dihapus
                  akan dicatat di sini.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer id="about">
        <div>
          <b>Vercel List</b>
          <span>Dashboard deployment pribadi berbasis TypeScript.</span>
        </div>
        <span>GitHub repository • Vercel deployment</span>
      </footer>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="stat">
      <div className="statIcon">{icon}</div>
      <div>
        <strong>{value.toLocaleString("id-ID")}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const deployment = p.deployment;
  const state = deployment?.readyState || "NOT_DEPLOYED";
  const live = deployment?.url
    ? deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`
    : null;

  return (
    <article className="card">
      <div className="cardTop">
        <div className="repoIcon">
          <GitBranch />
        </div>

        <div className="cardTitle">
          <h3>{p.name}</h3>
          <span>{p.full_name}</span>
        </div>

        <div className={`status ${state.toLowerCase()}`}>
          <span />
          {state === "READY"
            ? "Online"
            : state === "NOT_DEPLOYED"
              ? "Belum deploy"
              : state}
        </div>
      </div>

      <p>{p.description || "Tidak ada deskripsi repository."}</p>

      <div className="meta">
        <span>
          <Star size={15} />
          {p.stargazers_count} rating
        </span>
        <span>
          <GitBranch size={15} />
          {deployment?.meta?.githubCommitRef || "main"}
        </span>
        <span>
          <Clock3 size={15} />
          {new Date(p.updated_at).toLocaleDateString("id-ID")}
        </span>
      </div>

      <div className="cardBtns">
        <a href={p.html_url} target="_blank" rel="noreferrer">
          <GitBranch size={16} />
          Repository
        </a>

        {live ? (
          <a
            className="liveBtn"
            href={live}
            target="_blank"
            rel="noreferrer"
          >
            <Globe size={16} />
            Lihat website
          </a>
        ) : (
          <span className="disabled">
            <Globe size={16} />
            Website belum tersedia
          </span>
        )}
      </div>
    </article>
  );
}
