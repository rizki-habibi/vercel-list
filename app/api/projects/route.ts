import {NextResponse} from "next/server";
type Repo={id:number,name:string,full_name:string,description:string|null,html_url:string,updated_at:string,stargazers_count:number,fork:boolean,archived:boolean};
export const dynamic="force-dynamic";
async function gh(path:string){const token=process.env.GITHUB_TOKEN; if(!token) throw new Error("GITHUB_TOKEN belum diatur."); const r=await fetch("https://api.github.com"+path,{headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},cache:"no-store"}); if(!r.ok) throw new Error("GitHub API: "+r.status+" "+r.statusText); return r.json();}
async function vc(path:string){const token=process.env.VERCEL_TOKEN; if(!token) throw new Error("VERCEL_TOKEN belum diatur."); const url="https://api.vercel.com"+path+(process.env.VERCEL_TEAM_ID?(path.includes("?")?"&":"?")+"teamId="+process.env.VERCEL_TEAM_ID:""); const r=await fetch(url,{headers:{Authorization:"Bearer "+token},cache:"no-store"}); if(!r.ok) throw new Error("Vercel API: "+r.status+" "+r.statusText); return r.json();}
export async function GET(){try{
 const me=await gh("/user"); const repos:Repo[]=await gh("/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member");
 const filtered=repos.filter(r=>!r.fork);
 const data=await vc("/v9/projects?limit=100"); const projects=data.projects||[];
 const deploys:any[]=[];
 for(const p of projects.slice(0,100)){try{const x=await vc("/v6/deployments?projectId="+encodeURIComponent(p.id)+"&limit=1"); const d=x.deployments?.[0]; if(d) deploys.push({uid:d.uid,name:p.name,url:d.url,createdAt:d.createdAt,readyState:d.readyState,repoId:p.link?.repoId,meta:d.meta});}catch{}}
 const currentNames=new Set(deploys.map(d=>d.name));
 const notifications:string[]=[];
 for(const d of deploys){const repo=filtered.find(r=>r.name===d.name); if(!repo) notifications.push("Deployment \""+d.name+"\" ada di Vercel tetapi repository GitHub tidak ditemukan atau sudah dihapus.");}
 const oldKey=""; void oldKey;
 return NextResponse.json({user:me, repos:filtered, deploys, notifications, syncedAt:new Date().toISOString(), note:"Data diambil langsung dari GitHub dan Vercel."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal mengambil data"}, {status:500});}}