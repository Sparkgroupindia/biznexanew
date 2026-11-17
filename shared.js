/* BizNexa: GitHub Pages -> Apps Script JSONP reads + hidden-form writes (no CORS/preflight). */
(function(){'use strict';
const conf=window.BX_CONFIG||{};
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₹'+(Number(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
const phone=s=>String(s||'').replace(/\D/g,'').replace(/^0+/,'');
const wa=(num,msg)=>'https://wa.me/'+(phone(num).length===10?'91'+phone(num):phone(num))+'?text='+encodeURIComponent(msg||'');
const getParams=()=>new URLSearchParams(location.search);
const site=()=>location.href.slice(0,location.href.lastIndexOf('/')+1);
const cardLink=id=>site()+'card.html?id='+encodeURIComponent(id);
const catalogLink=id=>site()+'catalog.html?id='+encodeURIComponent(id);
const invoiceLink=(id,token)=>site()+'invoice.html?id='+encodeURIComponent(id)+'&token='+encodeURIComponent(token);
const token=(role='client')=>localStorage.getItem('bx_'+role+'_token')||'';
const setToken=(role,v)=>localStorage.setItem('bx_'+role+'_token',v);
const clearToken=role=>localStorage.removeItem('bx_'+role+'_token');
const themes=['amber','ocean','emerald','rose','slate','violet','royal','crimson','mint','midnight'];
const theme=t=>document.documentElement.dataset.theme=themes.includes(t)?t:'amber';
const rand=()=>{if(crypto&&crypto.randomUUID)return crypto.randomUUID().replace(/-/g,'');return 'r'+Date.now()+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)};
const ensure=()=>{if(!/^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec(?:\?.*)?$/.test(conf.API_URL||''))throw Error('config.js में Apps Script /exec URL पेस्ट करें।');};
const get=(action,payload={},ms=25000)=>new Promise((resolve,reject)=>{
  try{ensure()}catch(e){reject(e);return}
  const cb='bxcb_'+rand().replace(/[^a-zA-Z0-9_]/g,'');const sc=document.createElement('script');let finished=false;
  const timeout=setTimeout(()=>done(Error('Server response timeout. Retry.')),ms);
  function done(err,data){if(finished)return;finished=true;clearTimeout(timeout);delete window[cb];sc.remove();err?reject(err):resolve(data)}
  window[cb]=(response)=>{if(!response||!response.ok)done(Error(response?.error||'Server error'));else done(null,response.data)};
  sc.onerror=()=>done(Error('Cannot reach Apps Script. Check deployment permissions and config URL.'));
  sc.src=conf.API_URL+(conf.API_URL.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+'&payload='+encodeURIComponent(JSON.stringify(payload))+'&callback='+cb+'&_='+Date.now();
  document.head.appendChild(sc);
});
const post=(action,payload={},ms=65000)=>new Promise((resolve,reject)=>{
  try{ensure()}catch(e){reject(e);return}
  const rid=rand()+rand();const frame=document.createElement('iframe');frame.name='bxframe_'+rid;frame.style.display='none';frame.setAttribute('title','Background request');
  const form=document.createElement('form');form.method='POST';form.action=conf.API_URL;form.target=frame.name;form.style.display='none';
  function input(k,v){const el=document.createElement('input');el.name=k;el.value=v;form.appendChild(el)}
  input('action',action);input('rid',rid);input('payload',JSON.stringify(payload));
  document.body.append(frame,form);let ended=false;const started=Date.now();let timer;
  function finish(err,data){if(ended)return;ended=true;clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),100);err?reject(err):resolve(data)}
  async function poll(){if(ended)return;if(Date.now()-started>ms){finish(Error('Write response timeout. Check dashboard before repeating to avoid duplicate orders.'));return}
    try{const r=await get('receipt',{rid},12000);if(r){if(!r.ok)finish(Error(r.error||'Server error'));else finish(null,r.data);return}}
    catch(e){ /* keep polling: the form request might still be executing */ }
    timer=setTimeout(poll,1000);
  }
  form.submit();timer=setTimeout(poll,850);
});
function notice(msg,type='info'){let box=$('#toast');if(!box){box=document.createElement('div');box.id='toast';document.body.appendChild(box)}box.textContent=msg;box.className='toast '+type;box.style.display='block';clearTimeout(window.__bxToast);window.__bxToast=setTimeout(()=>box.style.display='none',4300)}
function busy(btn,state,label){if(!btn)return;if(state){btn.dataset.oldLabel=btn.textContent;btn.disabled=true;btn.textContent=label||'Please wait…'}else{btn.disabled=false;btn.textContent=btn.dataset.oldLabel||btn.textContent}}
async function copy(v){try{await navigator.clipboard.writeText(v);notice('Link copied','success')}catch(e){prompt('Copy this link:',v)}}
function placeholder(label,emoji='🏬'){return `<div class="image-placeholder"><span>${emoji}</span><small>${escape(label||'No image')}</small></div>`}
function imageHTML(src,label,klass=''){if(!/^https:\/\//.test(src||''))return placeholder(label);return `<img class="${escape(klass)}" src="${escape(src)}" alt="${escape(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=&quot;image-placeholder&quot;>🖼️</div>')">`}
function modal(html){const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML='<div class="modal"><button class="modal-close" aria-label="Close">✕</button>'+html+'</div>';document.body.appendChild(wrap);wrap.querySelector('.modal-close').onclick=()=>wrap.remove();wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});return wrap}
async function compress(file,logo=false){
  if(!file)return '';
  if(file.size>20*1024*1024)throw Error('Maximum upload image size is 20 MB');
  if(!/^image\//.test(file.type))throw Error('Please select a valid photo or logo');
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Image could not be read'));im.src=url});
    // Square layout on every product, JPEG image output hard-capped at approx. 150 KB.
    const sizes=logo?[560,480,400,320]:[800,720,640,560,480,400];
    for(const size of sizes){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
      const scale=logo?Math.min(size/img.width,size/img.height):Math.max(size/img.width,size/img.height);
      ctx.drawImage(img,(size-img.width*scale)/2,(size-img.height*scale)/2,img.width*scale,img.height*scale);
      for(const q of [.86,.78,.70,.62,.54,.46,.38,.30,.22]){
        const encoded=canvas.toDataURL('image/jpeg',q);
        if(Math.round((encoded.length-23)*.75)<=149000)return encoded;
      }
    }
    throw Error('Image could not be compressed below 150 KB. Try JPG or smaller dimensions.');
  }finally{URL.revokeObjectURL(url)}
}
function downloadBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}
function createBillImage(invoice,business){
  const lines=invoice.items||[],w=900,h=Math.max(1150,860+lines.length*58),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#15233d';x.fillRect(0,0,w,180);
  x.fillStyle='#ffffff';x.font='bold 44px Arial';x.fillText(String(business.business||'Business').slice(0,30),54,79);
  x.font='22px Arial';x.fillStyle='#d6e2ff';x.fillText('INVOICE • '+invoice.status,55,127);
  let y=225;
  function txt(v,left,bold=false,size=23,color='#1b2642'){x.fillStyle=color;x.font=(bold?'bold ':'')+size+'px Arial';x.fillText(String(v||'').slice(0,58),left,y)}
  txt('Invoice: '+invoice.id,54,true,24);y+=41;txt('Date: '+date(invoice.createdAt),54);y+=38;txt('Customer: '+invoice.customer,54);y+=36;txt('Mobile: '+invoice.mobile,54);y+=42;
  x.fillStyle='#e8edf4';x.fillRect(54,y,w-108,2);y+=46;
  txt('ITEM',54,true,22);txt('TOTAL',705,true,22);y+=33;
  lines.forEach(p=>{txt(String(p.name).slice(0,35),54,false,22);y+=28;txt(p.qty+' × '+money(p.price),54,false,19,'#626e82');txt(money(p.amount),705,true,20);y+=32;});
  y+=24;x.fillStyle='#d7dee8';x.fillRect(54,y,w-108,2);y+=45;
  txt('Subtotal',54);txt(money(invoice.subtotal),690,true);y+=44;
  if(invoice.tax){txt('Tax',54);txt(money(invoice.tax),690,true);y+=44}
  x.fillStyle='#f2f5fa';x.fillRect(40,y-20,w-80,94);y+=40;txt('TOTAL',54,true,34);txt(money(invoice.total),642,true,32);y+=75;
  txt('Payment: '+invoice.status,54,true,26,invoice.status==='PAID'?'#16875a':'#b45309');y+=42;
  if(business.upi){txt('UPI: '+String(business.upi).slice(0,35),54,false,21);y+=40}
  txt('Thank you for your business!',54,true,25,'#566781');y+=36;
  txt('Generated by BizNexa',54,false,18,'#8d99a9');
  return new Promise(resolve=>c.toBlob(resolve,'image/png'));
}
async function shareBill(inv,business){
  const blob=await createBillImage(inv,business);if(!blob)throw Error('Cannot create bill image');
  const file=new File([blob],inv.id+'.png',{type:'image/png'});
  const text=`${business.business} bill ${inv.id}\nAmount ${money(inv.total)} | ${inv.status}\nView: ${invoiceLink(inv.id,inv.token)}`;
  if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:'Invoice '+inv.id,text});return}catch(e){if(e.name==='AbortError')return;}
  }
  downloadBlob(blob,inv.id+'.png');
  if(inv.mobile){window.open(wa(inv.mobile,text),'_blank','noopener');notice('Bill image downloaded. Attach it in WhatsApp chat.','info')}
  else notice('Bill image downloaded. Share it with your customer.','success');
}
function setBusyScreen(el,text='Loading…'){if(el)el.innerHTML='<div class="loading"><div class="spinner"></div><p>'+escape(text)+'</p></div>'}
function registerSW(){if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});}
// Offline SVG icons; social profile type is inferred from URL, not manually selected.
const socialNames={facebook:'Facebook',instagram:'Instagram',youtube:'YouTube',linkedin:'LinkedIn',whatsapp:'WhatsApp',x:'X / Twitter',telegram:'Telegram',pinterest:'Pinterest',tiktok:'TikTok',threads:'Threads',snapchat:'Snapchat',maps:'Google Maps',github:'GitHub',website:'Website'};
const socialPaths={
 facebook:'<path d="M15 21v-8h3l.6-4H15V7c0-1.2.4-2 2-2h2V1.5A24 24 0 0 0 16 1c-3.2 0-5 2-5 5v3H8v4h3v8"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
 youtube:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/>',
 linkedin:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.1M12 17v-7M12 13c0-2.2 5-3.4 5 .2V17"/>',
 whatsapp:'<path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.3-4.2A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8.2 8.5c0 3.1 3.2 6.3 6.4 6.4l1.3-1.3-2.1-1.4-1 1-2.5-2.5 1-1-1.6-2z"/>',
 x:'<path d="m4 3 16 18M20 3 4 21"/><path d="M5 3h4M15 21h4"/>',
 telegram:'<path d="m21 3-4 18-5.4-5.1L8 18l1-5 12-10-16 8-3-2 19-6Z"/>',
 pinterest:'<circle cx="12" cy="12" r="9"/><path d="m10 20 3-11c2-2 5 1 2 4-1.3 1.7-3.7 1.3-4 .1M9 14c-2-2-1.4-7 3-8"/>',
 tiktok:'<path d="M13 3v12.5a4.5 4.5 0 1 1-4.5-4.5M13 4c1 3 3 5 6 5v4c-3 0-5-1-6-2"/>',
 threads:'<path d="M19 8a7 7 0 1 0-6 11c4 0 6-3 4.5-5-1-1.4-3.5-2-6.2-1.5M9 9c3-2 8-1 9 3"/>',
 snapchat:'<path d="M7 16c-2 2-4 1-4 2 2 1 3 1 4 3l5-1 5 1c1-2 3-2 4-3 0-1-2 0-4-2 1-2 1-4 1-7a6 6 0 0 0-12 0c0 3 0 5 1 7Z"/>',
 maps:'<path d="M12 21s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
 github:'<path d="M9 20c-4 .8-5-2-6-3M15 20v-3c3-.5 5-1.8 5-5 0-1.5-.5-2.5-1.5-3.5l.1-3.1-3.2.9a12 12 0 0 0-6.8 0l-3.2-.9.1 3.1C4.5 9.5 4 10.5 4 12c0 3.2 2 4.5 5 5v3"/><path d="M12 17v4"/>',
 website:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18M4.6 7h14.8M4.6 17h14.8"/>'
};
function socialKind(url){
 let host='';try{host=new URL(/^https?:\/\//i.test(String(url))?url:'https://'+String(url)).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return 'website'}
 const matches=(...domains)=>domains.some(d=>host===d||host.endsWith('.'+d));
 if(matches('facebook.com','fb.com','fb.me'))return 'facebook';
 if(matches('instagram.com'))return 'instagram';
 if(matches('youtube.com','youtu.be'))return 'youtube';
 if(matches('linkedin.com'))return 'linkedin';
 if(matches('wa.me','whatsapp.com'))return 'whatsapp';
 if(matches('x.com','twitter.com'))return 'x';
 if(matches('t.me','telegram.me','telegram.org'))return 'telegram';
 if(matches('pinterest.com','pin.it'))return 'pinterest';
 if(matches('tiktok.com'))return 'tiktok';
 if(matches('threads.net'))return 'threads';
 if(matches('snapchat.com'))return 'snapchat';
 if(matches('maps.app.goo.gl','maps.google.com')||(/^(google\.[a-z.]+)$/.test(host)&&/\/maps(?:\/|\?|$)/.test(String(url)))||/goo\.gl\/maps/.test(String(url)))return 'maps';
 if(matches('github.com'))return 'github';
 return 'website';
}
function safeExternal(raw){
 let s=String(raw||'').trim();if(!s)throw Error('Social link URL is empty');
 if(!/^https:\/\//i.test(s)&&/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[\/\?#].*)?$/i.test(s))s='https://'+s;
 if(!/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?:[\/\?#][^\s<>"'`\\]*)?$/i.test(s)||s.includes('..'))throw Error('Use a valid HTTPS URL, e.g. https://instagram.com/yourpage');
 let u;try{u=new URL(s)}catch(e){throw Error('Invalid link URL')}
 if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.port)throw Error('Only public HTTPS website URLs are allowed');
 return s;
}
// Convert a username into a platform profile URL on blur or Tab. Full HTTPS URLs are unchanged.
function normalizeSocialInput(raw,platform){
 let v=String(raw||'').trim(),kind=String(platform||'website').toLowerCase();if(!v)return '';
 if(/^https?:\/\//i.test(v))return safeExternal(v); // Preserve the complete URL exactly.
 if(/^(?:www\.)?(?:facebook\.com|fb\.com|fb\.me|instagram\.com|youtube\.com|youtu\.be|linkedin\.com|x\.com|twitter\.com|t\.me|wa\.me|pinterest\.com|tiktok\.com|threads\.net|snapchat\.com|github\.com)\//i.test(v))return safeExternal('https://'+v);
 if(kind==='website'||kind==='maps'||kind==='other')return safeExternal(v);
 if(kind==='whatsapp'){
   const digits=v.replace(/[\s+()-]/g,'');if(!/^\d{10,15}$/.test(digits))throw Error('WhatsApp: enter 10–15 digits or a full HTTPS link');
   return 'https://wa.me/'+(digits.length===10?'91'+digits:digits);
 }
 const prefix={facebook:'https://www.facebook.com/',instagram:'https://www.instagram.com/',youtube:'https://www.youtube.com/@',linkedin:'https://www.linkedin.com/in/',x:'https://x.com/',telegram:'https://t.me/',pinterest:'https://www.pinterest.com/',tiktok:'https://www.tiktok.com/@',threads:'https://www.threads.net/@',snapchat:'https://www.snapchat.com/add/',github:'https://github.com/'};
 if(!prefix[kind])throw Error('Enter a complete HTTPS link for this service');
 v=v.replace(/^@/,'');if(!/^[a-zA-Z0-9._-]{1,100}$/.test(v)||v==='.'||v==='..')throw Error('Enter a valid '+kind+' username or complete HTTPS profile URL');
 return prefix[kind]+v+(['youtube','x','telegram','github'].includes(kind)?'':'/');
}
function socialIcon(kind){return `<svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${socialPaths[kind]||socialPaths.website}</svg>`}
function socialButtons(links,small=false){
 if(!Array.isArray(links))return '';
 const html=links.filter(x=>x?.enabled).map(x=>{
   let url;try{url=safeExternal(x.url)}catch(e){return ''}
   const kind=socialKind(url),name=String(x.title||'').trim()||socialNames[kind];
   return `<a class="social-link social-${kind}" target="_blank" rel="noopener noreferrer" href="${escape(url)}" aria-label="${escape(name)}" title="${escape(name)}">${socialIcon(kind)}<span>${escape(name)}</span></a>`;
 }).filter(Boolean).join('');
 return html?`<div class="social-links ${small?'social-compact':''}">${html}</div>`:'';
}
function applyBrand(){const name=String(conf.BRAND||'BizNexa').trim().slice(0,36)||'BizNexa';document.title=document.title.replace(/BizNexa/g,name);$$('.brand').forEach(el=>{Array.from(el.childNodes).filter(n=>n.nodeType===3).forEach(n=>{n.textContent=n.textContent.replace(/BizNexa/g,name)});const mark=el.querySelector('.brandmark');if(mark)mark.textContent=name.charAt(0).toUpperCase()})}
applyBrand();
window.BX={conf,$,$$,escape,money,date,phone,wa,getParams,site,cardLink,catalogLink,invoiceLink,token,setToken,clearToken,theme,themes,socialKind,socialNames,socialIcon,socialButtons,safeExternal,normalizeSocialInput,get,post,notice,busy,copy,placeholder,imageHTML,modal,compress,shareBill,createBillImage,registerSW,setBusyScreen};
})();
