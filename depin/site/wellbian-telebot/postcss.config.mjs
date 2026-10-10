/* 이 프로젝트는 Tailwind 를 쓰지 않는다. 설정 파일이 없으면 Next 가 상위 디렉터리를 훑어
   메인 저장소의 postcss 설정을 집어 오고, 거기 걸린 tailwindcss 를 찾다가 빌드가 깨진다.
   빈 설정을 두어 탐색을 여기서 멈춘다. */
const config = { plugins: {} };
export default config;
