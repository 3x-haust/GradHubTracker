# ==================================
#   Stage 1: Build the React App
# ==================================
# 빌드를 위한 풀버전 Node 이미지를 사용합니다.
FROM node:lts-alpine AS builder

WORKDIR /app

# Docker 캐시를 활용하기 위해 package.json과 yarn.lock을 먼저 복사합니다.
COPY package.json yarn.lock ./

# 빌드에 필요한 모든 의존성을 설치합니다.
RUN yarn install

# 나머지 소스 코드를 복사합니다.
COPY . .

# 프로덕션용 정적 파일을 생성합니다. (결과물은 /app/dist 폴더에 생성됩니다)
RUN yarn build

# ==================================
#   Stage 2: Serve the App
# ==================================
# 프로덕션용으로는 가벼운 알파인 이미지를 사용합니다.
FROM node:lts-alpine

WORKDIR /app

# 정적 파일을 서빙할 'serve' 패키지를 설치합니다.
RUN npm install -g serve

# builder 스테이지에서 빌드된 결과물(/app/dist)만 현재 위치로 복사합니다.
COPY --from=builder /app/dist .

# 2082 포트를 외부에 노출합니다.
EXPOSE 2082

# 'serve'를 실행하여 현재 폴더(.)의 파일을 2082 포트로 서빙합니다.
# -s 플래그는 Single-Page Application(SPA) 라우팅을 올바르게 처리해줍니다.
CMD ["serve", "-s", ".", "-l", "2082"]