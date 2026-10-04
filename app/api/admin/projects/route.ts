import { NextResponse } from "next/server";

type Repo = {
  id: number; name: string; full_name: string; description: string | null;
  html_url: string; homepage?: string | null; updated_at: string;
  stargazers_count: number; fork: boolean; archived: boolean; private: boolean;
  owner?: { login: string };
};

export const dynamic = "force-dynamic";

async function github<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN belum diisi di Vercel. Mode admin membutuhkan token GitHub untuk membaca repository private.");
  }

  const response = await fetch("https://api.github.com" + path, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("GitHub API: " + response.status + " " + response.statusText);
  }

  return response.json() as Promise<T>;
}

async function getAllRepos() {
  const all: Repo[] = [];

  // GitHub membatasi maksimal 100 item per halaman.
  // Ambil halaman berikutnya sampai halaman terakhir agar repository >100 tetap tampil.
  for (let page = 1; page <= 20; page += 1) {
    const batch = await github<Repo[]>(
      "/user/repos?per_page=100&page=" +
        page +
        "&sort=updated&affiliation=owner,collaborator,organization_member",
    );

    all.push(...batch);

    if (batch.length < 100) break;
  }

  return all;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Password admin salah atau belum dikonfigurasi." },
        { status: 401 },
      );
    }

    const me = await github<{ login?: string; avatar_url?: string }>("/user");
    const repos = await getAllRepos();

    // Admin boleh melihat public + private.
    // Fork dan archived tetap dikeluarkan karena halaman ini menampilkan project utama.
    const projects = repos
      .filter((r) => !r.fork && !r.archived)
      .map((r) => ({
        ...r,
        visibility: r.private ? "Private" : "Public",
        website: r.homepage || null,
      }));

    return NextResponse.json({
      authenticated: true,
      user: me,
      repos: projects,
      totalFetched: repos.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat project admin.",
      },
      { status: 500 },
    );
  }
}
