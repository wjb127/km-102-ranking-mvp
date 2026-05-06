--
안녕하세요. MMA 분석 커뮤니티 웹사이트 개발 용역 계약 산출물 인수 안내드립니다.

(가) 배포 URL
- Production: https://km-102-ranking-mvp.vercel.app
- 커스텀 도메인 연결은 Vercel 대시보드의 Project, Domains 메뉴에서 진행 가능합니다.

(나) Git 저장소
- https://github.com/wjb127/km-102-ranking-mvp (master 브랜치 기준)
- 인수 시 GitHub 사용자명을 알려주시면 Collaborator 권한 부여드립니다.

(다) 외부 서비스 인수 절차
1. Vercel: 프로젝트를 클라이언트 팀으로 이전 (Settings의 Transfer 메뉴)
2. Neon (Postgres): 프로젝트 멤버 추가 후 Owner 권한 변경
3. Cloudinary (이미지): 콘솔의 Account 메뉴에서 이메일 변경
4. balldontlie (MMA API): 결제 카드 클라이언트 명의 변경 후 키 재발급
- 상세 절차와 환경변수 매핑은 docs/HANDOVER.md 및 첨부 인수 자료에 정리해 두었습니다.

(라) 관리자 가이드
- /admin 경로 (role=admin 사용자만 접근 가능)
- 회원, 선수, 경기, 게시글, 신고 보정 메뉴와 감사 로그(/admin/overrides) 제공
- 첫 관리자 부여는 SQL로 진행합니다. UPDATE users SET role='admin' WHERE email='관리자_이메일';
- 이후에는 /admin/users 화면에서 다른 회원에게 직접 부여할 수 있습니다.

(마) 자동 동기화 (Vercel Cron)
- 매일 18:00 UTC: 선수, 이벤트 최신 데이터 수집
- 매주 일요일 19:00 UTC: 경기 결과 수집 및 전적 재계산
- 수동 트리거 명령어는 docs/HANDOVER.md "4. Vercel Cron" 절에 기재되어 있습니다.

(바) 인수 체크리스트
- 첨부된 인수 자료 마지막 절에 정리해 두었습니다. 항목별로 진행하신 후 회신 주시면 도와드리겠습니다.

문의 사항 있으시면 언제든 회신 부탁드립니다. 감사합니다.
--
