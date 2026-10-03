// Browser-local presentation data. No external services or patient data are used.
const dateAfter = n => new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const seed = () => ({
  patients:[{id:1,name:'Asha Verma',age:52,abha:'91-1000-2000-3001',cancer:'breast',doctor:'dr.rao'},{id:2,name:'Ravi Kumar',age:61,abha:'91-1000-2000-3002',cancer:'lung',doctor:'dr.rao'},{id:3,name:'Meera Nair',age:47,abha:null,cancer:'breast',doctor:'dr.mehta'}],
  consents:[{id:1,patient_id:1,kind:'abdm_data',purpose:'Care continuity',status:'GRANTED',valid_until:dateAfter(30)}],
  records:[{id:1,patient_id:1,date:dateAfter(-20),type:'DiagnosticReport',title:'Histopathology report',source:'Hospital A',data:{histology:'Invasive ductal carcinoma',stage:'II',biomarkers:{ER:'positive',PR:'positive'}}}],
  consultations:[{id:1,patient_id:1,doctor:'Dr. Rao',signed_at:dateAfter(-2),signed:true,note:{diagnosis:{cancer_type:'breast',stage:'II'},biomarkers:{ER:'positive'},medicines:[{generic:'letrozole',strength_mg:2.5,freq_per_day:1,duration_days:30,route:'oral'}],tests:['NGS'],advice:'Review with your care team.',followup_date:dateAfter(14)}}],
  appointments:[{id:1,patient_id:1,date:dateAfter(14),status:'scheduled',gcal_id:'CAL-1001'}],
  messages:[{id:1,patient_id:1,kind:'reminder_3d',direction:'out',scheduled_for:dateAfter(11),status:'scheduled',body:'Your follow-up appointment is approaching. Please confirm your availability.'}],
  alerts:[{id:1,patient_id:2,patient_name:'Ravi Kumar',created:dateAfter(-1),text:'Patient requested a call from the care team.',resolved:false}],
  labs:[{id:1,name:'Genomics Delhi',city:'Delhi',accreditation:'NABL',tat_days:10},{id:2,name:'Oncolab Mumbai',city:'Mumbai',accreditation:'NABL',tat_days:7},{id:3,name:'Gene Bengaluru',city:'Bengaluru',accreditation:'CAP',tat_days:12}],
  panels:[{id:1,lab_id:1,name:'Breast Core',price:18000,genes:'ER,PR,HER2,BRCA1,BRCA2',sample:'tissue'},{id:2,lab_id:2,name:'Comprehensive Solid',price:45000,genes:'ER,PR,HER2,BRCA1,BRCA2,PIK3CA,ESR1,EGFR,ALK,ROS1,KRAS,BRAF,MET,RET,PD-L1',sample:'tissue'},{id:3,lab_id:3,name:'Liquid Lung',price:30000,genes:'EGFR,ALK,ROS1,KRAS,BRAF,MET,RET,PD-L1',sample:'blood'}],
  biomarkers:['ER','PR','HER2','BRCA1','BRCA2','PIK3CA','ESR1'].map((gene,id)=>({id,cancer:'breast',gene})).concat(['EGFR','ALK','ROS1','KRAS','BRAF','MET','RET','PD-L1'].map((gene,id)=>({id:id+7,cancer:'lung',gene}))),orders:[],audit:[],optins:{1:true}
});
let care;
try { care=JSON.parse(localStorage.getItem('alocc-care-v1'))||seed(); } catch { care=seed(); }
function persist(){localStorage.setItem('alocc-care-v1',JSON.stringify(care));}
function nextId(rows){return Math.max(0,...rows.map(x=>x.id))+1;}
const profiles={'dr.rao':{role:'doctor',name:'Dr. Rao'},'dr.mehta':{role:'doctor',name:'Dr. Mehta'},asha:{role:'patient',name:'Asha Verma',patient_id:1},ravi:{role:'patient',name:'Ravi Kumar',patient_id:2},meera:{role:'patient',name:'Meera Nair',patient_id:3},admin:{role:'admin',name:'Administrator'}};
function extractText(text){
  const low=text.toLowerCase(), uncertain=[], medicines=[];
  for(const generic of ['letrozole','tamoxifen','anastrozole','capecitabine','erlotinib','gefitinib','osimertinib','ondansetron','pantoprazole']){
    const sentence=text.split(/[.!?]\s+|\n/).find(s=>s.toLowerCase().includes(generic)); if(!sentence)continue;
    const mg=sentence.match(/(\d+(?:\.\d+)?)\s*mg/i),duration=sentence.match(/(\d+)\s*(day|week|month)/i),frequency=/twice|\bbid\b|\bbd\b/i.test(sentence)?2:/thrice|three times/i.test(sentence)?3:/once|\bod\b/i.test(sentence)?1:null;
    const m={generic,strength_mg:mg?+mg[1]:null,freq_per_day:frequency,duration_days:duration?+duration[1]*({day:1,week:7,month:30}[duration[2].toLowerCase()]):null,route:'oral'};
    for(const k of ['strength_mg','freq_per_day','duration_days'])if(!m[k])uncertain.push(`medicines.${medicines.length}.${k}`);medicines.push(m);
  }
  const biomarkers={};for(const g of ['ER','PR','HER2','BRCA1','BRCA2','EGFR','ALK','PD-L1']){const m=text.match(new RegExp(`\\b${g}\\b[\\s:=]*(positive|negative|mutated|amplified)`,'i'));if(m)biomarkers[g]=m[1].toLowerCase();}
  const cancer=low.includes('breast')?'breast':low.includes('lung')?'lung':null,stage=text.match(/stage\s*(IV|III|II|I)\b/i),follow=text.match(/follow[- ]?up.*?(\d+)\s*(day|week|month)/i);
  if(!cancer)uncertain.push('diagnosis.cancer_type');if(!stage)uncertain.push('diagnosis.stage');if(follow)uncertain.push('followup_date');
  return {complaints:text.split('.')[0],diagnosis:{cancer_type:cancer,stage:stage?stage[1].toUpperCase():null,histology:null},biomarkers,medicines,tests:['NGS','CBC','MRI','PET-CT'].filter(t=>low.includes(t.toLowerCase())),advice:'',followup_date:follow?dateAfter(+follow[1]*({day:1,week:7,month:30}[follow[2].toLowerCase()])):null,followup_text:follow?follow[0]:'',fields_uncertain:uncertain,source:'Structured extraction'};
}
async function localApi(path,method='GET',b={}){
  const [route,query='']=path.split('?'),parts=route.split('/').filter(Boolean),id=+parts[1],pid=+parts[1];
  if(route==='/login'){const p=profiles[b.username];if(!p)throw Error('Choose a valid care workspace.');return {...p,token:b.username};}
  if(!profiles[S.token])throw Error('Choose a care workspace first.');
  const visible=care.patients.filter(p=>S.role==='doctor'?p.doctor===S.token:S.role==='patient'?p.id===S.pid:true);
  if(parts[0]==='patients'&&parts[1]&&!visible.some(p=>p.id===pid))throw Error('This patient is outside your care workspace.');
  const record=()=>{care.audit.unshift({id:nextId(care.audit),ts:new Date().toISOString(),user:S.token,action:method+' '+route,patient_id:parts[0]==='patients'?pid:null});persist();};
  if(method==='POST')record();
  let result;
  if(route==='/patients')result=visible;
  else if(parts[0]==='patients'){
    const p=care.patients.find(p=>p.id===pid);
    if(parts.length===2)result={...p,consents:care.consents.filter(c=>c.patient_id===pid)};
    else switch(parts[2]){
      case 'abha':if(!/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(b.abha))throw Error('Use ABHA format 91-1234-5678-9012.');p.abha=b.abha;result={ok:true};break;
      case 'consents':{const c={id:nextId(care.consents),patient_id:pid,kind:'abdm_data',status:'REQUESTED',purpose:'Care continuity: view prior records',valid_until:dateAfter(30)};care.consents.unshift(c);result=c;break;}
      case 'timeline':result=care.records.filter(r=>r.patient_id===pid).sort((a,b)=>b.date.localeCompare(a.date));break;
      case 'prescriptions':result=care.consultations.filter(c=>c.patient_id===pid&&c.signed);break;
      case 'appointments':case 'messages':result=care[parts[2]].filter(a=>a.patient_id===pid);break;
      case 'orders':result=care.orders.filter(o=>o.patient_id===pid);break;
      case 'whatsapp':care.optins[pid]=b.optin;if(!b.optin)care.messages.filter(m=>m.patient_id===pid&&m.status==='scheduled').forEach(m=>m.status='cancelled');result={optin:b.optin};break;
      case 'reply':{const urgent=/3|help|fever|pain|breath/i.test(b.text);care.messages.push({id:nextId(care.messages),patient_id:pid,kind:'checkin_reply',direction:'in',body:b.text,status:'received',scheduled_for:dateAfter(0)});if(urgent)care.alerts.push({id:nextId(care.alerts),patient_id:pid,patient_name:p.name,created:dateAfter(0),text:'Patient requested attention: '+b.text,resolved:false});result={urgent};break;}
    }
  } else if(parts[0]==='consents'){
    const c=care.consents.find(c=>c.id===id);if(!c||S.role!=='patient'||c.patient_id!==S.pid)throw Error('Only the patient can decide consent.');
    c.status={approve:'GRANTED',deny:'DENIED',revoke:'REVOKED'}[b.action];
    if(b.action==='approve'&&!care.records.some(r=>r.patient_id===c.patient_id&&r.source==='ABDM'))care.records.push({id:nextId(care.records),patient_id:c.patient_id,type:'DiagnosticReport',date:dateAfter(-10),title:'Prior hospital report',source:'ABDM',data:{histology:'Histopathology summary',biomarkers:{HER2:'negative'}}});
    if(b.action==='revoke')care.records=care.records.filter(r=>r.patient_id!==c.patient_id||r.source!=='ABDM');result={status:c.status};
  } else if(route==='/consultations'){
    if(!b.transcript?.trim())throw Error('Enter a consultation transcript.');const c={id:nextId(care.consultations),patient_id:b.patient_id,draft:extractText(b.transcript),signed:false,doctor:S.name};care.consultations.push(c);result=c;
  } else if(parts[0]==='consultations'){
    const c=care.consultations.find(c=>c.id===id);if(!c)throw Error('Prescription not found.');
    if(parts[2]==='sign'){
      if(c.signed)throw Error('This note has already been signed.');if(b.medicines.some(m=>!m.strength_mg||m.strength_mg<=0||!Number.isInteger(m.freq_per_day)||m.freq_per_day<1||!Number.isInteger(m.duration_days)||m.duration_days<1))throw Error('Check medicine strength, frequency and duration before signing.');
      c.note=b;c.signed=true;c.signed_at=dateAfter(0);care.records.push({id:nextId(care.records),patient_id:c.patient_id,date:dateAfter(0),type:'Prescription',title:'Prescription by '+S.name,source:'Care team',data:{medicines:b.medicines.map(m=>`${m.generic} ${m.strength_mg} mg`)}});
      if(b.followup_date){care.appointments.push({id:nextId(care.appointments),patient_id:c.patient_id,date:b.followup_date,status:'scheduled',gcal_id:'CAL-'+c.id});if(care.optins[c.patient_id])care.messages.push({id:nextId(care.messages),patient_id:c.patient_id,kind:'followup',direction:'out',scheduled_for:b.followup_date,status:'scheduled',body:'You have a follow-up appointment on '+b.followup_date+'.'});}result={ok:true};
    }else if(parts[2]==='prices')result=c.note.medicines.map(m=>{const units=m.freq_per_day*m.duration_days,offers=['Care Pharmacy','Health Pharmacy','Value Pharmacy'].map((provider,i)=>({provider,product:m.generic,unit_price:14-i*2,total:(14-i*2)*units,units,delivery_days:i+2,available:true,source:'Illustrative catalogue',fetched_at:dateAfter(0)})).sort((a,b)=>a.total-b.total);return {...m,found:true,units,offers,alternatives:[{product:m.generic+' (generic)',best_total:4.5*units,saving:offers[0].total-4.5*units}],cheapest:offers[0]};});
    else if(parts[2]==='prescription.html')result=`<!doctype html><html><head><title>ALOCC Prescription</title><style>body{font:16px system-ui;max-width:800px;margin:40px auto;line-height:1.7}h1{color:#137c86}</style></head><body><h1>ALOCC-ABHA Linked Oncology Care Copilot</h1><h2>Prescription #${c.id}</h2><p>${esc(care.patients.find(p=>p.id===c.patient_id).name)} · ${esc(c.doctor)} · ${c.signed_at}</p>${c.note.medicines.map(m=>`<p>${esc(m.generic)} ${m.strength_mg} mg — ${m.freq_per_day} per day for ${m.duration_days} days</p>`).join('')}<p>Tests: ${esc(c.note.tests.join(', '))}</p><p>Follow-up: ${esc(c.note.followup_date||'To be scheduled')}</p><button onclick="window.print()">Print prescription</button></body></html>`;
  }else if(parts[0]==='appointments'){const a=care.appointments.find(a=>a.id===id);if(parts[2]==='cancel')a.status='cancelled';else{if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date))throw Error('Enter a date as YYYY-MM-DD.');a.date=b.date;}result=a;
  }else if(route==='/messages/run-due'){let sent=0;care.messages.forEach(m=>{if(m.status==='scheduled'&&m.scheduled_for<=dateAfter(b.advance_days)&&visible.some(p=>p.id===m.patient_id)){m.status='sent';sent++;}});result={sent};
  }else if(parts[0]==='alerts'){if(method==='POST'){care.alerts.find(a=>a.id===id).resolved=true;result={ok:true};}else result=care.alerts.filter(a=>!a.resolved&&visible.some(p=>p.id===a.patient_id));
  }else if(route==='/labs/match'){
    const params=new URLSearchParams(query),p=care.patients.find(p=>p.id===+params.get('patient_id')),recommended=care.biomarkers.filter(x=>x.cancer===p.cancer).map(x=>x.gene),tested=[...new Set(care.records.filter(r=>r.patient_id===p.id).flatMap(r=>Object.keys(r.data.biomarkers||{})).concat(care.consultations.filter(c=>c.patient_id===p.id&&c.signed).flatMap(c=>Object.keys(c.note.biomarkers||{}))))],gap=recommended.filter(g=>!tested.includes(g));
    const ranked=care.panels.filter(x=>!params.get('sample')||x.sample===params.get('sample')).map(x=>{const lab=care.labs.find(l=>l.id===x.lab_id),covered=gap.filter(g=>x.genes.split(',').includes(g));return {...x,lab:lab.name,city:lab.city,accreditation:lab.accreditation,tat_days:lab.tat_days,coverage_pct:gap.length?Math.round(100*covered.length/gap.length):0,reasoning:`Covers ${covered.length} of ${gap.length} missing biomarkers`};}).filter(x=>x.coverage_pct>0).sort((a,b)=>b.coverage_pct-a.coverage_pct||a.price-b.price);result={cancer:p.cancer,recommended,tested,gap,ranked,disclaimer:'Panel suggestions require clinician review.'};
  }else if(route==='/orders'){const p=care.panels.find(x=>x.id===b.panel_id),o={id:nextId(care.orders),patient_id:b.patient_id,panel:p.name,lab:care.labs.find(l=>l.id===p.lab_id).name,genes:p.genes,summary:'Biomarker testing referral',status:'ordered'};care.orders.push(o);result=o;
  }else if(parts[0]==='orders'){const o=care.orders.find(o=>o.id===id);o.status='completed';care.records.push({id:nextId(care.records),patient_id:o.patient_id,date:dateAfter(0),type:'DiagnosticReport',title:o.panel,source:o.lab,data:{biomarkers:b.results}});result={ok:true};
  }else if(route==='/admin/data')result={labs:care.labs,panels:care.panels.map(p=>({...p,lab:care.labs.find(l=>l.id===p.lab_id).name})),biomarkers:care.biomarkers};
  else if(route==='/admin/audit')result=care.audit;
  else if(route==='/admin/panels'){if(!b.name||!b.genes||!(b.price>0))throw Error('Provide panel name, genes and a positive price.');care.panels.push({...b,id:nextId(care.panels)});result={ok:true};}
  else if(route==='/admin/biomarkers'){if(!b.cancer||!b.gene)throw Error('Provide cancer type and gene.');care.biomarkers.push({...b,cancer:b.cancer.toLowerCase(),gene:b.gene.toUpperCase(),id:nextId(care.biomarkers)});result={ok:true};}
  if(result===undefined)throw Error('This action is unavailable.');persist();return structuredClone(result);
}
