/* Starting content for new invitations, one sample per tradition.
 * defaults() is the full shape of an invitation's details (S) and the Hindu sample.
 * Shared by the editor and scripts/make-demos.js.
 */
(function (root) {
'use strict';
function placeholder(i){
  var tones=[['#e9ddd0','#cdbba8'],['#dfe3da','#b9c2b0'],['#ead9d3','#cfb1a8'],['#e6e0ef','#bdb3cf'],['#efe6cf','#d3c39a'],['#d9e3e6','#aebfc4']][i%6];
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 960"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+tones[0]+'"/><stop offset="1" stop-color="'+tones[1]+'"/></linearGradient></defs><rect width="640" height="960" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="10" opacity=".7"><rect x="230" y="400" width="180" height="140" rx="16"/><circle cx="320" cy="470" r="38"/></g><text x="320" y="610" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#fff" opacity=".85">Photo '+(i+1)+'</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function defaults(){
  var caps=['By the sea','Racing up together','Reaching for you','Almost touching','Our quiet corner','Two rings, one promise'];
  return {template:'classic',lang:'en',theme:'wine',tradition:'hindu',reveal:'pull',tz:'+05:30',
    name1:'Aastha',name2:'Aakash',rel1:'Daughter of',parents1:'Mr. Rahul Oberoi & Mrs. Rajvi Oberoi',rel2:'Son of',parents2:'Mr. Anil Shah & Mrs. Anjali Shah',
    frontLabel:'Together with their families',inviteLine:'request the pleasure of your company at their wedding',
    coverTitle:'SHUBH VIVAAH',coverSub:'A wedding invitation',
    date:'2026-12-31',time:'19:00',bannerLine:'',
    events:[
      {name:'Mandap Muhurat',date:'2026-12-29',time:'10:00',place:'Oberoi Residence, Malabar Hill',dress:'Traditional wear',c1:'#e9d7ad',c2:'',style:'pujan'},
      {name:'Haldi',date:'2026-12-29',time:'15:00',place:'Poolside, The Oberoi',dress:'Wear yellow',c1:'#f2c230',c2:'',style:'haldi'},
      {name:'Mehndi',date:'2026-12-30',time:'12:00',place:'The Garden Lawn, The Oberoi',dress:'Wear green',c1:'#7f9a62',c2:'',style:'mehendi'},
      {name:'Sangeet',date:'2026-12-30',time:'19:30',place:'The Ballroom, The Oberoi',dress:'Indo-western, purple & pink',c1:'#b48ad0',c2:'#e84393',style:'sangeet'},
      {name:'Wedding & Pheras',date:'2026-12-31',time:'19:00',place:'The Mandap, The Oberoi',dress:'Festive red & gold',c1:'#a3192f',c2:'#d4a84b',style:'pheras'}],
    photos:caps.map(function(c,i){return {src:placeholder(i),caption:c,pos:'50%'};}),cover:2,
    recOn:true,recLabel:'You are invited to the',recTitle:'Grand Reception',recDate:'2026-12-31',recLine:'10:00 pm onwards · Dinner, dance & the New Year countdown',recVenue:'The Terrace, The Oberoi',recChip:'Dress code: black tie & sarees',
    venue:'The Oberoi',address:'Nariman Point, Mumbai 400021',city:'Mumbai',mapArea:'NARIMAN POINT',mapLandmark:'MARINE DRIVE',mapRoad:'NETAJI SUBHASH ROAD',
    closing:'With love from the Oberoi & Shah families',kids:'Come shower us with blessings, not gifts! Your love and presence are all we need. 💕',
    song:'',songName:'',rsvpPhone:'',
    opening:{id:'hi-gen-shri-ganeshay',custom:'',design:'classic',size:'m',color:'gold',gujarati:false,translit:false,meaning:true,ref:true,version:'kjv'}};
}
function sample(k){
  var d=defaults();if(k==='hindu')return d;
  function ev(n,dt,tm,pl,dr,c1,st,sw){return {name:n,date:dt,time:tm,place:pl,dress:dr,c1:c1,c2:'',style:st,swatch:sw!==false};}
  if(k==='muslim')return Object.assign(d,{name1:'Zayan',name2:'Aleena',rel1:'Son of',rel2:'Daughter of',parents1:'Mr. Imran Qureshi & Mrs. Sana Qureshi',parents2:'Mr. Faisal Siddiqui & Mrs. Hina Siddiqui',
    frontLabel:'In the name of Allah, the Most Merciful',inviteLine:'request the honour of your presence at their Nikah',coverTitle:'NIKAH',coverSub:'A wedding invitation',
    date:'2027-03-19',time:'17:00',tz:'+04:00',
    events:[ev('Dholki Night','2027-03-16','19:30','Qureshi Residence, Jumeirah','Festive colours','#b48ad0','sangeet'),ev('Mehndi','2027-03-18','18:00','The Courtyard, Al Noor Gardens','Greens & yellows','#7f9a62','mehendi'),ev('Nikah','2027-03-19','17:00','The Pavilion, Al Noor Gardens','Formal, modest attire','#f3ebe0','nikah')],
    recLabel:'You are invited to the',recTitle:'Walima',recDate:'2027-03-20',recLine:'8:00 pm onwards · Dinner',recVenue:'The Grand Hall, Al Noor Gardens',recChip:'',
    venue:'Al Noor Gardens',address:'Beach Road, Jumeirah, Dubai',city:'Dubai',mapArea:'JUMEIRAH',mapLandmark:'THE LAGOON',mapRoad:'BEACH ROAD',
    closing:'With love and duas, the Qureshi & Siddiqui families',kids:'',
    opening:Object.assign({},d.opening,{id:'mu-bismillah',meaning:false})});
  return Object.assign(d,{name1:'James',name2:'Charlotte',rel1:'',rel2:'',parents1:'',parents2:'',
    frontLabel:'Together with their families',inviteLine:'invite you to celebrate their wedding',coverTitle:'THE WEDDING',coverSub:'An invitation',
    date:'2027-06-19',time:'16:00',tz:'+02:00',
    events:[ev('Welcome Dinner','2027-06-18','19:30','The Terrace, Villa Montalba','Smart casual','#d9bd85','dinner',false),ev('The Ceremony','2027-06-19','16:00','The Olive Garden, Villa Montalba','Black tie optional','#2d2422','ceremony',false),ev('Farewell Brunch','2027-06-20','11:00','The Loggia, Villa Montalba','','#f6d2c8','rings',false)],
    recLabel:'Followed by',recTitle:'Dinner & Dancing',recDate:'2027-06-19',recLine:'6:30 pm onwards · Dinner, toasts & dancing',recVenue:'The Ballroom, Villa Montalba',recChip:'',
    venue:'Villa Montalba',address:'Via dei Cipressi 8, Tuscany, Italy',city:'Tuscany',mapArea:'CHIANTI HILLS',mapLandmark:'OLIVE GROVE',mapRoad:'VIA DEI CIPRESSI',
    closing:'With love, James & Charlotte',kids:'',
    opening:Object.assign({},d.opening,{id:''})});
}
var InviteSamples={defaults:defaults,sample:sample,placeholder:placeholder};
if(typeof module!=='undefined'&&module.exports)module.exports=InviteSamples;else root.InviteSamples=InviteSamples;
})(this);
