const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/new_questions.json');
try {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(raw);
  
  questions.forEach(q => {
    // 1. 카테고리 변경: 기존 카테고리와 서브카테고리를 합쳐서 subcategory에 넣고, category는 현장지원성으로
    const oldCat = q.category;
    const oldSub = q.subcategory;
    q.category = '현장지원성';
    q.subcategory = `${oldCat} - ${oldSub}`;
    
    // 2. type을 모두 essay로 통일
    q.type = 'essay';
  });

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
  console.log('JSON 변환 완료');
} catch (e) {
  console.error('변환 실패:', e);
}
