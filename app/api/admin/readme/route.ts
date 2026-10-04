import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN belum dikonfigurasi." },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const repo = url.searchParams.get("repo")?.trim() || "";
    if (!/^[^/]+\/[^/]+$/.test(repo)) {
      return NextResponse.json({ error: "Repository tidak valid." }, { status: 400 });
    }

    const response = await fetch(
      "https://api.github.com/repos/" + repo + "/readme",
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
          Authorization: "Bearer " + token,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return NextResponse.json(
        { found: false, content: "", message: "README.md belum tersedia." },
        { status: 200 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "GitHub API: " + response.status + " " + response.statusText },
        { status: response.status },
      );
    }

    const content = await response.text();
    const headings = Array.from(
      content.matchAll(/^#{1,3}\s+(.+)$/gm),
      (match) => match[1].trim(),
    ).slice(0, 12);

    const paragraphs = content
      .replace(/\x60\x60\x60[\\s\\S]*?\x60\x60\x60/g, "")
      .split(/\n\s*\n/)
      .map((part) => part.replace(/^#{1,6}\s+/gm, "").replace(/[*_>]/g, "").trim())
      .filter((part) => part.length > 40)
      .slice(0, 3);

    return NextResponse.json({
      found: true,
      content,
      headings,
      explanation: paragraphs.join(" "),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membaca README." },
      { status: 500 },
    );
  }
}
