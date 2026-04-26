# Project Overview
이 프로젝트는 안티그래비티(Antigravity) 환경 기반으로 구축되는 '교육전문직(장학사) 시험 대비용 문제은행 웹앱'입니다. 사용자가 원하는 카테고리를 선택하여 무제한으로 퀴즈를 풀고, 오답 노트 기능을 통해 틀린 문제만 모아서 다시 풀 수 있도록 지원하는 것이 핵심입니다.

# Architecture & Tech Stack
- Framework: Antigravity Boilerplate (React/Next.js)
- Database/State: 초기 MVP는 `LocalStorage`를 사용하여 학습 이력과 오답을 관리. 문제 원본은 카테고리별 정적 파일(`questions_insa.json`, `questions_senggibu.json`, `questions_hakjuk.json`) 사용.

# AI Coding Guidelines
1. **시험 대비용 UI/UX:**
   - 메인 화면에서 3대 대분류(인사실무, 생기부, 학적업무)와 그 하위 세부 카테고리를 직관적으로 선택할 수 있어야 합니다.
   - 퀴즈 화면에서는 정답 제출 후 관련 '법령/지침 근거(해설)'가 매우 강조되어야 합니다.

2. **학습 모드 분리:**
   - '전체 풀기': 선택한 카테고리의 모든 문제를 랜덤 또는 순차적으로 풀기
   - '오답 풀기': 과거에 한 번이라도 틀렸던 문제만 모아서 다시 풀기

3. **데이터 구조 변경:**
   - 문제 원본 JSON에는 반드시 `category` (대분류)와 `subcategory` (소분류) 필드가 포함되어야 합니다.

# Core Data Models
[Question Bank]
- id, category, subcategory, type (multiple_choice | ox_quiz), question, options (array), answer, explanation(근거 지침 명시)

[User Progress]
- question_id, is_incorrect (boolean), last_solved_date