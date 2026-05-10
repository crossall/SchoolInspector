const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/new_questions.json');
try {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(raw);
  
  questions.forEach(q => {
    // 모든 문제의 서브카테고리를 사용자가 요청한 통합명으로 변경
    q.subcategory = '교수평 교육과정 수업 평가';
  });

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
  console.log('JSON 서브카테고리 단일화 완료');
} catch (e) {
  console.error('변환 실패:', e);
}
