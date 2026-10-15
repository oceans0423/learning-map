// Human-authored facet annotations. No inference from keywords or top-level ability counts.
// These operational labels describe proposed course-role relationships, not new approved abilities.
export const roleDefinitions = [
  ['P1', '探索者', {question:'問題或解釋意圖', material:'文本或田野材料'}],
  ['P2', '創作人', {theme:'材料或創作主題', expression:'作品表達'}],
  ['P3', '引路人', {content:'內容理解', audience:'讀者轉譯或學習引導'}],
  ['P4', '分析師', {data:'資料整理與分析', interpretation:'人文解讀'}],
  ['P5', '策展人', {content:'文化或敘事內容', experience:'表達與呈現'}],
  ['P6', '造物者', {need:'人的需求', making:'工具與可測試方案', review:'檢查與修訂'}],
  ['P7', '策略師', {culture:'文化創意構想', strategy:'目標、資源與推動規劃'}],
  ['P8', '開拓者', {context:'地方或社群理解', action:'實踐方向', joint:'協作與共同目標（補充）', reflection:'永續與影響反思（補充）'}],
].map(([id,name,facets])=>({id,name,facets,requiredFacets:Object.keys(facets).filter(key=>!['joint','reflection'].includes(key))}));

// course number : facet @ existing ability. Each row is manually scoped to its role.
// A representative relationship is necessary but not sufficient: all facets must have evidence.
export const annotations = {
 P1: [
  '001:question@H01', '007:question@H01,material@H02', '011:material@H02',
  '013:question@H01,material@H03', '021:material@H02', '023:material@H02',
  '026:material@H02', '031:material@H03', '032:question@H02,material@H03',
  '033:material@H02', '034:material@H02', '035:material@H02',
  '047:question@H01,material@H02', '048:question@H01,material@H02',
  '053:question@H01,material@H02', '061:question@H01', '063:material@H02',
  '065:question@H01,material@H02', '067:material@H02', '069:question@H01,material@H02',
 ],
 P2: [
  '003:theme@H05,expression@H09', '009:theme@H06,expression@H05',
  '012:theme@H06,expression@H05', '014:theme@H05,expression@H05',
  '025:theme@H02', '028:theme@H04,expression@H09', '029:theme@H03',
  '031:theme@H03,expression@H05', '041:theme@H05,expression@H05',
  '044:theme@H02,expression@H05', '045:theme@H05,expression@H05',
  '046:theme@H04,expression@H05', '054:theme@H05,expression@H05',
  '056:theme@H02,expression@H05', '057:theme@H02,expression@H05',
  '062:theme@H06,expression@H05',
 ],
 P3: [
  '004:audience@H06', '020:content@H02,audience@H07',
  '022:content@H04,audience@H07', '027:content@H02,audience@H07',
  '037:content@H06,audience@H06', '043:content@H04,audience@H06',
  '044:content@H02,audience@H06', '052:content@H01,audience@H06',
  '055:audience@H06', '058:content@H02,audience@H06',
  '062:content@H02,audience@H06', '067:content@H02,audience@H06',
 ],
 P4: [
  '008:data@H08', '019:data@H08,interpretation@H02',
  '040:data@H08,interpretation@H08', '068:data@H08,interpretation@H02',
 ],
 P5: [
  '015:content@H05,experience@H11', '016:content@H01',
  '017:content@H12,experience@H11', '040:content@H04',
  '041:content@H05,experience@H11', '042:content@H06,experience@H11',
 ],
 P6: [
  '005:review@H14', '008:making@H10', '024:need@H03',
  '030:making@H10,review@H14', '036:review@H14',
  '051:need@H03,making@H10,review@H14',
 ],
 P7: [
  '006:culture@H04,strategy@H12', '009:culture@H06',
  '017:culture@H12,strategy@H12', '037:culture@H06,strategy@H12',
  '038:culture@H05,strategy@H12', '042:culture@H04,strategy@H12',
  '043:culture@H06,strategy@H12', '060:culture@H12,strategy@H12',
 ],
 P8: [
  '002:context@H03', '010:context@H03,joint@H13,action@H09',
  '013:context@H03', '015:context@H03', '018:context@H03,joint@H13',
  '024:context@H03,action@H01', '036:context@H03,joint@H13,action@H01',
  '037:context@H06,joint@H13', '039:reflection@H14',
  '063:context@H04,joint@H13', '064:context@H04,joint@H13,action@H01',
 ],
};
