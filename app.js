const CATS=["Alimentação","Mercado","Gasolina/Combustível","Farmácia","Transporte","Moradia","Lazer","Compras","Contas","Salário","Pix recebido","Outros"];
let txs=JSON.parse(localStorage.getItem("du_transactions")||"[]");
let settings=JSON.parse(localStorage.getItem("du_settings")||"{}");
let selectedType="saida", calDate=new Date();

const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const todayISO=()=>{let d=new Date();return d.toISOString().slice(0,10)};
function save(){localStorage.setItem("du_transactions",JSON.stringify(txs))}
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2500)}
function totals(list=txs){return {in:list.filter(x=>x.type==="entrada").reduce((a,x)=>a+x.amount,0),out:list.filter(x=>x.type==="saida").reduce((a,x)=>a+x.amount,0)}}
function monthList(){let m=todayISO().slice(0,7);return txs.filter(x=>x.date.startsWith(m))}
function icon(cat){return {"Mercado":"🛒","Gasolina/Combustível":"⛽","Farmácia":"✚","Alimentação":"🍽️","Transporte":"🚌","Moradia":"🏠","Lazer":"🎭","Compras":"🛍️","Contas":"🧾","Salário":"💰","Pix recebido":"↗️"}[cat]||"◈"}

function render(){
 let t=totals(), m=totals(monthList());
 $("#balance").textContent=money(t.in-t.out); $("#monthIn").textContent=money(m.in);$("#monthOut").textContent=money(m.out);$("#monthResult").textContent=money(m.in-m.out);
 let recent=[...txs].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,7); $("#recentList").innerHTML=recent.length?recent.map(row).join(""):`<div class="empty">Nenhuma movimentação ainda.<br>Registre sua primeira entrada ou saída.</div>`;
 $("#allIn").textContent=money(t.in);$("#allOut").textContent=money(t.out);
 let biggest=txs.filter(x=>x.type==="saida").sort((a,b)=>b.amount-a.amount)[0];$("#largest").textContent=biggest?money(biggest.amount):money(0);
 renderHistory();renderAnalysis();renderCalendar(); fillCats();
}
function row(x){return `<div class="transaction"><div class="tx-icon">${icon(x.category)}</div><div class="tx-main"><strong>${esc(x.description||x.category)}</strong><small>${esc(x.category)}${x.location?" · "+esc(x.location):""} · ${formatDate(x.date)}</small></div><div class="tx-value ${x.type==="entrada"?"positive":"negative"}">${x.type==="entrada"?"+":"−"}${money(x.amount)}</div><button class="linkbtn" onclick="editTx('${x.id}')">⋮</button></div>`}
function formatDate(d){return new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})}
function fillCats(){let opts=CATS.map(c=>`<option>${c}</option>`).join("");$("#category").innerHTML=opts;let fc=$("#filterCat");let val=fc.value;fc.innerHTML=`<option value="">Todas as categorias</option>`+opts;fc.value=val}
function renderHistory(){let q=$("#search")?.value.toLowerCase()||"", typ=$("#filterType")?.value||"",cat=$("#filterCat")?.value||"";let a=txs.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&(!typ||x.type===typ)&&(!cat||x.category===cat)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));$("#historyList").innerHTML=a.length?a.map(row).join(""):`<div class="empty">Nenhum registro encontrado.</div>`}
function renderAnalysis(){let out=txs.filter(x=>x.type==="saida"), map={};out.forEach(x=>map[x.category]=(map[x.category]||0)+x.amount);let arr=Object.entries(map).sort((a,b)=>b[1]-a[1]), max=arr[0]?.[1]||1;$("#categoryChart").innerHTML=arr.length?arr.map(([c,v])=>`<div class="bar-row"><div class="bar-label"><span>${esc(c)}</span><b>${money(v)}</b></div><div class="bar-bg"><div class="bar-fill" style="width:${v/max*100}%"></div></div></div>`).join(""):`<p>Nenhuma saída registrada ainda.</p>`;let m=monthList(),mt=totals(m), top=arr[0];$("#analysisText").innerHTML=`<div>Entradas no mês: <b>${money(mt.in)}</b></div><div>Saídas no mês: <b>${money(mt.out)}</b></div><div>Resultado: <b>${money(mt.in-mt.out)}</b></div><div>Categoria que mais recebeu gastos: <b>${top?esc(top[0]):"—"}</b></div>`}
function renderCalendar(){let y=calDate.getFullYear(),m=calDate.getMonth();$("#calTitle").textContent=new Date(y,m,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate(),h="";for(let i=0;i<first;i++)h+=`<div class="day muted"><b>${prev-first+i+1}</b></div>`;for(let d=1;d<=days;d++){let iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, has=txs.some(x=>x.date===iso),today=iso===todayISO();h+=`<div class="day ${today?"today":""}" onclick="selectDay('${iso}')"><b>${d}</b>${has?"<span class='dot'></span>":""}</div>`}$("#calendarGrid").innerHTML=h}
function selectDay(iso){let a=txs.filter(x=>x.date===iso);$("#selectedDayTitle").textContent=new Date(iso+"T12:00:00").toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});$("#selectedDayList").innerHTML=a.length?a.map(row).join(""):"<div class='empty'>Nenhuma movimentação nesse dia.</div>"}

function openModal(x=null){$("#modal").classList.add("open");$("#txForm").dataset.id=x?.id||"";$("#deleteTxBtn").style.display=x?.id?"inline-block":"none";$("#amount").value=x?.amount||"";$("#description").value=x?.description||"";$("#date").value=x?.date||todayISO();$("#time").value=x?.time||new Date().toTimeString().slice(0,5);$("#location").value=x?.location||"";$("#notes").value=x?.notes||"";selectedType=x?.type||"saida";$$(".type-toggle button").forEach(b=>b.classList.toggle("selected",b.dataset.type===selectedType));$("#category").value=x?.category||CATS[0]}
function closeModal(){$("#modal").classList.remove("open")}
function editTx(id){let x=txs.find(t=>t.id===id);if(!x)return;openModal(x)}
function deleteTx(id){if(confirm("Excluir esta movimentação? Essa ação não pode ser desfeita.")){txs=txs.filter(x=>x.id!==id);save();render();closeModal();toast("Movimentação excluída.")}}

function showScreen(id){$$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));let names={dashboard:"Olá! 👋",history:"Histórico",analysis:"Análises",calendar:"Calendário financeiro",assistant:"Assistente DU",settings:"Configurações"};$("#pageTitle").textContent=names[id]||"DU";if(id==="assistant"&&!$("#chat").children.length)duSay("Oxente! Sou o DU. Pode me perguntar sobre seus registros ou falar um gasto para eu preparar o lançamento.")}
function parseDateWords(text){let d=new Date();if(/\bontem\b/i.test(text))d.setDate(d.getDate()-1);else if(/\banteontem\b/i.test(text))d.setDate(d.getDate()-2);return d.toISOString().slice(0,10)}
function parseMoney(text){let m=text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);return m?parseFloat(m[1].replace(".","").replace(",",".")):null}
function parseCategory(text){let low=text.toLowerCase();let pairs=[["gasolina/combustível",/gasolina|combustível|combustivel/],["mercado",/mercado/],["farmácia",/farmácia|farmacia/],["alimentação",/comi|comida|restaurante|lanche|alimentação|alimentacao/],["transporte",/uber|ônibus|onibus|transporte/],["moradia",/aluguel|casa|moradia/],["lazer",/lazer|cinema|festa/],["compras",/compra|roupa/],["contas",/conta|luz|água|agua|internet/],["salário",/salário|salario|pagamento/],["pix recebido",/pix recebido|recebi.*pix/]];return pairs.find(p=>p[1].test(low))?.[0]||"Outros"}
function interpret(text){let low=text.toLowerCase(), amount=parseMoney(text);if(amount===null)return {kind:"question"};let type=/recebi|entrou|ganhei|salário|salario|pix recebido/.test(low)?"entrada":"saida";let cat=type==="entrada"?(low.includes("salário")||low.includes("salario")?"Salário":low.includes("pix")?"Pix recebido":"Outros"):CATS.find(c=>c.toLowerCase()===parseCategory(text))||parseCategory(text);let d=parseDateWords(text);if(type==="saida"&&!/gastei|gasto|paguei|comprei|saiu|saída|saida/.test(low))return {kind:"question"};return {kind:"transaction",tx:{id:(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2)),type,amount,category:cat,description:text,date:d,time:new Date().toTimeString().slice(0,5),location:cat==="Outros"?"":cat,notes:"",created_at:new Date().toISOString(),updated_at:new Date().toISOString()}}}
function addFromText(text){
  let r=interpret(text);
  if(r.kind==="transaction"){
    let x=r.tx;
    txs.push(x);
    save();
    render();
    duSay("Anotado! Já registrei essa movimentação. ✨");
    toast("Movimentação salva. ✨");
    return true;
  }
  return false;
}
function answer(q){let low=q.toLowerCase(), list=txs, now=new Date(), start=new Date(now);if(/hoje/.test(low))list=list.filter(x=>x.date===todayISO());else if(/ontem/.test(low)){let d=new Date(now);d.setDate(d.getDate()-1);list=list.filter(x=>x.date===d.toISOString().slice(0,10))}else if(/semana/.test(low)){start.setDate(now.getDate()-6);list=list.filter(x=>new Date(x.date+"T12:00:00")>=start)}else if(/m[eê]s/.test(low)){let p=todayISO().slice(0,7);list=list.filter(x=>x.date.startsWith(p))}else if(/ano/.test(low)){let p=todayISO().slice(0,4);list=list.filter(x=>x.date.startsWith(p))}let cat=parseCategory(q);if(/gasolina|combustível|combustivel/.test(low))list=list.filter(x=>x.category==="Gasolina/Combustível");else if(/mercado/.test(low))list=list.filter(x=>x.category==="Mercado");else if(/farmácia|farmacia/.test(low))list=list.filter(x=>x.category==="Farmácia");let t=totals(list);if(/maior gasto/.test(low)){let x=list.filter(x=>x.type==="saida").sort((a,b)=>b.amount-a.amount)[0];return x?`Seu maior gasto no período foi <b>${money(x.amount)}</b> em ${esc(x.description||x.category)}.`:"Não encontrei saídas nesse período."}if(/onde.*mais|categoria.*mais/.test(low)){let map={};list.filter(x=>x.type==="saida").forEach(x=>map[x.category]=(map[x.category]||0)+x.amount);let top=Object.entries(map).sort((a,b)=>b[1]-a[1])[0];return top?`A categoria que mais levou seu dinheiro foi <b>${esc(top[0])}</b>, com ${money(top[1])}.`:"Ainda não há gastos registrados."}if(/quanto.*receb|quanto entrou|entrada/.test(low)&&!/saiu|gasto/.test(low))return `Nesse período, entraram <b>${money(t.in)}</b>.`;if(/quanto.*sai|gasto|gast/.test(low))return `Nesse período, você gastou <b>${money(t.out)}</b>.`;return `Nesse período: <b>${money(t.in)}</b> de entradas e <b>${money(t.out)}</b> de saídas. Resultado: <b>${money(t.in-t.out)}</b>.`}
function duSay(t){$("#chat").insertAdjacentHTML("beforeend",`<div class="bubble du">${t}</div>`);$("#chat").scrollTop=$("#chat").scrollHeight}
function userSay(t){$("#chat").insertAdjacentHTML("beforeend",`<div class="bubble user">${esc(t)}</div>`)}
function sendText(t){if(!t.trim())return;userSay(t);if(!addFromText(t))duSay(answer(t))}
function startVoice(){if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window)){toast("Seu navegador não oferece reconhecimento de voz.");return}let R=window.SpeechRecognition||window.webkitSpeechRecognition,r=new R();r.lang="pt-BR";r.interimResults=false;r.onstart=()=>toast("Pode falar…");r.onresult=e=>{let text=e.results[0][0].transcript;showScreen("assistant");sendText(text)};r.onerror=()=>toast("Não consegui entender. Tente novamente.");r.start()}

$("#addBtn").onclick=()=>openModal();$("#closeModal").onclick=closeModal;$("#deleteTxBtn").onclick=()=>{let id=$("#txForm").dataset.id;if(id)deleteTx(id)};$("#voiceBtn").onclick=startVoice;$("#voiceBtn2").onclick=startVoice;$("#chatMic").onclick=startVoice;
$$(".nav").forEach(b=>b.onclick=()=>showScreen(b.dataset.screen));$$("[data-screen]").forEach(b=>{if(!b.classList.contains("nav"))b.onclick=()=>showScreen(b.dataset.screen)});
$$(".type-toggle button").forEach(b=>b.onclick=()=>{selectedType=b.dataset.type;$$(".type-toggle button").forEach(x=>x.classList.toggle("selected",x===b))});
$("#txForm").onsubmit=e=>{e.preventDefault();let id=e.target.dataset.id,x={id:id||crypto.randomUUID(),type:selectedType,amount:+$("#amount").value,category:$("#category").value,description:$("#description").value.trim(),date:$("#date").value,time:$("#time").value,location:$("#location").value.trim(),notes:$("#notes").value.trim(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};if(id)txs=txs.map(t=>t.id===id?x:t);else txs.push(x);save();render();closeModal();toast(id?"Movimentação atualizada.":"Movimentação salva. ✨")};
["search","filterType","filterCat"].forEach(id=>$("#"+id).addEventListener("input",renderHistory));
$("#chatSend").onclick=()=>{let v=$("#chatInput").value;$("#chatInput").value="";sendText(v)};$("#chatInput").onkeydown=e=>{if(e.key==="Enter")$("#chatSend").click()};$$(".suggestions button").forEach(b=>b.onclick=()=>sendText(b.textContent));
$("#prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$("#nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
$("#saveSettings").onclick=()=>{settings.name=$("#userName").value;localStorage.setItem("du_settings",JSON.stringify(settings));toast("Configurações salvas.")};
$("#clearData").onclick=()=>{if(confirm("Isso apagará TODOS os registros deste navegador. Continuar?")){txs=[];save();render();toast("Registros apagados.")}};
if(settings.name)$("#userName").value=settings.name;
render();