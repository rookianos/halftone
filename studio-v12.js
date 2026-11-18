'use strict';
const simplified = {
  "隨機混合配色": "随机混合配色",
  "黑／白": "黑／白",
  "汽水標籤 · 綠／橘": "汽水标签 · 绿／橙",
  "藍晒廣告 · 藍／白": "蓝晒广告 · 蓝／白",
  "劇場海報 · 黑／紅": "剧场海报 · 黑／红",
  "電器傳單 · 紅／藍": "电器传单 · 红／蓝",
  "罐頭標籤 · 紅／綠": "罐头标签 · 红／绿",
  "昭和配色": "昭和配色",
  "套用整體配色": "应用全局配色",

  "介面語言": "界面语言",
  "下載 PNG": "下载 PNG",
  "下載 SVG": "下载 SVG",
  "PREVIEW / 即時預覽": "PREVIEW / 实时预览",
  "看原圖": "查看原图",
  "看效果": "查看效果",
  "播放漂移": "播放漂移",
  "暫停漂移": "暂停漂移",
  "作品預覽": "作品预览",
  "素材與畫布": "素材与画布",
  "匯入圖片／影片": "导入图片／视频",
  "示範圖": "示例图",
  "文字素材": "文字素材",
  "輸入文字素材": "输入文字素材",
  "套用文字": "应用文字",
  "播放影片": "播放视频",
  "暫停影片": "暂停视频",
  "影片時間": "视频进度",
  "寬": "宽",
  "高": "高",
  "切片": "切片",
  "排版": "布局",
  "隨機排版": "随机布局",
  "等分網格": "等分网格",
  "重新隨機": "重新生成布局",
  "切片形狀": "切片形状",
  "方形": "矩形",
  "圓角": "圆角",
  "橢圓": "椭圆",
  "圖像隨切片尺寸縮放": "图像随切片大小缩放",
  "取樣與變形": "采样与变形",
  "網紋與顏色": "网纹与颜色",
  "網紋類型": "网纹类型",
  "混合網紋": "混合网纹",
  "圓點": "圆点",
  "平行線": "平行线",
  "交叉線": "交叉线",
  "編輯目標": "编辑对象",
  "整體": "全局",
  "墨色": "油墨颜色",
  "底色": "底色",
  "透明背景": "透明背景",
  "反相": "反相",
  "清除局部設定": "清除当前切片设置",
  "欄數": "列数",
  "列數": "行数",
  "尺寸變化 %": "尺寸变化 %",
  "切片間距 px": "切片间距 px",
  "圓角 %": "圆角 %",
  "圖像縮放 %": "图像缩放 %",
  "切片放大 %": "切片放大 %",
  "取樣偏移 X %": "采样偏移 X %",
  "取樣偏移 Y %": "采样偏移 Y %",
  "中心拉伸 %": "中心拉伸 %",
  "水平收窄 %": "水平收窄 %",
  "垂直收窄 %": "垂直收窄 %",
  "旋轉 °": "旋转 °",
  "漂移幅度 %": "漂移幅度 %",
  "網紋間距 px": "网纹间距 px",
  "角度 °": "角度 °",
  "對比 %": "对比度 %",
  "亮度 %": "亮度 %",
  "內建示範圖": "内置示例图",
  "無法解碼": "无法解码",
  "瀏覽器無法播放這段影片": "浏览器无法播放此视频",
  "匯出失敗": "导出失败",
  "PNG 編碼失敗": "PNG 编码失败"
};
let language = 'zh-Hant';
try { if (localStorage.getItem('chrnc-language') === 'zh-Hans') language = 'zh-Hans'; } catch {}
const tr = text => language === 'zh-Hans' ? simplified[text] ?? text : text;
function translateInterface(){
  document.documentElement.lang = language;
  document.querySelectorAll('[data-copy]').forEach(node=>{node.textContent=tr(node.dataset.copy);});
  for(const attribute of ['aria-label','placeholder']){
    document.querySelectorAll('[data-'+attribute+']').forEach(node=>{
      node.setAttribute(attribute,tr(node.getAttribute('data-'+attribute)));
    });
  }
}


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
const screenIds = ['mode','ink','paper',...groups.screen.map(([id])=>id)];
const defaults = {mode:'mix',ink:'#171815',paper:'#ffffff',...Object.fromEntries(groups.screen.map(([id,,,,value])=>[id,value]))};
const refresh = () => { dirty=true; exportError=''; };
for(const [group, controls] of Object.entries(groups)){
  for(const [id,name,min,max,value] of controls){
    el(group).insertAdjacentHTML('beforeend', '<label class="control">'+('<span data-copy="'+name+'">'+name+'</span>')+'<output id="'+id+'Out">'+value+'</output><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" value="'+value+'"></label>');
  }
}
const warpIds=groups.warp.map(([id])=>id);
const singleWarp=[100,100,0,0,0,0,0,0,28];
let multiWarp=warpIds.map(val);
let singleWarpActive=false;
function syncWarp(){
  const single=isSingleSlice();
  if(single===singleWarpActive) return;
  const outgoing=single?multiWarp:singleWarp;
  const incoming=single?singleWarp:multiWarp;
  warpIds.forEach((id,i)=>{
    outgoing[i]=val(id);
    el(id).value=incoming[i];
    el(id+'Out').textContent=incoming[i];
  });
  singleWarpActive=single;
}
const palettes = {
  "mono": [
    "#171815",
    "#ffffff",
    ""
  ],
  "soda": [
    "#14744e",
    "#ffffff",
    "#df581f"
  ],
  "blue": [
    "#203e8f",
    "#ffffff",
    ""
  ],
  "red": [
    "#171717",
    "#ffffff",
    "#bc292c"
  ],
  "flyer": [
    "#c63423",
    "#ffffff",
    "#25468f"
  ],
  "label": [
    "#bb362d",
    "#ffffff",
    "#217749"
  ]
};
const paletteInks=[...new Set(Object.values(palettes).flatMap(([ink,,alternate])=>[ink,alternate]).filter(Boolean))];
let alternateInk='';
let mixedInks=[];
function shuffleInks(previous){
  const inks=[...paletteInks];
  for(let i=inks.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [inks[i],inks[j]]=[inks[j],inks[i]];
  }
  if(inks[0]===previous) [inks[0],inks[1]]=[inks[1],inks[0]];
  return inks;
}
function colorsFor(key){
  const [col,row]=key.split(',').map(Number);
  const position=col+row*(mixedInks.length-1);
  const mixedInk=Number.isFinite(position)&&mixedInks.length
    ?mixedInks[position%mixedInks.length]:null;
  return {
    ink:mixedInk??(alternateInk&&(col+row)%2?alternateInk:defaults.ink),
    paper:defaults.paper
  };
}
const readScreen=id=>['mode','ink','paper'].includes(id)?el(id).value:val(id);
function syncScreen(){
  const key=el('target').value;
  const patch=patches.get(key);
  const colors=colorsFor(key);
  for(const id of screenIds){
    el(id).value=patch?.[id]??colors[id]??defaults[id];
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
el('applyPalette').onclick=()=>{
  const preset=el('palette').value;
  if(preset==='random-mix'){
    mixedInks=shuffleInks(mixedInks[0]);
    [defaults.ink,defaults.paper,alternateInk]=[mixedInks[0],palettes.mono[1],''];
  }else{
    mixedInks=[];
    [defaults.ink,defaults.paper,alternateInk]=palettes[preset];
  }
  for(const patch of patches.values()){
    delete patch.ink;
    delete patch.paper;
  }
  syncScreen();refresh();
};
el('clearPatch').onclick=()=>{patches.delete(el('target').value);syncScreen();refresh();};
document.querySelectorAll('aside input:not([type=file]), aside select').forEach(control=>{
  control.addEventListener('input',()=>{
    const id=control.id;
    if(id==='seek'){ if(asset instanceof HTMLVideoElement) asset.currentTime=val(id); return; }
    if(id==='target') return;
    if(id==='variation') el('layout').value='random';
    if(el(id+'Out')) el(id+'Out').textContent=control.value;
    if(screenIds.includes(id)){
      const key=el('target').value;
      if(key==='all'){
        defaults[id]=readScreen(id);
        if(id==='ink'){alternateInk='';mixedInks=[];}
      }
      else patches.set(key,{...patches.get(key),[id]:readScreen(id)});
    }
    if(id==='cols'||id==='rows'){syncWarp();targets();}
    if(['width','height','cols','rows'].includes(id)) sourceDirty=true;
    refresh();
  });
});
el('shuffle').onclick=()=>{el('layout').value='random';seed=(seed+Math.floor(Math.random()*99999)+1)>>>0;refresh();};
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
const isSingleSlice=()=>val('cols')===1&&val('rows')===1;
let sourceBounds;
function readSource(w,h){
  const scale=Math.min(1,1536/Math.max(w,h));
  sample.width=Math.round(w*scale);sample.height=Math.round(h*scale);
  const aw=asset.videoWidth||asset.naturalWidth||asset.width;
  const ah=asset.videoHeight||asset.naturalHeight||asset.height;
  const fitScale=(isSingleSlice()?Math.min:Math.max)(sample.width/aw,sample.height/ah);
  const dw=aw*fitScale,dh=ah*fitScale;
  const left=(sample.width-dw)/2,top=(sample.height-dh)/2;
  sourceBounds=[left/sample.width,top/sample.height,(left+dw)/sample.width,(top+dh)/sample.height];
  ctx.fillStyle='white';ctx.fillRect(0,0,sample.width,sample.height);
  ctx.drawImage(asset,left,top,dw,dh);
  raster=ctx.getImageData(0,0,sample.width,sample.height).data;
  sourceDirty=false;
}
function random(i){
  let n=Math.imul(seed+i*127,0x45d9f3b);
  n=Math.imul(n^(n>>>16),0x45d9f3b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
function partitions(count,extent,variation,key){
  const offsets=Array.from({length:count},(_,i)=>random(key+i));
  const min=Math.min(...offsets),max=Math.max(...offsets);
  const weights=offsets.map(offset=>max===min?1:1+(2*(offset-min)/(max-min)-1)*variation);
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
  const single=isSingleSlice();
  const gap=single?0:val('gap'), shape=single?'rect':el('shape').value;
  for(let c=0;c<columns;c++){
    const [left,cw]=xParts[c];
    const yParts=partitions(rows,h,variation,149+c*31);
    for(let r=0;r<rows;r++){
      const [top,ch]=yParts[r],i=r*columns+c;
      const x=left+Math.min(gap,cw*.9)/2,y=top+Math.min(gap,ch*.9)/2;
      const sw=cw-Math.min(gap,cw*.9),sh=ch-Math.min(gap,ch*.9);
      const cx=left+cw/2,cy=top+ch/2,center=1-Math.min(1,Math.hypot((cx/w-.5)*1.4,(cy/h-.5)*1.4));
      const key=c+','+r;
      const s={...defaults,...colorsFor(key),...patches.get(key)};
      const mode=s.mode==='mix'?['dots','dots','lines','cross'][Math.floor(random(i+321)*4)]:s.mode;
      const pitch=Math.max(quality,s.pitch*(s.mode==='mix'?.65+random(i+534)*.92:1));
      const angle=(s.angle+(s.mode==='mix'?(random(i+921)-.5)*36:0))*Math.PI/180;
      const rot=single?-twist:twist*(random(i+771)*2-1),cos=Math.cos(rot),sin=Math.sin(rot);
      const shiftX=(single?-1:random(i+11)*2-1)*cw*offX;
      const shiftY=(single?-1:random(i+98)*2-1)*ch*offY;
      const motionX=Math.sin(time*1.5+i*.9)*cw*drift,motionY=Math.sin(time*1.13+i*1.43)*ch*drift;
      function shade(px,py){
        const dx=(px-cx)*(fit?w/columns/cw:1),dy=(py-cy)*(fit?h/rows/ch:1);
        const xx=(dx*cos-dy*sin)/Math.max(.2,mag*(1+stretch*center)*(1+taperX*dy/ch));
        const yy=(dx*sin+dy*cos)/Math.max(.2,mag*(1+stretch*center)*(1+taperY*dx/cw));
        const u=.5+((cx+xx+shiftX+motionX)/w-.5)/zoom;
        const v=.5+((cy+yy+shiftY+motionY)/h-.5)/zoom;
        if(u<0||u>=1||v<0||v>=1) return 0;
        const [leftBound,topBound,rightBound,bottomBound]=sourceBounds;
        if(single&&(u<leftBound||u>=rightBound||v<topBound||v>=bottomBound)) return 0;
        const sx=clamp(u*sample.width-.5,0,sample.width-1);
        const sy=clamp(v*sample.height-.5,0,sample.height-1);
        const x0=Math.floor(sx),y0=Math.floor(sy);
        const x1=Math.min(x0+1,sample.width-1),y1=Math.min(y0+1,sample.height-1);
        const fx=sx-x0,fy=sy-y0;
        const grayAt=(x,y)=>{
          const index=(y*sample.width+x)*4;
          return (raster[index]*.2126+raster[index+1]*.7152+raster[index+2]*.0722)/255;
        };
        const gray=(grayAt(x0,y0)*(1-fx)+grayAt(x1,y0)*fx)*(1-fy)
          +(grayAt(x0,y1)*(1-fx)+grayAt(x1,y1)*fx)*fy;
        const light=(gray-.5)*s.contrast/100+.5+s.light/100;
        return clamp(invert?light:1-light,0,1);
      }
      function marks(a,kind){
        const ca=Math.cos(a),sa=Math.sin(a),step=kind==='dots'?pitch:clamp(pitch*.12,1,3);
        const normalX=-sa*pitch*.42,normalY=ca*pitch*.42;
        const tangentX=ca*pitch*.30,tangentY=sa*pitch*.30;
        function screenShade(px,py){
          const middle=shade(px,py);
          const above=shade(px+normalX,py+normalY);
          const below=shade(px-normalX,py-normalY);
          return (4*middle+2*(above+below
            +shade(px+tangentX,py+tangentY)+shade(px-tangentX,py-tangentY))
            +shade(px+normalX+tangentX,py+normalY+tangentY)
            +shade(px+normalX-tangentX,py+normalY-tangentY)
            +shade(px-normalX+tangentX,py-normalY+tangentY)
            +shade(px-normalX-tangentX,py-normalY-tangentY))/16;
        }
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
            // Smooth the full sample footprint before drawing a vector mark.
            const dark=screenShade(px,py);
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
      frame.push({clip:clipPath(round(x),round(y),round(sw),round(sh),shape,round(Math.min(sw,sh)*val('radius')/100)),paths,ink:s.ink,paper:s.paper});
    }
  }
  return frame;
}
function paint(canvas,w,h,frame){
  const g=canvas.getContext('2d');
  g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  g.clearRect(0,0,w,h);
  if(!el('transparent').checked){g.fillStyle=defaults.paper;g.fillRect(0,0,w,h);}
  for(const tile of frame){
    g.save();g.clip(new Path2D(tile.clip));
    if(!el('transparent').checked&&tile.paper!==defaults.paper){
      g.fillStyle=tile.paper;g.fillRect(0,0,w,h);
    }
    g.fillStyle=tile.ink;
    for(const path of tile.paths) g.fill(new Path2D(path));
    g.restore();
  }
}
function svgContent(frame,individual=false){
  const prefix=individual?'slice-':'preview-slice-';
  const paper=el('transparent').checked?'':'<rect width="100%" height="100%" fill="'+defaults.paper+'"/>';
  const defs=frame.map((tile,i)=>'<clipPath id="'+prefix+i+'"><path d="'+tile.clip+'"/></clipPath>').join('');
  const art=frame.map((tile,i)=>{
    const paths=individual?tile.paths.flatMap(path=>path.match(/M[^M]+/g)??[]):tile.paths;
    const tilePaper=!el('transparent').checked&&tile.paper!==defaults.paper
      ?'<rect width="100%" height="100%" fill="'+tile.paper+'"/>':'';
    return '<g clip-path="url(#'+prefix+i+')" fill="'+tile.ink+'">'+tilePaper+paths.filter(Boolean).map(path=>'<path d="'+path+'"/>').join('')+'</g>';
  }).join('');
  return '<defs>'+defs+'</defs>'+paper+art;
}
const exportLink=el('exportLink');
let exportUrl='',exportFormat='',exporting=false;
const exportText=(traditional,simplified)=>language==='zh-Hans'?simplified:traditional;
function updateExportLink(){
  exportLink.textContent=exportText('另存 ','另存为 ')+exportFormat.toUpperCase();
}
let sequenceDay='',sequenceNumber=0;
function nextExportName(format,now=new Date()){
  const pad=(value,length=2)=>String(value).padStart(length,'0');
  const day=pad(now.getFullYear(),4)+pad(now.getMonth()+1)+pad(now.getDate());
  if(sequenceDay!==day){sequenceDay=day;sequenceNumber=0;}
  const key='cnc-halftone-export-'+day;
  let saved=0;
  try{saved=Number(localStorage.getItem(key))||0;}catch{}
  const number=Math.max(sequenceNumber,saved)+1;
  if(number>999) throw Error(exportText('今日已達 999 次匯出','今日已达 999 次导出'));
  sequenceNumber=number;
  try{localStorage.setItem(key,String(number));}catch{}
  return 'CNC_halftone_'+day+'_'+pad(number,3)+'.'+format;
}
function download(blob,format){
  const name=nextExportName(format);
  const url=URL.createObjectURL(blob);
  if(exportUrl) URL.revokeObjectURL(exportUrl);
  exportUrl=url;
  exportFormat=format;
  exportLink.href=url;
  exportLink.download=name;
  updateExportLink();
  exportLink.hidden=false;
  exportLink.click();
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
  if(exporting) return;
  exporting=true;
  const buttons=[el('png'),el('svg')];
  buttons.forEach(button=>button.disabled=true);
  exportError='';updateStatus();
  try{
    const [w,h]=size();readSource(w,h);
    const frame=compose(w,h,phase,0);
    if(format==='svg'){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+svgContent(frame,true)+'</svg>';
      download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),format);
    }else{
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas,w,h,frame);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob) throw Error('PNG 編碼失敗');
      download(blob,format);
    }
  }catch(error){exportError=error.message;updateStatus();}
  finally{exporting=false;buttons.forEach(button=>button.disabled=false);updateStatus();}
}
el('png').onclick=()=>save('png');el('svg').onclick=()=>save('svg');
function setSourceLabel(label,suffix='',literal=false){
  sourceLabel=[label,suffix,literal];
  el('source').textContent=(literal?label:tr(label))+suffix;
}
function updateStatus(){
  const [w,h]=size();
  const count=val('cols')*val('rows');
  const version='  /  v12';
  const fullImage=isSingleSlice()
    ?'  /  '+(language==='zh-Hans'?'单切片模式':'單切片模式')
    :'';
  if(exporting){
    el('status').textContent=exportText('正在產生下載檔案…','正在生成下载文件…');
    return;
  }
  el('status').textContent=exportError
    ?tr('匯出失敗')+' · '+tr(exportError)
    :w+' × '+h+' px  /  '+count+(language==='zh-Hans'?' 个切片':' 個切片')+fullImage+version;
}
function applyLanguage(){
  translateInterface();
  updateExportLink();
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
