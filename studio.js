
'use strict';
const el = id => document.getElementById(id);
const preview = el('preview');
const vectorPreview = el('vectorPreview');
const sample = document.createElement('canvas');
const plate = document.createElement('canvas');
const ctx = sample.getContext('2d', {willReadFrequently:true});
const groups = {
  slices:[['cols','欄數',1,16,3],['rows','列數',1,18,7],['variation','尺寸變化 %',0,90,36],['gap','切片間距 px',0,80,3],['radius','圓角 %',0,50,20]],
  warp:[['zoom','圖像縮放 %',50,280,110],['magnify','切片放大 %',50,300,112],['x','取樣偏移 X %',-100,100,34],['y','取樣偏移 Y %',-100,100,19],['stretch','中心拉伸 %',-70,180,0],['taperX','水平收窄 %',-80,80,0],['taperY','垂直收窄 %',-80,80,0],['twist','旋轉 °',-90,90,0],['drift','漂移幅度 %',0,100,28]],
  screen:[['pitch','網紋間距 px',4,45,12],['angle','角度 °',-90,90,42],['contrast','對比 %',20,240,133],['light','亮度 %',-60,60,0]]
};
let asset = plate, mediaUrl, original = false, drifting = false, seed = 29;
let sourceLabel = ['內建示範圖'], exportError = '';
let patches = new Map(), dirty = true, sourceDirty = true, raster, lastFrame = 0, loadVersion = 0;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const val=id=>+el(id).value;
const size=()=>[clamp(val('width')||1200,128,4096),clamp(val('height')||1500,128,4096)];
const screenIds = ['mode',...groups.screen.map(([id])=>id)];
const defaults = {mode:'mix',...Object.fromEntries(groups.screen.map(([id,,,,value])=>[id,value]))};
const refresh = () => { dirty=true; exportError=''; };
for(const [group, controls] of Object.entries(groups)){
  for(const [id,name,min,max,value] of controls){
    el(group).insertAdjacentHTML('beforeend', '<label class="control">'+('<span data-copy="'+name+'">'+name+'</span>')+'<output id="'+id+'Out">'+value+'</output><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" value="'+value+'"></label>');
  }
}
const readScreen=id=>id==='mode'?el(id).value:val(id);
function syncScreen(){
  const patch=patches.get(el('target').value);
  for(const id of screenIds){
    el(id).value=patch?.[id]??defaults[id];
    if(el(id+'Out')) el(id+'Out').textContent=el(id).value;
  }
}
function targets(){
  const target=el('target'), selected=target.value;
  target.replaceChildren(new Option(tr('整體'),'all'));
  for(let y=0;y<val('rows');y++) for(let x=0;x<val('cols');x++)
    target.add(new Option(language==='zh-Hans'?'第 '+(y+1)+' 行 · 第 '+(x+1)+' 列':'第 '+(y+1)+' 列 · 第 '+(x+1)+' 欄',x+','+y));
  target.value=[...target.options].some(option=>option.value===selected)?selected:'all';
  syncScreen();
}
targets();
el('target').onchange=syncScreen;
el('clearPatch').onclick=()=>{patches.delete(el('target').value);syncScreen();refresh();};
document.querySelectorAll('aside input:not([type=file]), aside select').forEach(control=>{
  control.addEventListener('input',()=>{
    const id=control.id;
    if(id==='seek'){ if(asset instanceof HTMLVideoElement) asset.currentTime=val(id); return; }
    if(id==='target') return;
    if(el(id+'Out')) el(id+'Out').textContent=control.value;
    if(screenIds.includes(id)){
      const key=el('target').value;
      if(key==='all') defaults[id]=readScreen(id);
      else patches.set(key,{...patches.get(key),[id]:readScreen(id)});
    }
    if(id==='cols'||id==='rows') targets();
    if(id==='width'||id==='height') sourceDirty=true;
    refresh();
  });
});
el('shuffle').onclick=()=>{seed=(seed+Math.floor(Math.random()*99999)+1)>>>0;refresh();};
el('original').onclick=()=>{original=!original;el('original').setAttribute('aria-pressed',original);el('original').textContent=tr(original?'看效果':'看原圖');refresh();};
el('play').onclick=()=>{drifting=!drifting;el('play').setAttribute('aria-pressed',drifting);el('play').textContent=tr(drifting?'暫停漂移':'播放漂移');refresh();};
function useAsset(next,label,url){
  if(asset instanceof HTMLVideoElement) asset.pause();
  if(mediaUrl) URL.revokeObjectURL(mediaUrl);
  asset=next;mediaUrl=url;
  setSourceLabel(label,'',Boolean(url));
  el('videoControls').hidden=!(next instanceof HTMLVideoElement);
  el('videoPlay').textContent=tr('播放影片');
  sourceDirty=true;refresh();
}
function makePlate(message){
  ++loadVersion;
  plate.width=880;plate.height=1100;
  const g=plate.getContext('2d');
  g.fillStyle='#eee';g.fillRect(0,0,880,1100);
  if(message){
    const lines=message.split('\n').slice(0,12);
    const font=Math.min(182,790/Math.max(1,...lines.map(line=>[...line].length)) *1.4,850/lines.length);
    g.font='900 '+font+'px system-ui';g.fillStyle='#101010';g.textAlign='center';g.textBaseline='middle';
    lines.forEach((line,i)=>g.fillText(line,440,550+(i-(lines.length-1)/2)*font*1.1,800));
  }else{
    const gradient=g.createLinearGradient(70,70,820,990);
    gradient.addColorStop(0,'#f7f7f7');gradient.addColorStop(.42,'#9d9d9d');gradient.addColorStop(1,'#080808');
    g.fillStyle=gradient;g.fillRect(30,29,820,1040);
    g.save();g.translate(445,570);g.rotate(-.47);
    for(let i=0;i<15;i++){
      g.strokeStyle=i%2?'#171717':'#f5f5f5';g.lineWidth=9;
      g.beginPath();g.ellipse(0,0,66+i*17,125+i*18,.3,0,Math.PI*2);g.stroke();
    }
    g.restore();g.fillStyle='#151515';g.font='900 188px system-ui';
    g.fillText('SCREEN',51,229,775);
    g.fillStyle='#f5f5f5';g.font='900 200px system-ui';g.fillText('STUDY',54,993,765);
  }
  useAsset(plate,message?'文字素材':'內建示範圖');
}
el('demo').onclick=()=>makePlate();
el('useText').onclick=()=>{const message=el('copy').value.trim();if(message) makePlate(message);};
el('import').onclick=()=>el('file').click();
el('file').onchange=()=>{
  const file=el('file').files[0];
  if(!file) return;
  el('file').value='';
  const version=++loadVersion,url=URL.createObjectURL(file);
  const video=file.type.startsWith('video/')||/\.(mp4|mov|webm|m4v|ogv)$/i.test(file.name);
  const media=video?document.createElement('video'):new Image();
  const ready=()=>{
    if(version!==loadVersion){URL.revokeObjectURL(url);return;}
    useAsset(media,file.name,url);
    if(video){el('seek').max=media.duration;el('seek').value=0;}
  };
  media.addEventListener(video?'loadeddata':'load',ready,{once:true});
  media.addEventListener('error',()=>{URL.revokeObjectURL(url);if(version===loadVersion)setSourceLabel('無法解碼',' '+file.name);},{once:true});
  if(video){
    media.muted=true;media.loop=true;media.playsInline=true;
    media.onseeked=()=>{if(media===asset){sourceDirty=true;refresh();}};
  }
  media.src=url;
};
el('videoPlay').onclick=async()=>{
  if(!(asset instanceof HTMLVideoElement)) return;
  if(asset.paused){try{await asset.play();}catch{setSourceLabel('瀏覽器無法播放這段影片');return;}}
  else asset.pause();
  el('videoPlay').textContent=tr(asset.paused?'播放影片':'暫停影片');
};
function readSource(w,h){
  const scale=Math.min(1,1536/Math.max(w,h));
  sample.width=Math.round(w*scale);sample.height=Math.round(h*scale);
  const aw=asset.videoWidth||asset.naturalWidth||asset.width;
  const ah=asset.videoHeight||asset.naturalHeight||asset.height;
  const cover=Math.max(sample.width/aw,sample.height/ah);
  ctx.fillStyle='white';ctx.fillRect(0,0,sample.width,sample.height);
  ctx.drawImage(asset,(sample.width-aw*cover)/2,(sample.height-ah*cover)/2,aw*cover,ah*cover);
  raster=ctx.getImageData(0,0,sample.width,sample.height).data;
  sourceDirty=false;
}
function random(i){
  let n=Math.imul(seed+i*127,0x45d9f3b);
  n=Math.imul(n^(n>>>16),0x45d9f3b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
function partitions(count,extent,variation,key){
  const weights=Array.from({length:count},(_,i)=>1+(random(key+i)*2-1)*variation);
  const total=weights.reduce((a,b)=>a+b,0);
  let offset=0;
  return weights.map(weight=>{
    const length=extent*weight/total;
    const part=[offset,length];offset+=length;return part;
  });
}
const round=n=>Math.round(n*100)/100;
function clipPath(x,y,w,h,shape,r){
  if(shape==='ellipse') return 'M'+x+' '+(y+h/2)+'a'+w/2+' '+h/2+' 0 1 0 '+w+' 0a'+w/2+' '+h/2+' 0 1 0 '+(-w)+' 0Z';
  if(!r||shape==='rect') return 'M'+x+' '+y+'h'+w+'v'+h+'h'+(-w)+'Z';
  return 'M'+(x+r)+' '+y+'H'+(x+w-r)+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'V'+(y+h-r)+'Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+'H'+(x+r)+'Q'+x+' '+(y+h)+' '+x+' '+(y+h-r)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'Z';
}
function compose(w,h,time,quality){
  const columns=val('cols'),rows=val('rows'),variation=el('layout').value==='random'?val('variation')/100:0;
  const xParts=partitions(columns,w,variation,17);
  const frame=[];
  const zoom=val('zoom')/100, mag=val('magnify')/100;
  const offX=val('x')/100,offY=val('y')/100,stretch=val('stretch')/100;
  const taperX=val('taperX')/100,taperY=val('taperY')/100,twist=val('twist')*Math.PI/180;
  const drift=val('drift')/100, fit=el('fit').checked, invert=el('invert').checked;
  const gap=val('gap'), shape=el('shape').value;
  for(let c=0;c<columns;c++){
    const [left,cw]=xParts[c];
    const yParts=partitions(rows,h,variation,149+c*31);
    for(let r=0;r<rows;r++){
      const [top,ch]=yParts[r],i=r*columns+c;
      const x=left+Math.min(gap,cw*.9)/2,y=top+Math.min(gap,ch*.9)/2;
      const sw=cw-Math.min(gap,cw*.9),sh=ch-Math.min(gap,ch*.9);
      const cx=left+cw/2,cy=top+ch/2,center=1-Math.min(1,Math.hypot((cx/w-.5)*1.4,(cy/h-.5)*1.4));
      const s={...defaults,...patches.get(c+','+r)};
      const mode=s.mode==='mix'?['dots','dots','lines','cross'][Math.floor(random(i+321)*4)]:s.mode;
      const pitch=Math.max(quality,s.pitch*(s.mode==='mix'?.65+random(i+534)*.92:1));
      const angle=(s.angle+(s.mode==='mix'?(random(i+921)-.5)*36:0))*Math.PI/180;
      const rot=twist*(random(i+771)*2-1),cos=Math.cos(rot),sin=Math.sin(rot);
      const shiftX=(random(i+11)*2-1)*cw*offX,shiftY=(random(i+98)*2-1)*ch*offY;
      const motionX=Math.sin(time*1.5+i*.9)*cw*drift,motionY=Math.sin(time*1.13+i*1.43)*ch*drift;
      function shade(px,py){
        const dx=(px-cx)*(fit?w/columns/cw:1),dy=(py-cy)*(fit?h/rows/ch:1);
        const xx=(dx*cos-dy*sin)/Math.max(.2,mag*(1+stretch*center)*(1+taperX*dy/ch));
        const yy=(dx*sin+dy*cos)/Math.max(.2,mag*(1+stretch*center)*(1+taperY*dx/cw));
        const u=.5+((cx+xx+shiftX+motionX)/w-.5)/zoom;
        const v=.5+((cy+yy+shiftY+motionY)/h-.5)/zoom;
        if(u<0||u>=1||v<0||v>=1) return 0;
        const index=(Math.floor(v*sample.height)*sample.width+Math.floor(u*sample.width))*4;
        const gray=(raster[index]*.2126+raster[index+1]*.7152+raster[index+2]*.0722)/255;
        const light=(gray-.5)*s.contrast/100+.5+s.light/100;
        return clamp(invert?light:1-light,0,1);
      }
      function marks(a,kind){
        const ca=Math.cos(a),sa=Math.sin(a),step=kind==='dots'?pitch:pitch*.28;
        const corners=[[-sw/2,-sh/2],[sw/2,-sh/2],[-sw/2,sh/2],[sw/2,sh/2]];
        const uMax=Math.max(...corners.map(([dx,dy])=>Math.abs(dx*ca+dy*sa)))+pitch;
        const vMax=Math.max(...corners.map(([dx,dy])=>Math.abs(-dx*sa+dy*ca)))+pitch;
        const paths=[];
        for(let v=-Math.ceil(vMax/pitch)*pitch;v<=vMax;v+=pitch){
          let upper=[],lower=[];
          function finishLine(){
            if(upper.length>1){
              const points=upper.concat(lower.reverse());
              let outline='M'+point(points[0]);
              for(let j=1;j<points.length-1;j++){
                const [x0,y0]=points[j], [x1,y1]=points[j+1];
                outline+='Q'+point(points[j])+' '+point([(x0+x1)/2,(y0+y1)/2]);
              }
              paths.push(outline+'L'+point(points.at(-1))+'Z');
            }
            upper=[];lower=[];
          }
          const point=pair=>pair.map(round).join(' ');
          for(let u=-Math.ceil(uMax/step)*step;u<=uMax;u+=step){
            const px=x+sw/2+u*ca-v*sa,py=y+sh/2+u*sa+v*ca;
            if(px<x-pitch||px>x+sw+pitch||py<y-pitch||py>y+sh+pitch){
              if(upper.length) finishLine();
              continue;
            }
            const dark=shade(px,py);
            if(kind==='dots'){
              if(dark<.012) continue;
              const rr=round(pitch*Math.sqrt(dark/Math.PI)*(1+.27*dark**4));
              if(rr>0) paths.push('M'+round(px-rr)+' '+round(py)+'a'+rr+' '+rr+' 0 1 0 '+round(rr*2)+' 0a'+rr+' '+rr+' 0 1 0 '+round(-rr*2)+' 0Z');
            }else if(dark<.012){
              if(upper.length){
                upper.push([px,py]);lower.push([px,py]);
                finishLine();
              }
            }else{
              if(!upper.length){
                const tip=[px-step*ca*.5,py-step*sa*.5];
                upper.push(tip);lower.push(tip);
              }
              const thick=dark*pitch*(mode==='cross'?.34:.505);
              upper.push([px-thick*sa,py+thick*ca]);
              lower.push([px+thick*sa,py-thick*ca]);
            }
          }
          if(upper.length) finishLine();
        }
        return paths.join('');
      }
      const paths=[marks(angle,mode==='dots'?'dots':'lines')];
      if(mode==='cross') paths.push(marks(angle+Math.PI/2,'lines'));
      frame.push({clip:clipPath(round(x),round(y),round(sw),round(sh),shape,round(Math.min(sw,sh)*val('radius')/100)),paths,c,r});
    }
  }
  return frame;
}
function paint(canvas,w,h,frame){
  const g=canvas.getContext('2d');
  g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  g.clearRect(0,0,w,h);
  if(!el('transparent').checked){g.fillStyle=el('paper').value;g.fillRect(0,0,w,h);}
  g.fillStyle=el('ink').value;
  for(const tile of frame){
    g.save();g.clip(new Path2D(tile.clip));
    for(const path of tile.paths) g.fill(new Path2D(path));
    g.restore();
  }
}
function svgContent(frame,individual=false){
  const prefix=individual?'slice-':'preview-slice-';
  const paper=el('transparent').checked?'':'<rect width="100%" height="100%" fill="'+el('paper').value+'"/>';
  const defs=frame.map((tile,i)=>'<clipPath id="'+prefix+i+'"><path d="'+tile.clip+'"/></clipPath>').join('');
  const art=frame.map((tile,i)=>{
    const paths=individual?tile.paths.flatMap(path=>path.match(/M[^M]+/g)??[]):tile.paths;
    return '<g clip-path="url(#'+prefix+i+')" fill="'+el('ink').value+'">'+paths.filter(Boolean).map(path=>'<path d="'+path+'"/>').join('')+'</g>';
  }).join('');
  return '<defs>'+defs+'</defs>'+paper+art;
}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
let phase=0;
function render(now){
  requestAnimationFrame(render);
  const videoPlaying=asset instanceof HTMLVideoElement&&!asset.paused;
  if(!dirty&&!drifting&&!videoPlaying) return;
  if((drifting||videoPlaying)&&!dirty&&now-lastFrame<100) return;
  const [w,h]=size(),scale=Math.min(1,1050/Math.max(w,h));
  if(sourceDirty||videoPlaying) readSource(w,h);
  if(videoPlaying) el('seek').value=asset.currentTime;
  if(drifting) phase+=Math.min(.16,(now-lastFrame)/1000);
  el('stage').style.setProperty('--ratio',w/h);
  preview.hidden=!original;
  vectorPreview.toggleAttribute('hidden',original);
  if(original){
    preview.width=Math.round(w*scale);
    preview.height=Math.round(h*scale);
    preview.getContext('2d').drawImage(sample,0,0,preview.width,preview.height);
  }else{
    vectorPreview.setAttribute('viewBox','0 0 '+w+' '+h);
    vectorPreview.innerHTML=svgContent(compose(w,h,phase,drifting||videoPlaying?Math.max(w,h)/150:0));
  }
  lastFrame=now;dirty=false;
  updateStatus();
}
async function save(format){
  const buttons=[el('png'),el('svg')];
  buttons.forEach(button=>button.disabled=true);
  exportError='';updateStatus();
  try{
    const [w,h]=size();readSource(w,h);
    const frame=compose(w,h,phase,0);
    if(format==='svg'){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+svgContent(frame,true)+'</svg>';
      download(new Blob([svg],{type:'image/svg+xml'}),'vktn-screen.svg');
    }else{
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas,w,h,frame);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob) throw Error('PNG 編碼失敗');
      download(blob,'vktn-screen.png');
    }
  }catch(error){exportError=error.message;updateStatus();}
  finally{buttons.forEach(button=>button.disabled=false);}
}
el('png').onclick=()=>save('png');el('svg').onclick=()=>save('svg');
function setSourceLabel(label,suffix='',literal=false){
  sourceLabel=[label,suffix,literal];
  el('source').textContent=(literal?label:tr(label))+suffix;
}
function updateStatus(){
  const [w,h]=size();
  const count=val('cols')*val('rows');
  el('status').textContent=exportError
    ?tr('匯出失敗')+' · '+tr(exportError)
    :w+' × '+h+' px  /  '+count+(language==='zh-Hans'?' 个切片':' 個切片');
}
function applyLanguage(){
  translateInterface();
  targets();
  el('original').textContent=tr(original?'看效果':'看原圖');
  el('play').textContent=tr(drifting?'暫停漂移':'播放漂移');
  el('videoPlay').textContent=tr(asset instanceof HTMLVideoElement&&!asset.paused?'暫停影片':'播放影片');
  setSourceLabel(...sourceLabel);
  updateStatus();
}
el('language').value=language;
el('language').onchange=()=>{
  language=el('language').value;
  try { localStorage.setItem('chrnc-language',language); } catch {}
  applyLanguage();
};
makePlate();applyLanguage();requestAnimationFrame(render);
