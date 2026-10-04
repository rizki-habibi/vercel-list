import { NextResponse } from "next/server";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage?: string | null;
  updated_at: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  owner?: { login: string };
};

export const dynamic = "force-dynamic";

async function gh(path: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token?.trim()) {
    headers.Authorization = "Bearer " + token.trim();
  }

  const r = await fetch("https://api.github.com" + path, {
    headers,
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error("GitHub API: " + r.status + " " + r.statusText);
  }

  return r.json();
}

export async function GET() {
  try {
    let me: { login?: string; avatar_url?: string } = {
      login: "rizki-habibi",
    };

    let repos: Repo[];

    if (process.env.GITHUB_TOKEN?.trim()) {
      me = await gh("/user");
      repos = await gh(
        "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      );
    } else {
      // Fallback publik: aplikasi tetap berjalan tanpa token GitHub.
      repos = await gh(
        "/users/rizki-habibi/repos?per_page=100&sort=updated&type=owner",
      );
    }

    const filtered = repos.filter((r) => !r.fork && !r.archived);

    const deploys = filtered
      .filter((r) => Boolean(r.homepage))
      .map((r) => ({
        uid: "github-homepage-" + r.id,
        name: r.name,
        url: r.homepage || undefined,
        createdAt: Date.parse(r.updated_at),
        readyState: "READY",
        repoId: String(r.id),
        meta: { githubCommitRef: "GitHub" },
      }));

    return NextResponse.json({
      user: me,
      repos: filtered,
      deploys,
      notifications: [],
      syncedAt: new Date().toISOString(),
      authenticated: Boolean(process.env.GITHUB_TOKEN?.trim()),
      note: process.env.GITHUB_TOKEN?.trim()
        ? "Terhubung ke GitHub menggunakan token."
        : "Mode publik aktif: GITHUB_TOKEN belum diisi, sehingga repository publik tetap ditampilkan.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal mengambil data GitHub" },
      { status: 500 },
    );
  }
}
