<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# backend / api server 규칙
- 모든 api는 json만 응답한다
- http status code를 정확하게 사용한다
- 에러도 json으로 응답한다: {error: "..."}
- 사용자 입력 검증은 프론트에서 1차 하고 백에서 2차 한다
- 인증이 필요한 API는 Bearer 토큰으로 전달한다
