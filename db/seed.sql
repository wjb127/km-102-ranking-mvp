-- =====================================================
-- 초기 샘플 데이터 (개발/데모용)
-- 사용법: schema.sql 먼저 실행 후 이 파일 실행
-- =====================================================

-- 1. 선수 (챔피언/탑랭커 위주 10명)
INSERT INTO fighters (external_id, full_name, full_name_ko, nickname, nickname_ko, weight_class, nationality, nationality_ko, image_url) VALUES
  (1001, 'Jon Jones',         '존 존스',        'Bones',       '본즈',       'Heavyweight',     'USA',    '미국',    NULL),
  (1002, 'Islam Makhachev',    '이슬람 마카체프',  NULL,          NULL,          'Lightweight',     'Russia', '러시아',  NULL),
  (1003, 'Alexander Volkanovski','알렉산더 볼카노프스키','The Great','더 그레이트',  'Featherweight',   'Australia','호주',   NULL),
  (1004, 'Ilia Topuria',        '일리아 토푸리아',  'El Matador', '엘 마타도르',  'Featherweight',   'Spain',  '스페인',  NULL),
  (1005, 'Alex Pereira',        '알렉스 페레이라',  'Poatan',     '포아탄',      'Light Heavyweight','Brazil','브라질',  NULL),
  (1006, 'Dricus Du Plessis',   '드리커스 듀 플레시스','Stillknocks','스틸녹스',  'Middleweight',    'South Africa','남아공',NULL),
  (1007, 'Leon Edwards',        '레온 에드워즈',    'Rocky',      '로키',        'Welterweight',    'UK',     '영국',    NULL),
  (1008, 'Alexandre Pantoja',   '알렉산드르 판토자', 'The Cannibal','더 카니발',  'Flyweight',       'Brazil', '브라질',  NULL),
  (1009, 'Merab Dvalishvili',   '메랍 드발리슈빌리', 'The Machine','더 머신',     'Bantamweight',    'Georgia','조지아',  NULL),
  (1010, 'Conor McGregor',      '코너 맥그리거',    'Notorious',  '노토리어스',   'Lightweight',     'Ireland','아일랜드',NULL)
ON CONFLICT (external_id) DO NOTHING;

-- 2. 단체별 전적 (UFC)
INSERT INTO fighter_org_records (fighter_id, organization_id, wins, losses, draws, no_contests, wins_by_ko, wins_by_sub, wins_by_dec)
SELECT f.id, o.id,
       CASE f.full_name
         WHEN 'Jon Jones'         THEN 28
         WHEN 'Islam Makhachev'   THEN 26
         WHEN 'Alexander Volkanovski' THEN 26
         WHEN 'Ilia Topuria'      THEN 16
         WHEN 'Alex Pereira'      THEN 12
         WHEN 'Dricus Du Plessis' THEN 23
         WHEN 'Leon Edwards'      THEN 22
         WHEN 'Alexandre Pantoja' THEN 29
         WHEN 'Merab Dvalishvili' THEN 17
         WHEN 'Conor McGregor'    THEN 22
       END,
       CASE f.full_name
         WHEN 'Jon Jones'         THEN 1
         WHEN 'Islam Makhachev'   THEN 1
         WHEN 'Alexander Volkanovski' THEN 4
         WHEN 'Ilia Topuria'      THEN 0
         WHEN 'Alex Pereira'      THEN 2
         WHEN 'Dricus Du Plessis' THEN 2
         WHEN 'Leon Edwards'      THEN 4
         WHEN 'Alexandre Pantoja' THEN 5
         WHEN 'Merab Dvalishvili' THEN 4
         WHEN 'Conor McGregor'    THEN 6
       END,
       0, 1, 10, 7, 10
FROM fighters f
CROSS JOIN organizations o
WHERE f.external_id BETWEEN 1001 AND 1010 AND o.slug = 'ufc'
ON CONFLICT (fighter_id, organization_id) DO NOTHING;

-- 3. 이벤트 샘플
INSERT INTO events (external_id, organization_id, name, name_ko, event_date, venue, venue_ko, country) VALUES
  (5001, (SELECT id FROM organizations WHERE slug='ufc'),
   'UFC 310: Pantoja vs. Asakura', 'UFC 310: 판토자 vs 아사쿠라',
   '2026-05-11 12:00:00+00', 'T-Mobile Arena, Las Vegas', 'T-모바일 아레나, 라스베이거스', 'USA'),
  (5002, (SELECT id FROM organizations WHERE slug='ufc'),
   'UFC Fight Night: Edwards vs. Brady', 'UFC 파이트 나이트: 에드워즈 vs 브래디',
   '2026-05-25 18:00:00+00', 'O2 Arena, London', 'O2 아레나, 런던', 'UK'),
  (5003, (SELECT id FROM organizations WHERE slug='one'),
   'ONE 170: Superlek vs. Takeru', 'ONE 170: 수퍼렉 vs 타케루',
   '2026-06-07 09:00:00+00', 'Lumpinee Stadium, Bangkok', '룸피니 스타디움, 방콕', 'Thailand')
ON CONFLICT (external_id) DO NOTHING;

-- 4. 게시판 샘플 (30개 — DC 스타일 제목)
INSERT INTO board_posts (author_nickname, category, title, content, view_count, like_count, comment_count, created_at) VALUES
  ('옥타곤매니아',   'analysis',   '판토자 vs 아사쿠라 전력 분석.txt',            '판토자 그래플링 vs 아사쿠라 타격...',   7340, 445, 127, NOW() - INTERVAL '5 minutes'),
  ('LetsGoChamp',  'discussion', '맥그리거 진짜 복귀함? ㅋㅋ',                   '토니 퍼거슨이 매치업 거론...',             5521, 312, 89,  NOW() - INTERVAL '17 minutes'),
  ('타이탄',       'analysis',   '일리아 토푸리아 스탯 미쳤네',                    '정타 적중률 55% 수준...',                   4120, 268, 54,  NOW() - INTERVAL '42 minutes'),
  ('삼보의정석',    'discussion', '마카체프 페더급 가면 볼카 다시 잡을까',            '사이즈 차이로 볼카가 유리할 듯',            3890, 201, 43,  NOW() - INTERVAL '1 hour'),
  ('KOKING',      'free',       '오늘자 사이드킥 모음 gif',                      '',                                          3201, 188, 21,  NOW() - INTERVAL '2 hours'),
  ('그라운드전문가','analysis',   '판토자 리어네이키드 피니시 5연속 정리',             '본인 유튜브에 업로드했는데...',              2890, 171, 32,  NOW() - INTERVAL '3 hours'),
  ('플라이웨이트',  'discussion', '플라이급 차기 도전자 누굴까',                     '판토자 vs 반자 or 카라 프랑스',             2150, 134, 28,  NOW() - INTERVAL '4 hours'),
  ('아르망승리',    'free',       '잘림 vs 아르망 이번엔 승자 누구?',                '개인적으로 아르망 손들어줌',                 1920, 108, 19,  NOW() - INTERVAL '6 hours'),
  ('UFC310직관',   'discussion', 'UFC 310 티켓 팩키지 공유',                     'T-모바일 현장 직관 계획...',                 1530, 92,  14,  NOW() - INTERVAL '12 hours'),
  ('볼카팬',       'analysis',   '볼카노프스키 복귀전 전적 예측',                   '일단 타이틀샷은 무리일듯',                   1210, 78,  12,  NOW() - INTERVAL '18 hours'),
  ('미들급왕',     'discussion', '듀 플레시스 vs 체르노프 예측',                    '체르노프 베팅배당 1.8...',                    980, 61,  9,   NOW() - INTERVAL '1 day'),
  ('섭미션콜렉터',  'analysis',   '이번달 베스트 서브미션 Top 5',                    '5위 기요틴초크...',                          850, 54,  7,   NOW() - INTERVAL '1 day'),
  ('헤비급광팬',    'discussion', '존스 은퇴하면 누가 헤비급 챔프?',                   '아스피날 vs 간',                             760, 42,  6,   NOW() - INTERVAL '1 day'),
  ('밀레토스',     'free',       '체육관 스파링 팁 공유',                         '어깨 힘 빼는게 핵심...',                    690, 38,  5,   NOW() - INTERVAL '2 days'),
  ('BJJ초보',     'discussion', '주짓수 시작한지 6개월 됐는데',                      '블루벨트 따려면 몇년 더 해야',               620, 31,  8,   NOW() - INTERVAL '2 days'),
  ('K-1시절그리움','free',       'K-1 전성기 시절 생각남',                       '안디 후그 떡대는 진짜...',                    580, 29,  4,   NOW() - INTERVAL '3 days'),
  ('원챔스피커',    'analysis',   'ONE 170 수퍼렉 vs 타케루 전망',                   '수퍼렉 거리 조절 관건...',                   510, 26,  5,   NOW() - INTERVAL '3 days'),
  ('복서출신',     'discussion', 'MMA에 순수복서 전향하면 살아남음?',                 '그라운드만 좀 버티면...',                    470, 22,  6,   NOW() - INTERVAL '4 days'),
  ('CUTE_Fighter','free',       '아마추어 경기 1승 찍었다 ㅎㅎ',                    '1라운드 리어초크로...',                      420, 19,  3,   NOW() - INTERVAL '4 days'),
  ('페이크신동',    'analysis',   '페레이라 백핸드 공략법',                          '킥보다 주먹 카운터가...',                    380, 17,  2,   NOW() - INTERVAL '5 days'),
  ('라이트급팬',    'discussion', '라이트급 컨텐더 현황 정리',                        '1.차본 2.찰스 3.포이리에',                  340, 15,  3,   NOW() - INTERVAL '6 days'),
  ('이스라엘아딘',   'free',       '스타일바운더 이스라엘 근황?',                      '앞으로 1-2경기 남았다는 소문',                280, 12,  4,   NOW() - INTERVAL '7 days'),
  ('파이트IQ',    'analysis',   '체력관리 관점에서 본 최근 타이틀전',               '5라운드까지 끌린 경기 비율...',              250, 10,  2,   NOW() - INTERVAL '8 days'),
  ('KoreanMMA',  'discussion', '한국선수 UFC 진출 로드맵',                        '정찬성 계보 이을 선수...',                    220, 9,   1,   NOW() - INTERVAL '10 days'),
  ('링사이드',     'free',       '라스베가스 직관 후기.jpg',                      'T-모바일 아레나 진짜 좋음',                  190, 8,   3,   NOW() - INTERVAL '12 days'),
  ('레슬링베이스', 'analysis',   '레슬링 베이스 파이터 분석',                        '카마루 우스만 성공 요인...',                 160, 6,   1,   NOW() - INTERVAL '14 days'),
  ('쿨다운',      'discussion', '경기 후 리커버리 루틴 뭐 쓰셈',                    '사우나 > 아이스배스 순환...',                140, 5,   2,   NOW() - INTERVAL '16 days'),
  ('WMMA',      'analysis',   '여성부 챔프 현황 총정리',                          '스트로급-팬급 모두 교체기...',                120, 4,   1,   NOW() - INTERVAL '20 days'),
  ('격투기입문',    'free',       '격투기 시작하려는데 뭐부터',                       '주짓수가 진입장벽 낮음...',                   100, 3,   2,   NOW() - INTERVAL '25 days'),
  ('고인물',      'discussion', '10년 전 UFC vs 지금 UFC',                        '레벨은 지금이 훨씬 높음',                      80, 2,   1,   NOW() - INTERVAL '30 days');
