import { createHmac } from 'node:crypto';
const secret=process.env.DEPLOY_WEBHOOK_SECRET;const endpoint=process.env.DEPLOY_WEBHOOK_URL;
if(!secret||!endpoint)throw Error('Deploy Manager credentials have not been configured.');
const url=new URL(endpoint);if(url.protocol!=='https:')throw Error('HTTPS deployment URL required.');
const payload=JSON.stringify({event:'push',branch:process.env.GITHUB_REF_NAME,repo:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA});
const signature='sha256='+createHmac('sha256',secret).update(payload).digest('hex');
const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-GitHub-Event':'push','X-Hub-Signature-256':signature},body:payload,signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Deploy Manager returned ${response.status}`);
const accepted=await response.json();if(!accepted.job?.id||!accepted.receipt)throw Error('Missing deployment receipt.');
const receipt=new URL(accepted.receipt,url.origin);if(receipt.origin!==url.origin)throw Error('Unexpected receipt origin');
console.log(`Deploy Manager accepted ${accepted.job.id}: ${receipt}`);
for(let i=0;i<240;i++){
 const r=await fetch(receipt,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`Receipt returned ${r.status}`);const {job}=await r.json();
 if(job.status==='succeeded'){console.log(`Release succeeded: ${job.id}`);process.exit(0);}
 if(['failed','rolled-back','interrupted'].includes(job.status))throw Error(`Release ${job.status}: ${job.id}`);
 await new Promise(resolve=>setTimeout(resolve,5000));
}
throw Error('Deployment did not complete within 20 minutes.');
