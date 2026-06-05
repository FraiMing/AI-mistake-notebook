/**
 * 页面元素选择器常量。
 * 使用文本定位和表单 label 定位，优于硬编码 CSS selector。
 */

/** 登录页 */
export const SEL = {
  /** 登录表单 */
  login: {
    username: 'input[name="username"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]',
    error: ".text-destructive",
  },

  /** 题目列表页 */
  problems: {
    newProblemLink: "a",
    filterSubject: 'select:has(option[value=""]):nth-of-type(1)',
    clearFilter: "button",
  },

  /** 题目录入页 */
  problemForm: {
    content: 'textarea[id="content"]',
    answer: 'textarea[id="answer"]',
    correctAnswer: 'textarea[id="correctAnswer"]',
    analyzeBtn: 'button[type="submit"]',
    confirmBtn: "button",
    backBtn: "button",
    photoUpload: "button",
  },

  /** 标签管理页 */
  tags: {
    nameInput: 'input[placeholder]',
    typeSelect: "select",
    addBtn: "button",
  },
} as const;
