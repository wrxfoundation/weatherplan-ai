"use client";
/* 히어로 스캔 레이어 (8/29 서우) — 3MB 짜리 루프 영상 대신 정지컷 위에 WebGL 한 겹.
   기기 화면 근처에서 밝은 띠가 태어나 홀로그램을 타고 올라가다 위쪽에서 사라지고,
   띠가 지나는 자리에서만 입자가 반짝인다.

   마스크를 그려 두지 않고 픽셀 색으로 홀로그램을 찾는 이유: 서우가 배경 이미지를
   직접 갈아 끼우기 때문이다. 마스크 파일을 쓰면 이미지를 바꿀 때마다 마스크도 다시
   만들어야 한다. 홀로그램은 채도 높은 청·보라인데 나무·햇빛은 따뜻한 색이라
   (파랑 − 빨강) × 채도만으로 충분히 갈린다. 창밖 하늘은 파랗지만 채도가 낮아 걸러지고,
   그래도 남는 건 화면 우상단으로 한 번 더 좁혀 막는다.

   WebGL 이 없거나(구형·비활성) 모션 줄이기면 이 컴포넌트를 아예 붙이지 않는다 —
   그 경우 정지컷만 남고 화면은 정상이다. */
import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCanvas;
uniform vec2 uImage;
uniform float uPosX;
uniform float uTime;
uniform float uPeriod;
uniform float uFrom;
uniform float uTo;
uniform float uWidth;
uniform float uStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  /* object-fit: cover 와 같은 크롭을 셰이더에서 재현한다.
     fx·fy = 이미지에서 실제로 보이는 비율, uPosX = 가로 기준점(1.0 = 오른쪽 정렬) */
  float sC = uCanvas.x / uCanvas.y;
  float sI = uImage.x / uImage.y;
  float fx = min(sC / sI, 1.0);
  float fy = min(sI / sC, 1.0);
  vec2 uv = vec2(
    uPosX * (1.0 - fx) + vUv.x * fx,
    0.5 * (1.0 - fy) + vUv.y * fy
  );

  vec3 c = texture2D(uTex, uv).rgb;

  /* 홀로그램 판별 — 파랑 우세 × 채도 × 밝기 */
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = (mx - mn) / max(mx, 1e-4);
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  float holo = clamp((c.b - c.r) * 2.2, 0.0, 1.0)
             * smoothstep(0.30, 0.62, sat)
             * smoothstep(0.05, 0.30, lum);
  /* 창밖 하늘·유리 반사 방지 — 홀로그램이 있는 우상단으로 한 번 더 좁힌다 */
  holo *= smoothstep(0.26, 0.44, uv.x) * smoothstep(0.32, 0.50, uv.y);

  /* 올라가는 띠. uv.y 는 아래가 0 이라 uFrom(기기 근처) → uTo(프레임 위)로 간다 */
  float t = fract(uTime / uPeriod);
  float yc = mix(uFrom, uTo, t);
  float d = (uv.y - yc) / uWidth;
  float band = exp(-d * d);
  float fade = 1.0 - smoothstep(0.70, 1.0, t);

  float glow = holo * band * fade;
  /* 반짝임 — 띠가 지나는 자리에서만 튄다 */
  vec2 cell = floor(uv * vec2(260.0, 150.0));
  float spark = smoothstep(0.971, 1.0, hash(cell + floor(uTime * 7.0))) * glow;

  float a = clamp(glow * uStrength + spark * 1.7, 0.0, 1.0);
  /* 흰색으로 타지 않게 원래 홀로그램 색을 절반쯤 끌고 간다 */
  vec3 tint = mix(c * 1.5, vec3(0.72, 0.88, 1.0), 0.42);
  gl_FragColor = vec4(tint * a, a);
}`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
  return sh;
};

type Props = {
  /** 배경 정지컷. 이 이미지를 그대로 텍스처로 읽어 홀로그램 위치를 찾는다 */
  src: string;
  /** 한 번 훑는 데 걸리는 시간(초) */
  period?: number;
  /** 밝기 배수 */
  strength?: number;
};

export function HeroFx({ src, period = 3.2, strength = 0.85 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = (cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false })
      || cv.getContext("experimental-webgl", { alpha: true })) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uCanvas = u("uCanvas"), uImage = u("uImage"), uPosX = u("uPosX"), uTime = u("uTime");
    gl.uniform1f(u("uPeriod"), period);
    gl.uniform1f(u("uStrength"), strength);
    /* 기기 화면 바로 아래(0.42)에서 태어나 프레임 위(1.0)로 빠진다.
       0.42 지점은 홀로그램 마스크가 아직 0 이라 실제로는 구름 밑단부터 보이기 시작한다. */
    gl.uniform1f(u("uFrom"), 0.42);
    gl.uniform1f(u("uTo"), 1.0);
    gl.uniform1f(u("uWidth"), 0.055);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // 색을 더하기만 한다 — 어둡게 만들지 않는다

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    /* 2의 거듭제곱이 아닌 크기라 밉맵 없이 CLAMP_TO_EDGE */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let raf = 0, ready = false, visible = true, imgW = 1, imgH = 1;
    const t0 = performance.now();

    const resize = () => {
      /* DPR 2 로 1080p 를 매 프레임 칠할 이유가 없다 — 1.5 로 잘라도 띠는 부드럽다 */
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr));
      const h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uCanvas, w, h);
      /* 배경 크롭 기준점 — CSS 와 같은 값(데스크톱 오른쪽 정렬, 720px 이하 65%) */
      gl.uniform1f(uPosX, matchMedia("(max-width: 720px)").matches ? 0.65 : 1.0);
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      resize();
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      imgW = img.naturalWidth; imgH = img.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.uniform2f(uImage, imgW, imgH);
      ready = true;
      cv.classList.add("on");
    };
    img.src = src;

    /* 히어로가 화면 밖이면 GPU 를 놀린다 — 스크롤 내린 상태에서 계속 돌 이유가 없다 */
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(cv);
    const onVis = () => { visible = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVis);
    /* 컨텍스트를 잃으면 조용히 멈춘다(정지컷은 아래에 그대로 있다) */
    const onLost = (e: Event) => { e.preventDefault(); ready = false; cv.classList.remove("on"); };
    cv.addEventListener("webglcontextlost", onLost);

    resize();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.deleteTexture(tex); gl.deleteBuffer(buf); gl.deleteProgram(prog);
      gl.deleteShader(vs); gl.deleteShader(fs);
    };
  }, [src, period, strength]);

  return <canvas ref={ref} className="hero-fx" aria-hidden />;
}
