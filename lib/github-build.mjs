import { validate } from './engine.mjs';
export function checkRepository(repository){if(!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/.test(repository))throw Error('Use an owner/repository name, such as your-name/magic-keys.');return repository;}
export async function githubRequest(repository,token,path,options={},fetcher=fetch){
 checkRepository(repository);if(!token.trim())throw Error('A GitHub token is required to start your build.');
 const response=await fetcher(`https://api.github.com/repos/${repository}${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token.trim()}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}});
 if(!response.ok){if(response.status===401)throw Error('GitHub rejected this token.');if(response.status===403)throw Error('GitHub denied this action. Check Actions read/write permission and your API rate limit.');if(response.status===404)throw Error('Repository or workflow not found. Fork Magic Keys, enable Actions, and select that repository in your token permissions.');throw Error(`GitHub request failed (${response.status}).`);}
 return response.status===204?null:response.json();
}
export async function dispatchBuild(repository,token,project,mode,fetcher=fetch){
 validate(project);if(!['via','vial','qmk','zmk'].includes(mode))throw Error('Choose a firmware mode.');
 if((mode==='zmk')!==(project.board==='urchin'))throw Error('Firmware mode does not match the hardware.');
 const repo=await githubRequest(repository,token,'',{},fetcher);
 const requestId=crypto.randomUUID();
 await githubRequest(repository,token,'/actions/workflows/firmware.yml/dispatches',{method:'POST',body:JSON.stringify({ref:repo.default_branch,inputs:{mode,project:JSON.stringify(project),request_id:requestId}})},fetcher);
 return {requestId,repository,startedAt:Date.now(),status:'queued',url:`https://github.com/${repository}/actions/workflows/firmware.yml`};
}
export async function readBuild(build,token,fetcher=fetch){
 const {workflow_runs:runs}=await githubRequest(build.repository,token,'/actions/workflows/firmware.yml/runs?event=workflow_dispatch&per_page=30',{},fetcher);
 const run=runs.find(r=>r.display_title.includes(build.requestId));
 if(!run)return {...build,status:'queued'};
 const next={...build,status:run.status,conclusion:run.conclusion,url:run.html_url,runId:run.id};
 if(run.status==='completed'&&run.conclusion==='success'){
  const {artifacts}=await githubRequest(build.repository,token,`/actions/runs/${run.id}/artifacts`,{},fetcher);
  next.artifacts=artifacts.filter(a=>a.name.endsWith('-flash')&&!a.expired).map(a=>({id:a.id,name:a.name,url:`${run.html_url}/artifacts/${a.id}`}));
 }
 return next;
}
