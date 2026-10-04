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
};

export const dynamic = "force-dynamic";

async function gh(path: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN belum diatur.");

  const r = await fetch("https://api.github.com" + path, {
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error("GitHub API: " + r.status + " " + r.statusText);
  }

  return r.json();
}

export async function GET() {
  try {
    const me = await gh("/user");
    const repos: Repo[] = await gh(
      "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    );

    const filtered = repos.filter((r) => !r.fork);

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
      note: "Mode sederhana: hanya membutuhkan GITHUB_TOKEN. Website diambil dari homepage repository GitHub.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal mengambil data" },
      { status: 500 },
    );
  }
}
