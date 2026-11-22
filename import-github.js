/* Import des fichiers data (bible/chants/vgr/shp) depuis le dépôt GitHub vers l'application */
(function(){
var ORDER=["Genèse","Exode","Lévitique","Nombres","Deutéronome","Josué","Juges","Ruth","1 Samuel","2 Samuel","1 Rois","2 Rois","1 Chroniques","2 Chroniques","Esdras","Néhémie","Esther","Job","Psaumes","Proverbes","Ecclésiaste","Cantique des cantiques","Ésaïe","Jérémie","Lamentations","Ézéchiel","Daniel","Osée","Joël","Amos","Abdias","Jonas","Michée","Nahum","Habacuc","Sophonie","Aggée","Zacharie","Malachie","Matthieu","Marc","Luc","Jean","Actes","Romains","1 Corinthiens","2 Corinthiens","Galates","Éphésiens","Philippiens","Colossiens","1 Thessaloniciens","2 Thessaloniciens","1 Timothée","2 Timothée","Tite","Philémon","Hébreux","Jacques","1 Pierre","2 Pierre","1 Jean","2 Jean","3 Jean","Jude","Apocalypse"];
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
var NORD=ORDER.map(norm);
function rank(t){var n=norm(t);for(var i=0;i<NORD.length;i++){if(n===NORD[i]||n.indexOf(NORD[i])===0||NORD[i].indexOf(n)===0&&n.length>3)return i}return 999}

function bparse(text){
 var ch=[],cur=null;
 text.split(/\n+/).map(function(l){return l.trim()}).filter(Boolean).forEach(function(l){
  if(/^(chapitre|chap\.?|psaume)\s*\d+\s*$/i.test(l)){cur=[];ch.push(cur);return}
  var m=l.match(/^(\d+)\s*[.:)]?\s+(.*)$/);
  if(m){if(!cur||(+m[1]===1&&cur.length)){cur=[];ch.push(cur)}cur.push(m[2])}
  else{if(!cur){cur=[];ch.push(cur)}cur.push(l)}
 });
 return ch.length?ch:[[text]];
}

window.ghImport=async function(){
 try{
  toast("Lecture de la liste…");
  var base="",idx;
  try{idx=await(await fetch("index.json",{cache:"no-store"})).json()}catch(e){}
  if(!Array.isArray(idx)){
   try{idx=await(await fetch("data/index.json",{cache:"no-store"})).json();base="data/"}
   catch(e){toast("index.json introuvable");return}
  }
  var keys=[],seen={};
  idx.forEach(function(x){var k=x.cat+"-"+x.part;if(!seen[k]){seen[k]=1;keys.push([k,x.cat])}});
  var by={},n=0;
  for(var i=0;i<keys.length;i++){
   toast("Chargement "+(i+1)+" / "+keys.length);
   var arr=await(await fetch(base+keys[i][0]+".json")).json();
   (by[keys[i][1]]=by[keys[i][1]]||[]).push.apply(by[keys[i][1]],arr);n+=arr.length;
  }
  var NAMES={chants:["chant","Recueil des cantiques"],vgr:["brochure","Message VGR"],shp:["brochure","Message SHP"],autres:["brochure","Autres"]};
  if(by.bible){
   var bs=by.bible.slice().sort(function(a,b){return rank(a.title)-rank(b.title)||a.title.localeCompare(b.title,"fr",{numeric:true})});
   await put({id:"gh-bible",type:"bible",title:"La Bible",books:bs.map(function(x){return{n:x.title,c:bparse(x.text)}})});
  }
  for(var c in NAMES){
   if(!by[c])continue;
   await put({id:"gh-"+c,type:NAMES[c][0],title:NAMES[c][1],sections:by[c].map(function(x){return{t:x.title,b:x.text}})});
  }
  await load();
  toast("✅ "+n+" fichiers importés");
 }catch(e){toast("Erreur d'import : "+(e&&e.message||e))}
};

var _r=render;
render=function(){
 _r();
 if(S.tab==="set"){
  $("#m").insertAdjacentHTML("afterbegin",'<div class="card"><b>Importer depuis GitHub</b><p class="mut">Charge les fichiers bible, chants, VGR et SHP du dépôt et les range dans les onglets.</p><button class="b" onclick="ghImport()">Importer maintenant</button></div>');
 }
};
})();
