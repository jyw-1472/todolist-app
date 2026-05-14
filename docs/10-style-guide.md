# 스타일 가이드 (Style Guide)

> 참조 레퍼런스: Google Calendar (2024년 6월 화면 캡처)

---

## 1. 디자인 철학

| 원칙 | 설명 |
|------|------|
| **명확성** | 정보 밀도가 높아도 시각적 위계를 통해 한눈에 파악 가능하게 |
| **색상으로 분류** | 카테고리·상태를 텍스트 없이 색상만으로 즉시 구분 |
| **여백 절제** | 많은 항목을 좁은 공간에 담되, 칸 간 구분선으로 답답함 해소 |
| **반응형** | 데스크톱 중심이나 모바일에서도 핵심 기능 유지 |

---

## 2. 색상 팔레트 (Color Palette)

### 2-1. 이벤트 카테고리 컬러

이미지에서 추출한 이벤트 태그 색상입니다. 각 색상은 독립적인 카테고리를 나타냅니다.

| 색상명 | HEX | 사용 예시 |
|--------|-----|-----------|
| Tomato Red | `#D50000` | 외부강의사례금신고, 헌송임 |
| Flamingo Pink | `#E67C73` | 팬린디·메모(3기), 팬린디·메모(4기) |
| Tangerine Orange | `#F6BF26` | 헌트 (노란 이벤트) |
| Banana Yellow | `#F4E04D` | 보조 강조 색상 |
| Sage Green | `#33B679` | 활영&백업, 출결체크, 동료장학 |
| Basil Dark Green | `#0B8043` | 학년현지연수 |
| Peacock Blue | `#039BE5` | 팬린디·메모(2기), 연구(5-6), 생존수영 |
| Blueberry Navy | `#3F51B5` | 나들이, 강의 계열 |
| Lavender Indigo | `#7986CB` | 서류업무, 구금교무일지 |
| Grape Purple | `#8E24AA` | 8월 평창리조트 예약 (전체 주 이벤트) |
| Graphite Gray | `#616161` | 보조 텍스트, 비활성 아이콘 |

### 2-2. UI 기본 컬러

| 역할 | HEX | 설명 |
|------|-----|------|
| Background | `#FFFFFF` | 캘린더 셀 배경 |
| Surface | `#F1F3F4` | 헤더, 사이드바 배경 |
| Border | `#DADCE0` | 셀 구분선, 카드 테두리 |
| Text Primary | `#202124` | 날짜 숫자, 이벤트 제목 |
| Text Secondary | `#5F6368` | 요일 레이블, 보조 설명 |
| Text On Color | `#FFFFFF` | 컬러 태그 위 텍스트 |
| Today Highlight | `#1A73E8` | 오늘 날짜 원형 배지 |
| Brand Blue | `#1A73E8` | 주요 액션 버튼, 링크 |

---

## 3. 타이포그래피 (Typography)

참조 화면은 Google의 `Roboto` 폰트 시스템을 사용합니다. 한국어 프로젝트에는 `Pretendard` 또는 `Noto Sans KR`을 권장합니다.

```css
/* 폰트 우선순위 */
font-family: 'Pretendard', 'Noto Sans KR', 'Roboto', sans-serif;
```

### 텍스트 크기 체계

| 역할 | 크기 | 굵기 | 사용 위치 |
|------|------|------|-----------|
| Page Title | `22px` | 500 | 상단 "캘린더" 헤더 |
| Month/Year | `20px` | 400 | 네비게이션 "2024년 6월" |
| Day Label | `11px` | 500 | 요일 레이블 (월·화·수…) |
| Date Number | `12px` | 400 | 셀 날짜 숫자 |
| Today Date | `12px` | 700 | 오늘 날짜 (원형 강조) |
| Event Title | `12px` | 400 | 이벤트 태그 텍스트 |
| Sidebar Body | `14px` | 400 | 우측 Keep 메모 본문 |
| Sidebar Label | `12px` | 500 | 메모 카테고리 레이블 |

### 줄 간격 (Line Height)

| 상황 | 값 |
|------|-----|
| 이벤트 태그 단행 | `1.2` |
| 사이드바 본문 | `1.6` |
| 헤더 / 레이블 | `1.0` |

---

## 4. 간격 시스템 (Spacing)

`4px` 기본 단위의 배수를 사용합니다.

| 토큰 | 값 | 사용처 |
|------|----|--------|
| `space-1` | `4px` | 이벤트 태그 내부 패딩 (수직) |
| `space-2` | `8px` | 이벤트 태그 내부 패딩 (수평), 아이콘 간격 |
| `space-3` | `12px` | 셀 내부 상단 여백 |
| `space-4` | `16px` | 섹션 간 여백 |
| `space-6` | `24px` | 헤더 수직 패딩 |
| `space-8` | `32px` | 사이드바 패딩 |

---

## 5. 컴포넌트 (Components)

### 5-1. 이벤트 태그 (Event Tag)

```
┌─────────────────────────┐
│ 활영&백업                │  ← 배경: 카테고리 컬러
└─────────────────────────┘
```

| 속성 | 값 |
|------|----|
| height | `20px` |
| border-radius | `4px` |
| padding | `2px 8px` |
| font-size | `12px` |
| color | `#FFFFFF` |
| overflow | `hidden` + `text-overflow: ellipsis` |
| cursor | `pointer` |

**전체 주 이벤트 (멀티데이)** — 연한 배경 + 진한 텍스트 변형:
```css
background: rgba(142, 36, 170, 0.15);
color: #8E24AA;
border-left: 3px solid #8E24AA;
```

### 5-2. 날짜 셀 (Calendar Cell)

```
┌──────────────┐
│  10          │  ← 날짜 숫자 (우상단 정렬)
│              │
│ [이벤트태그]  │
│ [이벤트태그]  │
└──────────────┘
```

| 속성 | 값 |
|------|----|
| border | `1px solid #DADCE0` |
| min-height | `100px` (데스크톱) |
| padding | `4px` |
| date number position | `우측 상단` |
| overflow-y | `hidden` (초과 항목은 "+N개" 링크로) |

### 5-3. 오늘 날짜 배지 (Today Badge)

```css
.today-badge {
  background: #1A73E8;
  color: #FFFFFF;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}
```

### 5-4. 헤더 버튼 (Header Button)

| 유형 | 스타일 |
|------|--------|
| 오늘 버튼 | 테두리 `1px solid #DADCE0`, 배경 `#FFF`, 반경 `4px`, 패딩 `8px 16px` |
| 이전/다음 화살표 | 아이콘 버튼, 원형 hover `rgba(0,0,0,0.08)`, 크기 `40px` |
| 아이콘 버튼 (검색 등) | 원형, 지름 `40px`, hover `rgba(0,0,0,0.08)` |

### 5-5. 사이드바 메모 카드 (Sidebar Card)

```
┌──────────────────────────┐
│ 문구                      │  ← 레이블 (font-size: 13px, bold)
│ 안녕하세요, 학생 지조회…   │  ← 본문 (font-size: 13px, color: #202124)
│                           │
│ 위험한 행동 금지           │  ← 하위 항목 (color: #5F6368)
└──────────────────────────┘
```

| 속성 | 값 |
|------|----|
| background | `#FFFDE7` (메모 카드) / `#E8F0FE` (파란 카드) |
| border-radius | `8px` |
| padding | `12px 16px` |
| margin-bottom | `8px` |
| box-shadow | `없음 (flat design)` |

### 5-6. 체크리스트 항목 (Checklist Item)

```
☐ 2학기: 목요일만 6교시
☐ 연수듣기(다문화,학업중단...)
```

| 속성 | 값 |
|------|----|
| font-size | `13px` |
| color | `#202124` |
| checkbox size | `16px` |
| gap (checkbox ↔ 텍스트) | `8px` |
| completed item | `text-decoration: line-through`, `color: #9AA0A6` |

---

## 6. 아이콘 (Icons)

Google Material Icons 기준:

| 아이콘 | 사용처 |
|--------|--------|
| `search` | 검색 |
| `help_outline` | 도움말 |
| `settings` | 설정 |
| `view_week` / `view_month` | 뷰 전환 |
| `chevron_left` / `chevron_right` | 날짜 이동 |
| `apps` | 앱 그리드 |
| `add` | 새 항목 추가 |
| `more_vert` | 더 보기 메뉴 |

권장 아이콘 크기: `20px` (헤더), `18px` (인라인)

---

## 7. 그리드 시스템 (Grid)

### 캘린더 주간 그리드

```
[주번호 열 48px] | [일 열] [월 열] [화 열] [수 열] [목 열] [금 열] [토 열]
                         ↑ 균등 분할 (1fr × 7)
```

```css
.calendar-grid {
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
}
```

### 사이드바 레이아웃

```
[캘린더 영역 flex: 1] | [사이드바 320px]
```

---

## 8. 인터랙션 & 상태 (Interaction States)

| 상태 | 표현 방식 |
|------|-----------|
| Hover (셀) | `background: rgba(0,0,0,0.04)` |
| Hover (이벤트 태그) | `filter: brightness(0.92)`, `cursor: pointer` |
| Hover (버튼) | 원형 ripple `rgba(0,0,0,0.08)` |
| Active (클릭) | `filter: brightness(0.85)` |
| Focus | `outline: 2px solid #1A73E8`, `outline-offset: 2px` |
| Disabled | `opacity: 0.38`, `cursor: not-allowed` |

---

## 9. 반응형 브레이크포인트 (Breakpoints)

| 이름 | 너비 | 변화 |
|------|------|------|
| Mobile | `< 600px` | 주간 → 일별 뷰 전환, 사이드바 숨김 |
| Tablet | `600px ~ 960px` | 사이드바 축소 또는 오버레이 |
| Desktop | `> 960px` | 전체 레이아웃 (캘린더 + 사이드바) |

---

## 10. 접근성 (Accessibility)

- 이벤트 태그에 `aria-label`로 전체 제목 제공 (텍스트 잘림 보완)
- 색상만으로 카테고리 구분하지 않고, 아이콘 또는 패턴 병행 권장
- 오늘 날짜 배지: `aria-current="date"` 속성 추가
- 색상 대비비: 텍스트와 배경 간 **4.5:1 이상** 유지 (WCAG AA)
- 키보드 탐색: 날짜 셀 포커스 이동 지원 (`tabindex`, `arrow key` 핸들링)
