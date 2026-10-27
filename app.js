(function(){
  /* 変遷と飾りの章は普段は隠す。D を 5 秒押し続けると表示を切り替える。
     取引先に見せる版で、個別の作り手や経緯を前に出さないため。章の一覧を作る前に消す */
  var reveal=false;try{reveal=localStorage.getItem('reveal')==='1';}catch(e){}
  document.querySelectorAll(reveal?'.unsecret':'.secret').forEach(function(e){e.remove();});
  var dT=0;
  document.addEventListener('keydown',function(e){if(e.repeat||(e.key!=='d'&&e.key!=='D')||e.metaKey||e.ctrlKey||e.altKey||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;clearTimeout(dT);dT=setTimeout(function(){try{localStorage.setItem('reveal',reveal?'0':'1');}catch(x){}location.reload();},5000);});
  ['keyup','blur'].forEach(function(t){(t==='blur'?window:document).addEventListener(t,function(e){if(t==='blur'||e.key==='d'||e.key==='D')clearTimeout(dT);});});

  document.querySelectorAll('a[href^="http"]').forEach(function(a){a.target='_blank';a.rel='noopener';});

  /* ---------- tabs / slides ---------- */
  var slides=[].slice.call(document.querySelectorAll('.slide')), tabs=document.getElementById('tabs'), cur=0;
  var grp=null,lastPart='';slides.forEach(function(s,i){var eb=s.querySelector('.eyebrow'),part=eb&&/^(第\d部|付録)/.test(eb.textContent)?eb.textContent.match(/^(第\d部|付録)/)[0]:'';if(!grp||part!==lastPart){grp=document.createElement('div');grp.className='grp';var sp=document.createElement('span');sp.className='part';sp.textContent=part;grp.appendChild(sp);var row=document.createElement('div');row.className='row';grp.appendChild(row);tabs.appendChild(grp);lastPart=part;}var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.innerHTML='<span class="n">'+i+'</span>'+s.dataset.title;b.addEventListener('click',function(){go(i);});grp.querySelector('.row').appendChild(b);});
  var tabBtns=[].slice.call(tabs.querySelectorAll('button'));
  /* 章の移動は履歴に積み、各履歴にスクロール位置を持たせる。ブラウザの戻る（Mac の2本指スワイプ、Cmd+[）でも元の位置に戻すため */
  var scrollPos={};
  try{history.scrollRestoration='manual';}catch(e){}
  function setState(push,top){try{history[push?'pushState':'replaceState']({s:cur,y:top},'','#'+slides[cur].id);}catch(e){}}
  function go(i,how,y){
    scrollPos[cur]=window.scrollY;
    if(how!=='init'&&how!=='pop'&&how!=='hash')setState(false,window.scrollY);
    cur=(i+slides.length)%slides.length;
    slides.forEach(function(s,k){s.classList.toggle('active',k===cur);});
    tabBtns.forEach(function(b,k){b.setAttribute('aria-selected',k===cur?'true':'false');if(k===cur)b.scrollIntoView({block:'nearest',inline:'nearest'});});
    document.getElementById('prog').style.width=((cur+1)/slides.length*100)+'%';
    document.getElementById('footl').textContent=(cur+1)+' / '+slides.length;
    var pv=document.getElementById('prev2'),nx=document.getElementById('next2');pv.disabled=cur===0;nx.disabled=cur===slides.length-1;document.getElementById('prev').disabled=cur===0;document.getElementById('next').disabled=cur===slides.length-1;
    pv.textContent=cur>0?'← '+slides[cur-1].dataset.title:'';nx.textContent=cur<slides.length-1?slides[cur+1].dataset.title+' →':'';
    var top=y==='end'?maxY():y!=null?y:(scrollPos[cur]||0);
    if(how!=='pop')setState(how==null,top);
    pull.hidden=cur===slides.length-1;pullUp.hidden=cur===0;over=0;showPull();
    window.scrollTo({top:top});
    if(window.drawSpace)setTimeout(window.drawSpace,0);
    /* 図の高さが後から決まる章もあるので、末尾に着けたいときは描画後にもう一度合わせる */
    if(y==='end')setTimeout(function(){window.scrollTo(0,maxY());lockY=window.scrollY;},0);
  }
  ['prev','prev2'].forEach(function(id){document.getElementById(id).addEventListener('click',function(){go(cur-1);});});
  ['next','next2'].forEach(function(id){document.getElementById(id).addEventListener('click',function(){go(cur+1);});});
  document.addEventListener('keydown',function(e){var t=e.target;if(/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)||t.isContentEditable||document.querySelector('dialog[open]'))return;if(e.key==='ArrowRight'){go(cur+1);}if(e.key==='ArrowLeft'){go(cur-1);}});
  /* 今の位置を履歴に書き戻す。回数制限のあるブラウザがあるので間引く */
  var saveT=0;window.addEventListener('scroll',function(){clearTimeout(saveT);saveT=setTimeout(function(){setState(false,window.scrollY);},200);},{passive:true});

  /* 末尾でさらに下へ引くと次の章へ、先頭でさらに上へ引くと前の章へ。
     トラックパッドは指を離した後も慣性の wheel が 1 秒以上続く。慣性で端に着いただけでは送らず、
     端に着いてから始めた新しいスワイプだけを数える。新しいスワイプは、間が空いたこと、
     向きが変わったこと、慣性で減っていく量が急に増えたことで見分ける。
     章を送った後は、残りの慣性で新しい章が流れないように止める。指を離した直後の量の跳ねを
     新しいスワイプと誤認しないよう、止めている間は間が空くか向きが変わるまで解かない。最長 1 秒 */
  var pull=document.getElementById('pull'),pullUp=document.getElementById('pullup'),PULL=160;
  var over=0,armed=0,lastW=0,lastDy=0,minDy=0,lockUntil=0,lockY=0,resetT=0;
  function maxY(){var se=document.scrollingElement||document.documentElement;return se.scrollHeight-se.clientHeight;}
  function showPull(){var p=Math.min(Math.abs(over)/PULL,1);
    pull.style.setProperty('--p',over>0?p:0);pullUp.style.setProperty('--p',over<0?p:0);
    pullUp.classList.toggle('on',over<0);
    if(over<0){var hd=document.querySelector('header.top');pullUp.style.top=(hd?hd.getBoundingClientRect().bottom:0)+'px';}}
  window.addEventListener('wheel',function(e){
    var now=Date.now(),gap=now-lastW,
        dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1),ady=Math.abs(dy),
        fresh=gap>250||dy*lastDy<0||ady>minDy*2+8;
    var lastDyPrev=lastDy;lastW=now;lastDy=dy;minDy=fresh?ady:Math.min(minDy,ady);
    if(lockUntil){if(now<lockUntil&&gap<=250&&dy*lastDyPrev>=0){if(e.cancelable)e.preventDefault();return;}lockUntil=0;}
    if((pop&&pop.open)||dy===0)return;
    if(fresh){over=0;var y=window.scrollY;
      armed=dy>0&&y>=maxY()-4&&cur<slides.length-1?1:dy<0&&y<=0&&cur>0?-1:0;}
    if(!armed||dy*armed<0){if(over){armed=0;over=0;showPull();}return;}
    if(e.cancelable)e.preventDefault();
    over+=dy;showPull();
    clearTimeout(resetT);resetT=setTimeout(function(){over=0;armed=0;showPull();},300);
    if(Math.abs(over)>=PULL){var dir=armed;armed=0;over=0;lockUntil=now+1000;
      go(dir>0?cur+1:cur-1,null,dir>0?0:'end');lockY=window.scrollY;}
  },{passive:false});
  window.addEventListener('scroll',function(){if(lockUntil&&Date.now()<lockUntil&&Math.abs(window.scrollY-lockY)>1)window.scrollTo(0,lockY);},{passive:true});

  /* 章の中の要素を指すリンク（#marchionini など）は、その章を開いてから要素まで送る */
  function hashEl(){var el=document.getElementById(location.hash.replace('#',''));return el&&!el.classList.contains('slide')?el:null;}
  function idxOfHash(){var h=location.hash.replace('#',''),k=slides.findIndex(function(s){return s.id===h;}),el=hashEl();return k<0&&el?slides.indexOf(el.closest('.slide')):k;}
  var st=history.state,idx=idxOfHash();
  go(idx>=0?idx:0,'init',st&&st.s===idx&&typeof st.y==='number'?st.y:0);
  if(hashEl())hashEl().scrollIntoView();
  window.addEventListener('popstate',function(e){var s=e.state;
    if(s&&typeof s.s==='number'){go(s.s,'pop',s.y||0);return;}
    var k=idxOfHash(),el=hashEl();if(k>=0)go(k,'hash',0);if(el)el.scrollIntoView();});

  /* ---------- pendulum space ---------- */
  var tracks=[
    {c:'#8a8a85',m:'ah-s',pts:[[1925,.12,'バウハウス','bauhaus'],[1958,.08,'スイスデザイン','swiss'],[1973,.55,'Xerox Alto','alto']]},
    {c:'#0074c8',m:'ah-a',pts:[[1984,.68,'Macintosh','mac'],[2001,.90,'Aqua','aqua'],[2007,.95,'iPhone OS','ios1'],[2013,.15,'iOS 7','ios7'],[2020,.35,'Big Sur','bigsur'],[2023,.80,'visionOS','vision'],[2025,.86,'Liquid Glass','glass']]},
    {c:'#2e7d32',m:'ah-g',pts:[[2011,.2,'Holo','holo'],[2014,.30,'Material','mat'],[2021,.28,'Material You','you']]},
    {c:'#7b4fa0',m:'ah-m',pts:[[1995,.58,'Windows 95','w95'],[2007,.85,'Aero','aero'],[2010,.05,'Metro','metro'],[2017,.50,'Fluent','fluent'],[2021,.45,'Windows 11','w11']]}];
  var space=document.getElementById('space'),lines=document.getElementById('spacelines'),spacesvg=document.getElementById('spacesvg');
  function drawSpace(){
    if(!space)return;var W=space.clientWidth;if(W<300)return;var x0=100,x1=W-120,y0=30,ymin=1917,split=1984,ymax=2028,k1=6,k2=48;
    function Y(y){return y0+(y<split?(y-ymin)*k1:(split-ymin)*k1+(y-split)*k2)}
    var y1=Y(ymax),H=y1+40;
    space.style.height=(H+60)+'px';spacesvg.setAttribute('viewBox','0 0 '+W+' '+H);spacesvg.setAttribute('width',W);spacesvg.setAttribute('height',H);
    function X(v){return x0+(x1-x0)*v}
    var s='<line x1="'+((x0+x1)/2)+'" y1="'+y0+'" x2="'+((x0+x1)/2)+'" y2="'+y1+'" stroke="var(--line)" stroke-dasharray="4 4"/>';
    for(var yr=1920;yr<=2025;yr+=(yr<1980?20:5)){s+='<line x1="'+x0+'" y1="'+Y(yr)+'" x2="'+x1+'" y2="'+Y(yr)+'" stroke="var(--line)"/><text x="'+(x0-10)+'" y="'+(Y(yr)+4)+'" text-anchor="end" font-family="var(--mono)" font-size="11" fill="var(--muted)">'+yr+'</text>';}
    tracks.forEach(function(t){for(var i=1;i<t.pts.length;i++){var p=t.pts[i-1],e=t.pts[i];
      s+='<line x1="'+X(p[1])+'" y1="'+Y(p[0])+'" x2="'+X(e[1])+'" y2="'+Y(e[0])+'" stroke="'+t.c+'" stroke-width="2" marker-end="url(#'+t.m+')"/>';}
      t.pts.forEach(function(e){s+='<circle cx="'+X(e[1])+'" cy="'+Y(e[0])+'" r="5.5" fill="'+t.c+'"/>';});});
    var placed=[],MW=110,MH=140,GAP=10;
    function overlaps(r){return placed.some(function(q){return r.x<q.x+q.w+GAP&&r.x+r.w+GAP>q.x&&r.y<q.y+q.h+GAP&&r.y+r.h+GAP>q.y;});}
    function minDist(r){var d=1e9;placed.forEach(function(q){var dx=Math.max(q.x-(r.x+r.w),r.x-(q.x+q.w),0),dy=Math.max(q.y-(r.y+r.h),r.y-(q.y+q.h),0);d=Math.min(d,Math.sqrt(dx*dx+dy*dy));});return d;}
    var all=[];tracks.forEach(function(t){t.pts.forEach(function(e){all.push([t,e]);});});
    all.sort(function(p,q){return p[1][0]-q[1][0];});
    all.forEach(function(te){var t=te[0],e=te[1],x=X(e[1]),y=Y(e[0])+40;
      var m=space.querySelector('.mock[data-key="'+e[3]+'"]'),best=null,bestScore=-1e9;
      for(var ring=1;ring<=4;ring++){var R=70+ring*70;for(var a=0;a<360;a+=20){var cx=x+R*Math.cos(a*Math.PI/180),cy=y+R*Math.sin(a*Math.PI/180);
        var r={x:cx-MW/2,y:cy-MH/2,w:MW,h:MH};if(r.x<x0-90||r.x+r.w>W||r.y<40||r.y+r.h>H+40)continue;if(overlaps(r))continue;
        var score=Math.min(minDist(r),160)-0.6*R;if(score>bestScore){bestScore=score;best=r;}}
        if(best&&ring>=2)break;}
      if(!best)best={x:x+14,y:y-34,w:MW,h:MH};
      placed.push(best);m.style.left=best.x+'px';m.style.top=best.y+'px';
      var lx=best.x+MW/2,ly=best.y+34;
      s+='<line x1="'+x+'" y1="'+(y-40)+'" x2="'+lx+'" y2="'+(ly-40)+'" stroke="'+t.c+'" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>';
    });
    [[1984,'マウス（Macintosh で普及）'],[2007,'タッチ（iPhone）'],[2023,'空間（Vision Pro。視線と手で操作する立体表示）']].forEach(function(d){var yy=Y(d[0]);
      s+='<line x1="'+x0+'" y1="'+yy+'" x2="'+x1+'" y2="'+yy+'" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/><text x="'+x1+'" y="'+(yy-6)+'" text-anchor="end" font-family="var(--mono)" font-size="11" fill="var(--accent)">新しい入力装置：'+d[1]+'</text>';});
    lines.innerHTML=s;
  }
  window.drawSpace=drawSpace;drawSpace();
  if(space){if(window.ResizeObserver){var rto;new ResizeObserver(function(){clearTimeout(rto);rto=setTimeout(drawSpace,80);}).observe(space);}else{window.addEventListener('resize',drawSpace);}}

  /* ---------- responsive ---------- */
  var rw=document.getElementById('rwrap'),rb=document.getElementById('rplay');
  (function(){
    var frame=rw.querySelector('.rframe'),bar=rw.querySelector('.rprog'),W=rw.clientWidth||1000;
    var kf=[[0,340],[.10,340],[.22,640],[.32,640],[.44,W],[.58,W],[.70,640],[.80,640],[.92,340],[1,340]];
    function bez(t,a,b,cc,d){var x=t,i;for(i=0;i<8;i++){var cx=3*a*x*(1-x)*(1-x)+3*cc*x*x*(1-x)+x*x*x-t,dx=3*a*(1-x)*(1-3*x)+3*cc*x*(2-3*x)+3*x*x;if(Math.abs(dx)<1e-6)break;x-=cx/dx;}return 3*b*x*(1-x)*(1-x)+3*d*x*x*(1-x)+x*x*x;}
    function width(p){for(var i=1;i<kf.length;i++){if(p<=kf[i][0]){var p0=kf[i-1][0],p1=kf[i][0],w0=kf[i-1][1],w1=kf[i][1];if(w0===w1)return w0;var u=(p-p0)/(p1-p0);return w0+(w1-w0)*bez(u,.2,0,0,1);}}return kf[kf.length-1][1];}
    var N=400,segs=[],prev=null,eps=0.8;
    for(var k=0;k<N;k++){var p=k/N,dw=Math.abs(width(p+1/N)-width(p));var moving=dw>eps;if(prev===null||moving!==prev){segs.push([p,moving]);prev=moving;}}
    var stops=[];segs.forEach(function(sg,i){var end=(i+1<segs.length)?segs[i+1][0]:1;stops.push((sg[1]?'transparent':'var(--main-soft)')+' '+(sg[0]*100).toFixed(1)+'% '+(end*100).toFixed(1)+'%');});
    bar.style.background='linear-gradient(90deg,'+stops.join(',')+')';
  })();
  rb.addEventListener('click',function(){rw.classList.toggle('paused');rb.textContent=rw.classList.contains('paused')?'動きを再開する':'動きを止める';});


  /* ---------- gestalt ---------- */
  document.querySelectorAll('#skr .card:not(.static), #skr2 .card, #laws .card:not(.static), #nng .card:not(.static)').forEach(function(c){c.setAttribute('role','button');function sync(){c.setAttribute('aria-pressed',c.classList.contains('on')?'true':'false');}sync();function f(){c.classList.toggle('on');sync();}c.addEventListener('click',function(e){if(e.target.closest('input,button,label,a,[data-tip]'))return;f();});c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();f();}});});

  /* ---------- NN/g 5: postal code ---------- */
  var zg=document.querySelector('.zip-good'),zb=document.querySelector('.zip-bad'),zs=document.querySelector('.zip-send'),zo=document.querySelector('.zip-out');
  if(zg){zg.addEventListener('input',function(){var d=zg.value.replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-0xFEE0);}).replace(/\D/g,'').slice(0,7);zg.value=d.length>3?d.slice(0,3)+'-'+d.slice(3):d;});
    zs.addEventListener('click',function(){var ok=/^\d{3}-?\d{4}$/.test(zb.value);zo.textContent=ok?'送信しました':'入力内容に誤りがあります';zo.className='zip-out '+(ok?'':'err');});}

  /* ---------- color wheel ---------- */
  var BASE=205, wheel=document.getElementById('wheel');
  function hsl(h,sa,l){return 'hsl('+((h%360+360)%360)+' '+sa+'% '+l+'%)'}
  function pol(cx,cy,r,a){var t=(a-90)*Math.PI/180;return [cx+r*Math.cos(t),cy+r*Math.sin(t)]}
  var ws='';
  for(var i=0;i<12;i++){var a0=i*30-15,a1=i*30+15,p0=pol(160,160,140,a0),p1=pol(160,160,140,a1),q0=pol(160,160,92,a0),q1=pol(160,160,92,a1);
    ws+='<path d="M'+p0[0]+' '+p0[1]+' A140 140 0 0 1 '+p1[0]+' '+p1[1]+' L'+q1[0]+' '+q1[1]+' A92 92 0 0 0 '+q0[0]+' '+q0[1]+'z" fill="'+hsl(i*30,80,50)+'"/>';
    var lp=pol(160,160,152,i*30);ws+='<text x="'+lp[0]+'" y="'+(lp[1]+4)+'" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--muted)">'+(i*30)+'</text>';}
  ws+='<g id="wsel"></g>';
  wheel.innerHTML=ws;
  var schemes=[
    ['単色',[0]],
    ['類似色',[0,30,-30]],
    ['補色',[0,180]],
    ['分裂補色',[0,150,210]],
    ['三色',[0,120,240]],
    ['四色（正方形）',[0,90,180,270]],
    ['四色（長方形）',[0,60,180,240]]];
  var rows=[].slice.call(document.querySelectorAll('#schemetable tr')).slice(1),sw=document.getElementById('swatches'),wsel=document.getElementById('wsel');
  function showScheme(k){
    rows.forEach(function(r,i){r.classList.toggle('on',i===k);r.setAttribute('aria-selected',i===k?'true':'false');});
    var sc=schemes[k],pts=sc[1].map(function(d){return pol(160,160,116,BASE+d)}),t='';
    if(pts.length>1){t+='<polygon points="'+pts.map(function(p){return p.join(',')}).join(' ')+'" fill="none" stroke="var(--fg)" stroke-width="2"/>';}
    pts.forEach(function(p,i){t+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i?7:10)+'" fill="'+(i?'var(--fg)':'none')+'" stroke="var(--fg)" stroke-width="3"/>';});
    wsel.innerHTML=t;
    sw.innerHTML=sc[1].map(function(d){var hh=(BASE+d+360)%360;return '<div style="background:'+hsl(hh,80,45)+'">'+hh+'°</div>'}).join('');
  }
  rows.forEach(function(r,k){r.tabIndex=0;r.addEventListener('click',function(){showScheme(k)});r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();showScheme(k);}});});
  showScheme(2);
  var tn=document.getElementById('tones'),th='';
  function trow(name,sub,cells){th+='<div class="nm">'+name+'<small>'+sub+'</small></div><div class="row">'+cells.map(function(x){return '<div style="background:'+x[0]+';color:'+(x[1]||'#fff')+'">'+(x[2]||'')+'</div>'}).join('')+'</div>';}
  trow('単色・明度の段','同じ色相で明度だけ変える。地から文字までの階調',[10,20,30,40,50,60,70,80,90,96].map(function(l){return ['hsl(205 100% '+l+'%)',l>55?'#14202b':'#fff','L'+l]}));
  trow('単色・彩度の段','同じ色相と明度で彩度だけ変える。無彩に近づく',[0,10,20,35,50,65,80,100].map(function(sa){return ['hsl(205 '+sa+'% 45%)','#fff','S'+sa]}));
  trow('トーン・オン・トーン','同じ色相で明度差の大きい二つを組む',[['hsl(205 100% 22%)','#fff','L22'],['hsl(205 100% 85%)','#14202b','L85'],['hsl(205 100% 30%)','#fff','L30'],['hsl(205 100% 92%)','#14202b','L92']]);
  trow('トーン・イン・トーン','明度と彩度を揃えて色相を変える。カテゴリ色向け',[205,25,120,300,60].map(function(hh){return ['hsl('+hh+' 60% 55%)','#14202b',hh+'°']}));
  trow('ドミナントトーン','一つのトーン（ここでは淡）で全色相を統一',[205,25,120,300,60,160].map(function(hh){return ['hsl('+hh+' 70% 88%)','#14202b','']}));
  trow('カマイユ','色相もトーンもごく近い色だけで組む。静かで上品',[[195,48],[205,50],[215,52],[225,50]].map(function(p){return ['hsl('+p[0]+' 70% '+p[1]+'%)','#fff',p[0]+'°']}));
  th+='<div class="nm">グラデーション<small>連続的な変化。数量の大小を色で示す</small></div><div class="row"><div style="background:linear-gradient(90deg,hsl(205 100% 92%),hsl(205 100% 20%));color:#fff">少 → 多</div></div>';
  tn.innerHTML=th;

  /* ---------- palette with contrast ---------- */
  function lum(hex){var c=hex.replace('#','');var r=parseInt(c.substr(0,2),16)/255,g=parseInt(c.substr(2,2),16)/255,b=parseInt(c.substr(4,2),16)/255;
    function f(v){return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}return .2126*f(r)+.7152*f(g)+.0722*f(b)}
  function cr(a,b){var x=lum(a),y=lum(b);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(1)}
  var light=[['ベース','#f3f6f9','#14202b'],['文字','#14202b','#f3f6f9'],['メイン 青','#0074c8','#ffffff'],['アクセント 橙','#bf4e0c','#ffffff'],['状態 エラー','#c62828','#ffffff'],['状態 警告','#8a6d00','#ffffff'],['状態 成功','#2e7d32','#ffffff']];
  var dark=[['ベース','#121820','#e8edf2'],['文字','#e8edf2','#121820'],['メイン','#5aaef0','#121820'],['アクセント','#ff8c42','#121820'],['状態 エラー','#ef6b6b','#121820'],['状態 警告','#e0b84a','#121820'],['状態 成功','#6fbf73','#121820']];
  var tt=document.getElementById('themetable'),th2='<tr><th>面</th>';
  light.forEach(function(c){th2+='<th>'+c[0]+'</th>';});th2+='</tr>';
  [['light','明',light],['dark','暗',dark]].forEach(function(m){th2+='<tr data-theme="'+m[0]+'" tabindex="0"><td>'+m[1]+'</td>';m[2].forEach(function(c){th2+='<td><i class="csw" style="background:'+c[1]+'"></i><span class="num">'+c[1]+'<br>対比 '+cr(c[1],c[2])+'</span></td>';});th2+='</tr>';});
  tt.innerHTML=th2;
  var trows=[].slice.call(tt.querySelectorAll('tr[data-theme]'));
  function markTheme(){var cur=document.documentElement.dataset.theme||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');trows.forEach(function(r){r.classList.toggle('on',r.dataset.theme===cur);});}
  trows.forEach(function(r){function f(){document.documentElement.dataset.theme=r.dataset.theme;markTheme();}r.addEventListener('click',f);r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();f();}});});
  markTheme();

  /* ---------- motion ---------- */
  var ed=document.getElementById('easedemo'),ep=document.getElementById('easeplay'),eTimer=null,eRun=true;
  var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function eLoop(){ed.classList.toggle('go');eTimer=setTimeout(eLoop,ed.classList.contains('go')?2600:1600);}
  if(!rm){eTimer=setTimeout(eLoop,600);}
  ep.textContent=rm?'動かす':'止める';
  ep.addEventListener('click',function(){if(rm){ed.classList.toggle('go');return;}eRun=!eRun;if(eRun){eTimer=setTimeout(eLoop,200);ep.textContent='止める';}else{clearTimeout(eTimer);ep.textContent='再開';}});
  document.querySelectorAll('.erow .cv').forEach(function(el){var b=el.dataset.cv.split(',').map(Number),S=52,o=6;function px(x){return o+x*S}function py(y){return o+S-y*S}
    el.innerHTML='<svg viewBox="0 0 64 64"><rect x="'+o+'" y="'+o+'" width="'+S+'" height="'+S+'" fill="none" stroke="var(--line)"/><path d="M'+px(0)+' '+py(0)+' C '+px(b[0])+' '+py(b[1])+', '+px(b[2])+' '+py(b[3])+', '+px(1)+' '+py(1)+'" fill="none" stroke="var(--main)" stroke-width="2"/><line x1="'+px(0)+'" y1="'+py(0)+'" x2="'+px(b[0])+'" y2="'+py(b[1])+'" stroke="var(--accent)"/><line x1="'+px(1)+'" y1="'+py(1)+'" x2="'+px(b[2])+'" y2="'+py(b[3])+'" stroke="var(--accent)"/></svg>';});

  /* ---------- part 2 demos ---------- */
  document.querySelectorAll('.doherty .btn').forEach(function(b){b.addEventListener('click',function(){var out=b.parentNode.querySelector('.out');out.textContent='…';var t0=Date.now();setTimeout(function(){b.classList.add('pressed');out.textContent=(Date.now()-t0)+'ms 後に反応';setTimeout(function(){b.classList.remove('pressed')},300);},+b.dataset.ms);});});
  document.querySelectorAll('.wait-btn').forEach(function(b){b.addEventListener('click',function(){
    var box=document.getElementById(b.dataset.mode==='slow'?'wd-slow':'wd-fast');
    var rows='<div class="row">ランニングシューズ <span class="num">¥8,900</span></div><div class="row">トレイルシューズ <span class="num">¥12,800</span></div><div class="row">ウォーキングシューズ <span class="num">¥6,500</span></div>';
    if(b.dataset.mode==='slow'){box.innerHTML='<div class="spin">読み込んでいます</div>';setTimeout(function(){box.innerHTML='<div class="cnt">128 件</div>'+rows;},2500);}
    else{box.innerHTML='<div class="cnt">候補から 3 件</div><div class="sk"></div><div class="sk"></div><div class="sk"></div>';
      setTimeout(function(){box.innerHTML='<div class="cnt">上位 3 件（集計中）</div>'+rows;},180);
      setTimeout(function(){box.querySelector('.cnt').textContent='128 件';},1100);}
  });});
  var undo=document.getElementById('undo'),toast=document.getElementById('toast'),uTimer=null,uRow=null;
  undo.querySelectorAll('.del').forEach(function(b){b.addEventListener('click',function(){if(uRow){uRow.remove();}uRow=b.parentNode;uRow.classList.add('gone');var n=5;toast.hidden=false;toast.querySelector('.cd').textContent=n+'s';clearInterval(uTimer);uTimer=setInterval(function(){n--;toast.querySelector('.cd').textContent=n+'s';if(n<=0){clearInterval(uTimer);toast.hidden=true;if(uRow){uRow.remove();uRow=null;}}},1000);});});
  toast.querySelector('.undo-btn').addEventListener('click',function(){clearInterval(uTimer);toast.hidden=true;if(uRow){uRow.classList.remove('gone');uRow=null;}});
  var dbl=document.getElementById('dblbtn'),dblout=document.getElementById('dblout'),sent=0;
  dbl.addEventListener('click',function(){dbl.disabled=true;sent++;dblout.textContent='送信中… 送信回数 '+sent;setTimeout(function(){dbl.disabled=false;dblout.textContent='完了。送信回数 '+sent;},1200);});

  /* ---------- fzf demo ---------- */
  var FZ=[['帝都の火災、三日に及ぶ','1923-09-04 朝刊1面','関東大震災後の火災の状況を報じる。teito kasai'],['救護班、横浜へ','1923-09-05 朝刊2面','医療班の派遣を決定。kyugohan yokohama'],['復興院の設置決まる','1923-09-27 夕刊1面','帝都復興院の設置。fukkoin'],['一周年、慰霊祭','1924-09-01 朝刊3面','震災から一年。irei'],['後藤新平、復興計画を語る','1923-10-02 朝刊1面','goto shinpei fukko keikaku'],['帝都復興計画の縮小','1924-02-14 朝刊2面','予算削減。fukko keikaku'],['震災誌','1925 図書 東京市','shinsaishi 東京市編'],['関東大震災と横浜','1973 図書','kanto daishinsai yokohama'],['大正大震火災誌','1924 図書 警視庁','taisho daishin kasai'],['震災復興と都市計画','1988 図書','fukko toshi keikaku'],['流言と震災','1924-09-10 夕刊','ryugen shinsai'],['避難民、上野公園に','1923-09-03 朝刊','hinanmin ueno'],['義援金の募集','1923-09-08 朝刊','gienkin'],['電車、一部で運転再開','1923-09-11 夕刊','densha unten saikai'],['帝都復興祭','1930-03-24 朝刊1面','fukkosai'],['隅田川に新橋','1928-05-03 朝刊','sumidagawa shinbashi'],['同潤会アパート竣工','1926-08-12 朝刊','dojunkai apart'],['震災記念堂','1930-09-01 朝刊','kinendo'],['後藤新平伝','1937 図書','goto shinpei den'],['関東大震災の社会史','2011 図書','shakaishi'],['東京百年史 第4巻','1972 図書','tokyo hyakunenshi'],['災害と日本人','1995 図書','saigai nihonjin'],['横浜市震災誌','1926 図書 横浜市','yokohama shinsaishi'],['鎌倉の震災','1923-09-06 朝刊','kamakura shinsai']];
  var fzq=document.getElementById('fzq'),fzl=document.getElementById('fzlist'),fzc=document.getElementById('fzcnt'),fzp=document.getElementById('fzprev'),fzsel=0,fzres=[];
  function norm(s){return s.toLowerCase().replace(/[\uff01-\uff5e]/g,function(ch){return String.fromCharCode(ch.charCodeAt(0)-0xfee0)}).replace(/[\u30a1-\u30f6]/g,function(ch){return String.fromCharCode(ch.charCodeAt(0)-0x60)});}
  function fzmatch(q,text){var t=norm(text),pos=[],i=0;for(var k=0;k<q.length;k++){var ch=q[k];if(ch===' ')continue;var idx=t.indexOf(ch,i);if(idx<0)return null;pos.push(idx);i=idx+1;}
    var score=0;for(var p=1;p<pos.length;p++){score+=(pos[p]-pos[p-1]===1)?3:0;}score-=pos.length?pos[0]*0.1:0;return {pos:pos,score:score};}
  function fzhl(text,pos){var out='',set={};pos.forEach(function(p){set[p]=1;});for(var i=0;i<text.length;i++){out+=set[i]?'<b>'+text[i]+'</b>':text[i];}return out;}
  function fzrun(){var q=norm(fzq.value);fzres=[];FZ.forEach(function(it,i){var full=it[0]+' '+it[1]+' '+it[2];var m=q?fzmatch(q,full):{pos:[],score:0};if(m)fzres.push({i:i,m:m,full:full});});
    fzres.sort(function(a,b){return b.m.score-a.m.score});fzsel=Math.min(fzsel,Math.max(0,fzres.length-1));
    fzc.textContent=fzres.length+'/'+FZ.length;
    fzl.innerHTML=fzres.map(function(r,k){var it=FZ[r.i];var hl=fzhl(it[0]+'  '+it[1],r.m.pos.filter(function(p){return p<it[0].length+2+it[1].length}));return '<li class="'+(k===fzsel?'sel':'')+'">'+hl+'</li>';}).join('');
    var s=fzres[fzsel];fzp.innerHTML=s?'<b>'+FZ[s.i][0]+'</b><span class="m">'+FZ[s.i][1]+'</span><div>'+FZ[s.i][2]+'</div>':'<span class="m">該当なし。条件を緩めるか、別の断片で。</span>';
    var li=fzl.children[fzsel];if(li&&li.scrollIntoView)li.scrollIntoView({block:'nearest'});}
  fzq.addEventListener('input',function(){fzsel=0;fzrun();});
  fzq.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();fzsel=Math.min(fzsel+1,fzres.length-1);fzrun();}if(e.key==='ArrowUp'){e.preventDefault();fzsel=Math.max(fzsel-1,0);fzrun();}});
  fzl.addEventListener('click',function(e){var li=e.target.closest('li');if(!li)return;fzsel=[].indexOf.call(fzl.children,li);fzrun();});
  fzrun();

  /* ---------- JR ----------
     JR 東日本アプリの乗換結果に外観を寄せた模式図。候補ごとの縦長のカプセル、区間ごとの路線色の線と記号、
     乗換駅名、上に所要時間と出発、下に乗換回数・到着・運賃・早楽安の札。縦位置は時刻に比例する。
     後の候補ほど右下に来るので、全体に画面の枠を重ね、枠の外を薄くして斜めのスクロールを示す */
  var jr=document.getElementById('jr'),W=560,H=520,T0=600,PX=3.6,Y0=96,CW=58,GAP=60;
  var LINES={JK:'#00b2e5',JY:'#80c241',JC:'#f15a22'};
  var cands=[
    {segs:[[602,619,'JK'],[624,641,'JY']],via:['田端'],fare:570},
    {segs:[[607,636,'JY']],via:[],fare:570,tags:['早','楽']},
    {segs:[[612,616,'JC'],[620,633,'JK'],[638,653,'JY']],via:['神田','田端'],fare:480,tags:['安']},
    {segs:[[618,632,'JC'],[637,649,'JY']],via:['新宿'],fare:650},
    {segs:[[624,641,'JK'],[646,656,'JY']],via:['田端'],fare:570},
    {segs:[[631,645,'JC'],[650,662,'JY']],via:['新宿'],fare:650},
    {segs:[[637,666,'JY']],via:[],fare:570,tags:['楽']},
    {segs:[[644,661,'JK'],[666,683,'JY']],via:['田端'],fare:570},
    {segs:[[651,680,'JY']],via:[],fare:570,tags:['楽']}];
  var TAG={'早':'#1f9bd1','楽':'#4caf72','安':'#e0a030'};
  var SCR={x:4,y:4,w:372,h:400,r:20};
  function TY(m){return Y0+(m-T0)*PX} function hm(m){return Math.floor(m/60)+':'+('0'+m%60).slice(-2)}
  var j='<rect width="'+W+'" height="'+H+'" fill="#fff"/>';
  for(var m=T0;m<=T0+(H-Y0)/PX;m+=10)j+='<line class="grid" x1="0" y1="'+TY(m)+'" x2="'+W+'" y2="'+TY(m)+'"/>';
  j+='<line x1="0" y1="'+TY(T0)+'" x2="'+(SCR.x+SCR.w-46)+'" y2="'+TY(T0)+'" class="now"/><text x="'+(SCR.x+SCR.w-8)+'" y="'+(TY(T0)+4)+'" text-anchor="end" class="nowt">10:00</text>';
  cands.forEach(function(c,i){var x=40+i*GAP,dep=c.segs[0][0],arr=c.segs[c.segs.length-1][1],top=TY(dep)-10,bot=TY(arr)+48;
    j+='<rect x="'+(x-CW/2+4)+'" y="'+top+'" width="'+(CW-8)+'" height="'+(bot-top)+'" rx="'+((CW-8)/2)+'" class="cap"/>';
    j+='<text x="'+x+'" y="'+(top-22)+'" text-anchor="middle" class="dur">'+(arr-dep)+'分</text><text x="'+x+'" y="'+(top-7)+'" text-anchor="middle" class="tm">'+hm(dep)+'</text>';
    c.segs.forEach(function(sg,k){var y1=TY(sg[0])+4,y2=TY(sg[1])-4,col=LINES[sg[2]],mid=(y1+y2)/2;
      j+='<line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'" stroke="'+col+'" stroke-width="9" stroke-linecap="round"/>';
      if(y2-y1>26)j+='<rect x="'+(x-13)+'" y="'+(mid-11)+'" width="26" height="22" rx="3" fill="#fff" stroke="'+col+'" stroke-width="2.5"/><text x="'+x+'" y="'+(mid+4)+'" text-anchor="middle" class="sym">'+sg[2]+'</text>';
      if(k>0){var g=(TY(c.segs[k-1][1])+TY(sg[0]))/2;j+='<text x="'+x+'" y="'+(g+4)+'" text-anchor="middle" class="st">'+c.via[k-1]+'</text>';}});
    var cy=TY(arr)+24;
    j+='<circle cx="'+x+'" cy="'+cy+'" r="17" fill="#fff"/><text x="'+x+'" y="'+(cy-3)+'" text-anchor="middle" class="xf">乗換</text><text x="'+x+'" y="'+(cy+10)+'" text-anchor="middle" class="xn">'+(c.segs.length-1)+'回</text>';
    j+='<text x="'+x+'" y="'+(bot+18)+'" text-anchor="middle" class="tm">'+hm(arr)+'</text><text x="'+x+'" y="'+(bot+33)+'" text-anchor="middle" class="fare">'+c.fare.toLocaleString()+'円</text>';
    (c.tags||[]).forEach(function(t,k,a){var tx=x-(a.length*18-2)/2+k*18;j+='<rect x="'+tx+'" y="'+(bot+40)+'" width="16" height="16" rx="8" fill="'+TAG[t]+'"/><text x="'+(tx+8)+'" y="'+(bot+52)+'" text-anchor="middle" class="tag">'+t+'</text>';});});
  /* 画面の枠を固定し、中身だけを右下へ斜めにスクロールさせる（CSS のアニメーション） */
  var s=SCR,frame='<rect x="'+s.x+'" y="'+s.y+'" width="'+s.w+'" height="'+s.h+'" rx="'+s.r+'"/>';
  j='<defs><clipPath id="jrclip">'+frame+'</clipPath></defs><g clip-path="url(#jrclip)"><g class="jrc" transform="translate('+s.x+' '+s.y+')"><g class="jrm">'+j+'</g></g>'+
    '<rect x="'+s.x+'" y="'+s.y+'" width="'+s.w+'" height="40" fill="#3d4f5f"/><text x="'+(s.x+s.w/2)+'" y="'+(s.y+25)+'" text-anchor="middle" class="hd">東京 → 池袋</text></g>'+
    '<rect x="'+s.x+'" y="'+s.y+'" width="'+s.w+'" height="'+s.h+'" rx="'+s.r+'" fill="none" stroke="#3d4f5f" stroke-width="3"/>';
  jr.innerHTML=j;
  var jb=document.getElementById('jrplay');if(jb)jb.addEventListener('click',function(){var p=jr.classList.toggle('paused');jb.textContent=p?'動かす':'動きを止める';});
  /* ---------- 桜井: リセット、HUD ---------- */
  document.querySelectorAll('.ckreset,.ckall').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('ckall');b.parentNode.querySelectorAll('input').forEach(function(c){c.checked=on;});});});
  document.querySelectorAll('.btn.nr').forEach(function(b){b.addEventListener('click',function(){var out=b.nextElementSibling;if(b.classList.contains('ng'))return;out.textContent='送信中…';setTimeout(function(){out.textContent='送信しました';setTimeout(function(){out.textContent='';},1200);},400);});});
  document.querySelectorAll('input.tut').forEach(function(inp){var h=inp.nextElementSibling;if(!h||!h.classList.contains('tuthint'))return;inp.addEventListener('input',function(){var v=inp.value;h.textContent=!v?'8 文字以上で入力する':v.length<8?'あと '+(8-v.length)+' 文字':!/\d/.test(v)?'数字を 1 つ含めると強くなる':'十分な強さです';});});
  var huds=document.querySelectorAll('.hud'),hudDown=false;
  setInterval(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;hudDown=!hudDown;huds.forEach(function(h){if(h.offsetParent)h.scrollTo({top:hudDown?70:0,behavior:'smooth'});});},2200);
  /* ---------- 共通原則: 前の章の図をポップアップで ---------- */
  var pop=document.getElementById('pop'),popb=document.getElementById('popbody'),popt=document.getElementById('poptitle');
  function openPop(tr,lead){popt.textContent=(lead?'原則 '+tr.cells[0].textContent+'　':'')+tr.cells[1].textContent;popb.innerHTML='';
    if(lead){var d=document.createElement('div');d.innerHTML=lead;popb.appendChild(d);}
    tr.dataset.demo.split('|').forEach(function(sel){var src=document.querySelector(sel);if(!src)return;var wrap=document.createElement('div');var par=src.parentElement;wrap.className=(par&&par.classList.contains('gest'))?par.className:'';var c=src.cloneNode(true);c.querySelectorAll('[id]').forEach(function(e){e.removeAttribute('id');});c.removeAttribute('id');wrap.appendChild(c);popb.appendChild(wrap);});
    pop.showModal();}
  if(pop){document.querySelectorAll('#prin tr[data-demo]').forEach(function(tr){tr.addEventListener('click',function(){openPop(tr);});tr.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openPop(tr);}});});
    document.getElementById('popclose').addEventListener('click',function(){pop.close();});
    /* 本文中の「原則 n」から共通原則の行をクイックビューする */
    document.querySelectorAll('a[data-prin]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var tr=[].slice.call(document.querySelectorAll('#prin tr[data-demo]')).find(function(r){return r.cells[0].textContent===a.dataset.prin;});if(!tr)return;
      openPop(tr,'<p class="lead" style="margin:0">'+tr.cells[2].textContent+'</p><p class="note">出典: '+tr.cells[3].textContent+'　<a href="#principles">共通原則の章へ</a></p>');});});
    pop.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]');if(a)pop.close();});
    pop.addEventListener('click',function(e){if(e.target===pop)pop.close();var c=e.target.closest('.card');if(c&&!e.target.closest('input,button,label,a,[data-tip]')&&!c.classList.contains('static'))c.classList.toggle('on');});}
  /* ---------- フールプルーフ: 戻っても消さない ---------- */
  document.querySelectorAll('.keep .pane').forEach(function(pn){var f=pn.querySelector('.f'),r=pn.querySelector('.res'),inp=pn.querySelector('input');
    pn.querySelector('.go').addEventListener('click',function(){f.hidden=true;r.hidden=false;});
    pn.querySelector('.back').addEventListener('click',function(){r.hidden=true;f.hidden=false;if(pn.dataset.keep==='0')inp.value='';});});
  /* ---------- Hearst: ファセットとパラメトリック ----------
     ファセットは選ぶたびに他の選択肢の件数を数え直し、0 件の選択肢を押せなくする。
     パラメトリックは全項目を先に選ばせるので、0 件になっても外す条件が分からない */
  var FC=[['帝都の火災、三日に及ぶ','1923','朝刊','東京'],['救護班、横浜へ','1923','朝刊','横浜'],['復興院の設置決まる','1923','夕刊','東京'],['一周年、慰霊祭','1924','朝刊','東京'],['後藤新平、復興計画を語る','1923','朝刊','東京'],['帝都復興計画の縮小','1924','朝刊','東京'],['震災誌','1925 以降','図書','東京'],['関東大震災と横浜','1925 以降','図書','横浜'],['大正大震火災誌','1924','図書','東京'],['流言と震災','1924','夕刊','東京'],['避難民、上野公園に','1923','朝刊','東京'],['義援金の募集','1923','朝刊','東京'],['電車、一部で運転再開','1923','夕刊','東京'],['横浜港の復旧進む','1924','夕刊','横浜'],['隅田川に新橋','1925 以降','朝刊','東京'],['横浜市震災誌','1925 以降','図書','横浜'],['鎌倉の震災','1923','朝刊','鎌倉'],['鎌倉大仏の被害','1923','夕刊','鎌倉']];
  var FN=['年','種別','地域'],FV=[['1923','1924','1925 以降'],['朝刊','夕刊','図書'],['東京','横浜','鎌倉']];
  var fct=document.getElementById('fct');
  if(fct){var fside=document.getElementById('fctside'),flist=document.getElementById('fctlist'),fcnt=document.getElementById('fctcnt'),fmode='facet',fsel=[null,null,null],psel=['1924','図書','横浜'];
    function fmatch(it,sel,skip){for(var k=0;k<3;k++){if(k!==skip&&sel[k]&&it[k+1]!==sel[k])return false;}return true;}
    function fshow(items,zeroMsg){fcnt.textContent=items.length?items.length+' 件':zeroMsg;fcnt.classList.toggle('zero',!items.length);
      flist.innerHTML=items.map(function(it){return '<li>'+it[0]+'<span>'+it[1]+' '+it[2]+' '+it[3]+'</span></li>';}).join('');}
    function frender(){
      if(fmode==='facet'){var h='';FN.forEach(function(nm,k){h+='<h5>'+nm+'</h5>';FV[k].forEach(function(v){
          var n=FC.filter(function(it){return it[k+1]===v&&fmatch(it,fsel,k);}).length,on=fsel[k]===v;
          h+='<button type="button" class="fct-opt'+(on?' on':'')+'" data-k="'+k+'" data-v="'+v+'"'+(n||on?'':' disabled')+' aria-pressed="'+on+'">'+v+'<span class="n">'+n+'</span></button>';});});
        fside.innerHTML=h;fshow(FC.filter(function(it){return fmatch(it,fsel,-1);}),'');}
      else{var p='';FN.forEach(function(nm,k){p+='<h5>'+nm+'</h5><select data-k="'+k+'">'+FV[k].map(function(v){return '<option'+(psel[k]===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select>';});
        p+='<button type="button" class="btn small go">検索</button>';fside.innerHTML=p;fcnt.textContent='条件を選んで検索';fcnt.classList.remove('zero');flist.innerHTML='';}}
    fside.addEventListener('click',function(e){var b=e.target.closest('.fct-opt');if(b){var k=+b.dataset.k;fsel[k]=fsel[k]===b.dataset.v?null:b.dataset.v;frender();return;}
      if(e.target.closest('.go'))fshow(FC.filter(function(it){return fmatch(it,psel,-1);}),'0 件。どの条件を外せばよいかは表示されない');});
    fside.addEventListener('change',function(e){var s=e.target.closest('select');if(s)psel[+s.dataset.k]=s.value;});
    fct.querySelectorAll('.fct-mode .btn').forEach(function(b){b.addEventListener('click',function(){fmode=b.dataset.mode;fct.querySelectorAll('.fct-mode .btn').forEach(function(x){x.classList.toggle('on',x===b);});frender();});});
    frender();}
  /* ---------- 章番号 ---------- */
  slides.forEach(function(sl,i){var eb=sl.querySelector('.eyebrow');if(!eb)return;var n=document.createElement('span');n.className='chno';n.textContent=String(i).padStart(2,'0');eb.appendChild(n);});
})();
