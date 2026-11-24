/* Invite engine: turns an invitation's details (S) into the finished HTML page.
 * Shared by the editor (in the browser), scripts/make-demos.js and, later, server functions.
 * Usage: InviteEngine.build(S, opts, R)
 *   S    the invitation details (see src/engine/samples.js for the full shape)
 *   opts {preview, skip, scroll, silent, mark}  editor-only display options; {} for the final invite
 *   R    resources: {templates:{<id>:{html, themes}}, emblems, phrases:{<lang>:{...}}, fontsBase}
 *   Fixed wording comes from the phrase file for S.lang (src/i18n/<lang>.json), falling back to English.
 * Everything typed by a visitor must go through esc() (HTML) or js() (inside scripts).
 */
(function (root) {
'use strict';
var STYLES={ceremony:['Ceremony arch','i-arch','arch'],rings:['Vows / rings','i-rings','arch'],dinner:['Dinner / toast','i-cheers','lights'],feast:['Feast / walima','i-feast','lights'],nikah:['Nikah / lanterns','i-lantern','moon'],
  mehendi:['Mehendi / henna','i-mehendi','mehendi'],sangeet:['Sangeet / party / dance','i-sangeet','sangeet'],haldi:['Haldi','i-haldi','haldi'],pujan:['Puja / kalash','i-pujan','pujan'],ghat:['Ghat sthapana / ritual','i-ghat','ghat'],pheras:['Mandap / pheras','i-mandap','pheras']};
// label, note and rite are the editor's (English) wording; the invite's own words come from the phrase file.
var TRAD={hindu:{label:'Hindu',note:'Ganesha emblem, "Weds" in the title',emblem:'ganesha',rite:'Pheras',recIcon:'i-cheers'},
  muslim:{label:'Muslim / Nikah',note:'Star and crescent emblem, no alcohol artwork',emblem:'star',rite:'Nikah',recIcon:'i-feast'},
  western:{label:'Western (European / American)',note:'Monogram of the couple\'s initials',emblem:'monogram',rite:'Ceremony',recIcon:'i-cheers'}};
var DEFAULT_LANG='en';
var SILENT='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
var DEFAULT_TEMPLATE='classic';

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function js(s){return JSON.stringify(String(s)).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
function parts(d){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');if(!m)return null;var y=+m[1],mo=+m[2]-1,da=+m[3];return {y:y,mo:mo,d:da,wd:new Date(Date.UTC(y,mo,da)).getUTCDay()};}
// Replaces {name} placeholders in a phrase. Values are inserted once and never re-scanned.
function fill(t,o){return String(t).replace(/\{(\w+)\}/g,function(m,k){return Object.prototype.hasOwnProperty.call(o,k)?o[k]:m;});}
// F is the phrase file's "format" section.
function time12(t,F){var m=/^(\d{2}):(\d{2})$/.exec(t||'');if(!m)return '';var h=+m[1];return fill(F.time,{h12:String(h%12||12),HH:m[1],mm:m[2],ampm:h<12?F.am:F.pm});}
function longDate(d,F){var p=parts(d);return p?fill(F.date_long,{weekday:F.days[p.wd],day:String(p.d),month:F.months[p.mo],year:String(p.y)}):'';}
function shortWhen(d,t,F){var p=parts(d),a=[];if(p){a.push(F.days_short[p.wd]);a.push(fill(F.date_short,{day:String(p.d),month:F.months_short[p.mo]}));}if(time12(t,F))a.push(time12(t,F));return a.join(' · ');}
function phrasesFor(S,R){return R.phrases[S.lang]||R.phrases[DEFAULT_LANG];}
// WhatsApp number for guest replies. Must start with + or 00 (country code) so it can't reach the wrong person.
// Returns digits only (8 to 15, no leading zero), or '' if not usable.
function waNumber(s){var t=String(s||'').trim();if(!/^(\+|00)/.test(t))return '';var d=t.replace(/\D/g,'').replace(/^00/,'');return /^[1-9]\d{7,14}$/.test(d)?d:'';}
function pad(n){return (n<10?'0':'')+n;}
function calStamp(ms){var d=new Date(ms);return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+'00Z';}

/* ---------- opening library (src/openings/) ---------- */
// S.opening: which opening to show and how. id is a library ID, 'custom' (own words) or '' (none).
var OPENING_DEFAULT={id:'',custom:'',design:'classic',size:'m',color:'gold',gujarati:false,translit:false,meaning:true,ref:true,version:'kjv'};
var SCRIPT_LANG={deva:'hi',gujr:'gu',guru:'pa',arab:'ar',urdu:'ur',latn:''};
function openingOpts(o){var x={};for(var k in OPENING_DEFAULT)x[k]=(o&&o[k]!=null)?o[k]:OPENING_DEFAULT[k];return x;}
function oneOf(v,list,fallback){for(var i=0;i<list.length;i++)if(list[i].id===v)return v;return fallback;}
// Same words in Gujarati letters: the two alphabets sit at parallel positions in Unicode. Dandas (। ॥) are shared.
var GUJ=/^[\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF]$/;
function toGujarati(t){return String(t).replace(/[\u0900-\u097F]/g,function(c){var n=c.charCodeAt(0);if(n===0x0964||n===0x0965)return c;var g=String.fromCharCode(n+0x180);return GUJ.test(g)?g:c;});}
// Which scripts appear in a text, and which one most of it is written in (so the right font and direction are used).
var SCRIPT_RE={gujr:/[\u0A80-\u0AFF]/g,guru:/[\u0A00-\u0A7F]/g,deva:/[\u0900-\u097F]/g,arab:/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g};
var URDU_ONLY=/[\u0679\u0688\u0691\u06A9\u06AF\u06BA\u06BE\u06C1\u06D2\u06D3]/;
function scriptsIn(t){var out={};for(var k in SCRIPT_RE){var m=String(t).match(SCRIPT_RE[k]);if(m)out[k==='arab'&&URDU_ONLY.test(t)?'urdu':k]=m.length;}
  // The danda signs (। ॥) are shared by Indian scripts; they alone don't make a text Devanagari.
  if(out.deva){var d=(String(t).match(/[\u0964\u0965]/g)||[]).length;out.deva-=d;if(out.deva<=0&&Object.keys(out).length>1)delete out.deva;}
  return out;}
function detectScript(t){var c=scriptsIn(t),best='latn',n=0;for(var k in c)if(c[k]>n){n=c[k];best=k;}return best;}
var ISO={deva:'Deva',gujr:'Gujr',guru:'Guru',arab:'Arab',urdu:'Arab',latn:'Latn'};
function findOpening(R,id){var O=R.openings;if(!O||!id)return null;var m=O._byId;if(!m){m=O._byId={};O.items.forEach(function(it){m[it.id]=it;});}return m[id]||null;}
// Returns {line, page, fonts}: a one-line opening goes under the emblem on the first page,
// a longer one gets its own page that the book opens onto.
function renderOpening(S,R,P){
  var none={line:'',page:'',fonts:''},O=R.openings;if(!O)return none;
  var o=openingOpts(S.opening),M=O.meta,it=null,text,script,lang,trad='universal',ref='',meaning='',msrc='',translit='',isLine;
  if(o.id==='custom'){text=String(o.custom||'').replace(/\r/g,'').trim();if(!text)return none;script=detectScript(text);lang=SCRIPT_LANG[script];isLine=text.indexOf('\n')<0&&text.length<=48;}
  else{it=findOpening(R,o.id);if(!it)return none;
    trad=it.tradition;script=it.script;lang=it.lang||'';ref=it.ref||'';meaning=it.meaning||'';msrc=it.meaningSource||'';translit=it.translit||'';
    if(it.versions){var ver=oneOf(o.version,M.bibleVersions,'kjv');text=it.versions[ver];M.bibleVersions.forEach(function(b){if(b.id===ver&&ref)ref+=' · '+b.short;});}else text=it.text;
    if(o.gujarati&&it.gujarati&&script==='deva'){text=toGujarati(text);script='gujr';lang=(lang||'sa')+'-Gujr';}
    isLine=it.type==='phrase'&&text.indexOf('\n')<0;}
  var design=oneOf(o.design,M.designs,'classic'),size=oneOf(o.size,M.sizes,'m'),color=oneOf(o.color,M.colors,'gold');
  var fonts={},br=function(t){return esc(t).replace(/\n/g,'<br>');};
  function para(cls,t,sc,lg){var inT=scriptsIn(t);inT[sc]=1;for(var k in inT)if(M.scripts[k]&&M.scripts[k].font)fonts[M.scripts[k].font]=1;
    return '<p class="'+cls+' op-s-'+sc+'"'+(lg?' lang="'+esc(lg)+'"':'')+' dir="'+((M.scripts[sc]||{}).dir||'ltr')+'">'+br(t)+'</p>';}
  var html=(design==='medallion'?'<span class="op-motif" aria-hidden="true"><svg viewBox="0 0 64 64">'+(M.motifs[trad]||M.motifs.universal)+'</svg></span>':'')
    +para('op-text',text,script,lang);
  if(o.translit&&translit){var ts=detectScript(translit);html+=para('op-tr',translit,ts,(lang||'und').split('-')[0]+'-'+ISO[ts]);}
  if(o.meaning&&meaning)html+='<p class="op-mean" lang="en">'+br(meaning)+(msrc?'<small> · '+esc(msrc)+'</small>':'')+'</p>';
  if(o.ref&&ref)html+='<p class="op-ref">'+esc(ref)+'</p>';
  html='<div class="op op-'+design+' op-'+size+' op-c-'+color+' op-t-'+trad+' op-'+(isLine?'line':'page')+'">'+html+'</div>';
  var links=Object.keys(fonts).map(function(c){return '<link rel="stylesheet" href="'+esc((R.fontsBase||'')+'fonts/'+c+'.css')+'">';}).join('');
  return {fonts:links,
    line:isLine?'<div class="opening-line fade" data-t="0.55">'+html+'</div>':'',
    page:isLine?'':'<section class="opening-page" id="opening" aria-label="'+esc(P.text.opening_aria)+'"><div class="op-wrap">'+html+'</div></section>'};}

/* ---------- templates ---------- */
// The chosen colour theme, or the template's 'wine' theme, or its first theme.
function themeOf(themes,k){return themes[k]||themes.wine||themes[Object.keys(themes)[0]];}
// Fills a template's own snippet ({{KEY}} placeholders) for a function card or photo. Values are already escaped.
function part(tpl,map){return String(tpl||'').replace(/\{\{([A-Z_]+)\}\}/g,function(m,k){return Object.prototype.hasOwnProperty.call(map,k)?map[k]:'';});}
function templateId(S,R){return R.templates[S.template]?S.template:DEFAULT_TEMPLATE;}
// The template's HTML with the chosen colour theme applied (cached per template + theme).
function themedTemplate(R,id,k){
  var cache=R._themed||(R._themed={}),ck=id+'/'+k;
  if(cache[ck])return cache[ck];
  var T=R.templates[id],t=T.html,map=themeOf(T.themes,k).map||{};
  var keys=Object.keys(map);
  if(keys.length){
    var re=new RegExp(keys.map(function(x){return x.replace(/[()]/g,'\\$&')+(x.charAt(0)==='#'?'\\b':'');}).join('|'),'gi');
    t=t.replace(re,function(m){return map[m.toLowerCase()]||m;});
  }
  return cache[ck]=t;
}

/* ---------- build the invite ---------- */
function build(S,opts,R){
  opts=opts||{};
  var id=templateId(S,R),TP=R.templates[id],THEMES=TP.themes,EMBLEMS=R.emblems,PT=TP.partials,FEAT=TP.features||{};
  var P=phrasesFor(S,R),F=P.format,trad=TRAD[S.tradition]?S.tradition:'hindu';
  var th=themeOf(THEMES,S.theme),p=parts(S.date)||parts('2027-01-01'),tm=/^\d{2}:\d{2}$/.test(S.time)?S.time:'19:00';
  var TR=TRAD[S.tradition]||TRAD.hindu,tz=/^[+-]\d{2}:\d{2}$/.test(S.tz)?S.tz:'+05:30';
  var iso=S.date+'T'+tm+':00'+tz,start=new Date(iso).getTime();
  if(isNaN(start))start=Date.now();
  var title=S.name1+F.join[trad]+S.name2;
  var banner=S.bannerLine||fill(F.banner_line,{rite:F.rite[trad],time:time12(tm,F),venue:S.venue});
  var emblem=EMBLEMS[TR.emblem].replace('%%INIT1%%',esc((S.name1||'').trim().charAt(0).toUpperCase())).replace('%%INIT2%%',esc((S.name2||'').trim().charAt(0).toUpperCase()));
  var auto=S.reveal==='auto';
  var place=[S.venue,S.address].filter(Boolean).join(', ');
  var q=encodeURIComponent(place);
  var events=S.events.map(function(e){
    var st=STYLES[e.style]?e.style:'ceremony',bg=e.c2?'linear-gradient(135deg,'+e.c1+','+e.c2+')':e.c1;
    if(PT&&PT.event)return part(PT.event,{WHEN:esc(shortWhen(e.date,e.time,F)),NAME:esc(e.name),PLACE:esc(e.place),ICON:STYLES[st][1],SCENE:STYLES[st][2],STYLE:st,
      DRESS:e.dress&&e.dressOn!==false?part(PT.dress,{SWATCH:e.swatch!==false?part(PT.swatch,{BG:esc(bg)}):'',LABEL:esc(F.dress_code),TEXT:esc(e.dress)}):''});
    return '      <article class="ev-card"><img class="scene" data-scene="'+STYLES[st][2]+'" alt=""><div class="shade"></div>\n        <div class="ec"><div class="ill"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#'+STYLES[st][1]+'"/></svg></div><div class="ewhen">'+esc(shortWhen(e.date,e.time,F))+'</div><h3>'+esc(e.name)+'</h3><div class="place">'+esc(e.place)+'</div>'
      +(e.dress&&e.dressOn!==false?'\n          <div class="dressrow">'+(e.swatch!==false?'<span class="swatch" style="background:'+esc(bg)+'"></span>':'')+'<span><small>'+esc(F.dress_code)+'</small><b>'+esc(e.dress)+'</b></span></div>':'')+'</div></article>';
  }).join('\n');
  var photos=S.photos.map(function(ph){
    if(PT&&PT.photo)return part(PT.photo,{SRC:esc(ph.src),ALT:esc(ph.caption),POS:esc(ph.pos||'50%'),CAPTION:ph.caption?part(PT.caption,{TEXT:esc(ph.caption)}):''});
    return '        <figure class="sp-item"><div class="sp-in"><img src="'+esc(ph.src)+'" alt="'+esc(ph.caption)+'" style="object-position:50% '+esc(ph.pos||'50%')+'" decoding="async"></div>'+(ph.caption?'<figcaption class="cap">'+esc(ph.caption)+'</figcaption>':'')+'</figure>';
  }).join('\n');
  var cov=S.photos[S.cover]||S.photos[0];
  var wa=waNumber(S.rsvpPhone);
  var fontsHref=(R.fontsBase||'')+'fonts/fonts.css';
  var OP=renderOpening(S,R,P);
  var SH=R.shared||{};
  var themeVars=th.vars?'<style>:root{'+Object.keys(th.vars).map(function(k){return k+':'+String(th.vars[k]).replace(/[<>;{}]/g,'');}).join(';')+'}</style>':'';
  var V={THEME_VARS:themeVars,SHARED_CSS:SH.css||'',SHARED_RUNTIME:SH.runtime||'',SHARED_ICONS:SH.icons||'',OPENING_FONTS:OP.fonts,OPENING_LINE:OP.line,OPENING_PAGE:OP.page,LANG:esc(P.lang),DIR:P.dir==="rtl"?"rtl":"ltr",TITLE:esc(title),FONTS_HREF:esc(fontsHref),RSVP_HIDDEN:wa?'':' hidden',J_RSVP_PHONE:js(wa),J_COUPLE:js(S.name1+' & '+S.name2),SONG:esc(opts.silent||!S.song?SILENT:S.song),
    COVER_TITLE:esc(S.coverTitle),COVER_SUB:esc(S.coverSub),COVER_PHOTO:esc(cov.src),COVER_POS:'50% '+esc(cov.pos||'50%'),
    FRONT_LABEL:esc(S.frontLabel),NAME1:esc(S.name1),NAME2:esc(S.name2),REL1:esc(S.parents1?S.rel1:''),REL2:esc(S.parents2?S.rel2:''),EMBLEM:emblem,DATE_HEAD:esc(auto?F.date_head_auto:F.date_head_pull),DATE_TIP:auto?'':esc(F.date_tip),REC_ICON:TR.recIcon,PARENTS1:esc(S.parents1),PARENTS2:esc(S.parents2),INVITE_LINE:esc(S.inviteLine),
    W_WEEKDAY:esc(F.days[p.wd]),W_DAY:String(p.d),W_MONTH:esc(F.months[p.mo]),W_YEAR:String(p.y),BANNER_LINE:esc(banner),
    CAL_HREF:esc('https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(fill(F.calendar_title,{name1:S.name1,name2:S.name2}))+'&dates='+calStamp(start)+'/'+calStamp(start+4*3600e3)+'&location='+q),
    EVENTS:events,PHOTOS:photos,
    REC_HIDDEN:S.recOn?'':' hidden',REC_LABEL:esc(S.recLabel),REC_TITLE:esc(S.recTitle),REC_DATE:esc(longDate(S.recDate,F)),REC_LINE:esc(S.recLine),REC_VENUE:esc(S.recVenue),REC_CHIP:S.recChip?'<span class="chip">'+esc(S.recChip)+'</span>':'',
    CITY:esc(S.city),MAP_HREF:esc('https://www.google.com/maps/search/?api=1&query='+q),DIR_HREF:esc('https://www.google.com/maps/dir/?api=1&destination='+q),
    MAP_AREA:esc(S.mapArea),MAP_LANDMARK:esc(S.mapLandmark),MAP_ROAD:esc(S.mapRoad),VENUE:esc(S.venue),ADDRESS:esc(S.address),
    CLOSING:esc(S.closing),KIDS:S.kids?'<div class="kids">'+esc(S.kids)+'</div>':'',
    J_TIP:js(fill(F.see_you_on,{date:longDate(S.date,F)})),J_TARGET:js(iso),J_ADDR:js(place),
    F_BLUSH:JSON.stringify(th.F_BLUSH),F_IVORY:JSON.stringify(th.F_IVORY),F_PEACH:JSON.stringify(th.F_PEACH),F_WINE:JSON.stringify(th.F_WINE),F_PETALS:JSON.stringify(th.F_PETALS),BUD0:th.BUD?th.BUD[0]:'',BUD1:th.BUD?th.BUD[1]:''};
  Object.keys(P.text).forEach(function(k){var K=k.toUpperCase();V['T_'+K]=esc(P.text[k]);V['J_T_'+K]=js(P.text[k]);});
  var html=themedTemplate(R,id,S.theme).replace(/%%([A-Z0-9_]+)%%/g,function(m,k){return V.hasOwnProperty(k)?V[k]:m;});
  if(auto&&FEAT.tassel){
    var au='<script>(function(){var t=document.getElementById("tassel"),tip=document.getElementById("pulltip"),done=false;document.getElementById("hand").style.display="none";tip.style.visibility="hidden";'
      +'function go(){if(done)return;if(!document.documentElement.classList.contains("opened")){setTimeout(go,300);return;}done=true;setTimeout(function(){tip.style.visibility="";t.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));},500);}'
      +'if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();go();}},{threshold:.5});io.observe(document.getElementById("pullbox"));}else go();})();<\/script>';
    html=html.replace(/<\/body>|$/,function(m){return au+m;});
  }
  if(opts.mark){
    var tile='<svg xmlns="http://www.w3.org/2000/svg" width="230" height="170"><text x="115" y="95" text-anchor="middle" transform="rotate(-28 115 85)" font-family="Georgia,serif" font-size="26" letter-spacing="4" fill="#2d2422" fill-opacity=".2" stroke="#fff" stroke-opacity=".35" stroke-width=".6">PREVIEW</text></svg>';
    var wm='<div aria-hidden="true" style="position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:url(&quot;data:image/svg+xml;charset=utf-8,'+encodeURIComponent(tile)+'&quot;)"></div>';
    html=html.replace(/<\/body>|$/,function(m){return wm+m;});
  }
  if(opts.preview){
    var extra='<script>(function(){var skip='+(opts.skip?'true':'false')+',y='+(opts.scroll||0)+';'
      +'addEventListener("scroll",function(){try{parent.postMessage({inviteScroll:scrollY},"*");}catch(e){}},{passive:true});'
      +'if(!skip)return;var sc=document.getElementById("scene"),n=0;var t=setInterval(function(){n++;if(sc.classList.contains("ready")){clearInterval(t);sc.style.display="none";document.getElementById("book").click();'
      +'setTimeout(function(){document.body.classList.remove("locked");scrollTo(0,y);},60);}else if(n>120)clearInterval(t);},50);})();<\/script>';
    html=html.replace(/<\/body>|$/,function(m){return extra+m;});
  }
  return html;
}

var InviteEngine={build:build,scriptsIn:scriptsIn,renderOpening:renderOpening,findOpening:findOpening,toGujarati:toGujarati,detectScript:detectScript,openingOpts:openingOpts,OPENING_DEFAULT:OPENING_DEFAULT,STYLES:STYLES,TRAD:TRAD,esc:esc,js:js,fill:fill,time12:time12,waNumber:waNumber,DEFAULT_TEMPLATE:DEFAULT_TEMPLATE,DEFAULT_LANG:DEFAULT_LANG};
if(typeof module!=='undefined'&&module.exports)module.exports=InviteEngine;else root.InviteEngine=InviteEngine;
})(this);
