'use strict';
const simplified = {
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
