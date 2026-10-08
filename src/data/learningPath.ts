export interface LearningYear {
  year: 1 | 2 | 3 | 4
  title: string
  phase: string
  focus: string
  capabilities: string[]
  activities: string
}

export const LEARNING_PATH: readonly LearningYear[] = [
  {
    year: 1,
    title: '建立人文、文本、文化與數位方法基礎',
    phase: '探索與奠基',
    focus: '從閱讀、觀察與提問開始，認識人文學習的不同入口。',
    capabilities: ['閱讀理解', '文本分析', '基礎表達', '數位工具入門'],
    activities: '閱讀分析、文化觀察、基礎表達與數位練習',
  },
  {
    year: 2,
    title: '學習田野、研究、敘事及議題分析方法',
    phase: '方法與表達',
    focus: '把觀察轉化為資料與故事，練習從不同角度理解議題。',
    capabilities: ['田野研究', '資料整理', '敘事轉譯', '議題分析'],
    activities: '訪談、資料整理、故事企劃與議題分析',
  },
  {
    year: 3,
    title: '進入專題、策展、實習及進階選修',
    phase: '跨域實作',
    focus: '走進場域、媒介與團隊協作，將想法發展成可行的企劃。',
    capabilities: ['企劃協作', '媒介應用', '策展', '場域實作'],
    activities: '數位內容、創作、文化方案、策展與場域實作',
  },
  {
    year: 4,
    title: '統整所學並完成公開成果',
    phase: '整合與展現',
    focus: '整合四年的學習，完成作品、提案或公開展演。',
    capabilities: ['綜合運用', '專案完成', '公開表達'],
    activities: '畢業專題、作品集、成果展演或文化提案',
  },
]
