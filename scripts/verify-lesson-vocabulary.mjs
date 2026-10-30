// Primary dictionary corroboration. Stores bibliographic/phonetic facts, never whole dictionary pages.
import fs from "node:fs";
const words=JSON.parse(fs.readFileSync("src/data/lesson-words.json","utf8"));
const cache=new Map();
const overrides={resume:"resume_2",contact:"contact_2",host:"host_2",exchange:"exchange_2",sponsor:"sponsor_2",interests:"interest_1",hobbies:"hobby",earrings:"earring",gloves:"glove",sandals:"sandal","be into":"be_1","miss a train":"miss_1","catch up with":"catch_1","hear from":"hear","bring along":"bring","work in a team":"team_1","make a list":"list_1","take care of":"care_1","financial independence":"independence","non-profit organisation":"non-profit","local speciality":"speciality","tourist information centre":"tourist-information-centre"};
const strip=s=>s?.replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").trim();
Object.assign(overrides,{apologise:"apologize",cancelled:"cancel_1",delayed:"delay_1",hardworking:"hard-working",organise:"organize",socialise:"socialize"});
Object.assign(overrides,{present:"present_2",overspend:"overspend_2"});
async function lookup(slug){
  if(cache.has(slug))return cache.get(slug);
  const promise=(async()=>{
    const url=`https://www.oxfordlearnersdictionaries.com/definition/english/${slug}`;
    try{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});const html=await r.text();const headword=strip(html.match(/<h1[^>]*class="headword"[^>]*>(.*?)<\/h1>/s)?.[1]);
      if(!r.ok||!headword)return null;
      return {url:r.url,headword,pos:strip(html.match(/<span class="pos"[^>]*>(.*?)<\/span>/s)?.[1]),ukIpa:strip(html.match(/class="phons_br"[\s\S]*?<span class="phon"[^>]*>(.*?)<\/span>/)?.[1]),cefr:html.match(/class="ox3ksym_([a-c][12])"/)?.[1]?.toUpperCase()??null};
    }catch{return null;}
  })();cache.set(slug,promise);return promise;
}
const records=[];let cursor=0;
const previous=fs.existsSync("docs/lesson-vocabulary-references.json")?new Map(JSON.parse(fs.readFileSync("docs/lesson-vocabulary-references.json","utf8")).filter(r=>r.reference).map(r=>[r.id,r])):new Map();
async function worker(){while(cursor<words.length){const w=words[cursor++];if(previous.has(w.id)&&!['present','overspend'].includes(w.word)){records.push(previous.get(w.id));continue;}const slug=overrides[w.word]??w.word.toLowerCase().replaceAll(" ","-");let ref=await lookup(slug);
  if(!ref){const parts=w.word.toLowerCase().split(/[ -]+/).filter(x=>!['a','an','the','to','of','for','in','up','out','on','with','get','be'].includes(x));for(const part of [...parts].reverse()){ref=await lookup(part);if(ref)break;}}
  records.push({id:w.id,word:w.word,reference:ref,checkedAt:"2026-10-30"});
}}
await Promise.all([worker(),worker(),worker()]);records.sort((a,b)=>a.id.localeCompare(b.id));
fs.writeFileSync("docs/lesson-vocabulary-references.json",JSON.stringify(records,null,2)+"\n");
const missing=records.filter(r=>!r.reference);
console.log(JSON.stringify({total:words.length,corroborated:words.length-missing.length,missing:missing.map(r=>r.word)}));
console.log(JSON.stringify(records.filter(r=>r.reference&&r.reference.headword.toLowerCase()===r.word.toLowerCase()).map(r=>({word:r.word,pos:r.reference.pos,ipa:r.reference.ukIpa,cefr:r.reference.cefr})),null,1));
