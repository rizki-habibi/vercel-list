import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
type VercelProject={id:string;name:string;framework?:string|null;updatedAt?:number;link?:{type?:string;repo?:string;org?:string;repoId?:number}|null};
type VercelDeployment={uid?:string;id?:string;name?:string;url?:string|null;createdAt?:number;state?:string;readyState?:string;target?:string|null;meta?:Record<string,string|undefined>};
async function vercel<T>(path:string):Promise<T>{
 const token=process.env.VERCEL_TOKEN?.trim();
 if(!token) throw new Error("VERCEL_TOKEN belum dikonfigurasi.");
 const r=await fetch("https://api.vercel.com"+path,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store"});
 if(!r.ok){const body=await r.text().catch(()=> "");throw new Error("Vercel API "+r.status+": "+(body||r.statusText));}
 return r.json() as Promise<T>;
}
const tq=()=>process.env.VERCEL_TEAM_ID?.trim()?"&teamId="+encodeURIComponent(process.env.VERCEL_TEAM_ID.trim()):"";
export async function GET(){
 try{
  const p=await vercel<{projects?:VercelProject[]}>("/v9/projects?limit=100"+tq());
  const list=p.projects??[];
  const batches=await Promise.all(list.map(async x=>{try{const d=await vercel<{deployments?:VercelDeployment[]}>("/v6/deployments?projectId="+encodeURIComponent(x.id)+"&limit=5"+tq());return d.deployments??[]}catch{return []}}));
  const deployments=batches.flat();
  const failed=deployments.filter(d=>["ERROR","CANCELED","BLOCKED"].includes(String(d.readyState??d.state??"").toUpperCase()));
  return NextResponse.json({configured:true,projects:list.map(x=>({...x,deployment:deployments.find(d=>d.name===x.name)??null})),deployments,failed,syncedAt:new Date().toISOString()});
 }catch(error){return NextResponse.json({configured:false,projects:[],deployments:[],failed:[],error:error instanceof Error?error.message:"Gagal membaca Vercel."});}
}
