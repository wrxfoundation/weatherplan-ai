#!/usr/bin/env bash
# wellbian spaces 01 · 카페 — 최종 합성(30초, 원본 오디오 그대로 · 원본 장면 전환 시점에 맞춤)
# 필요: clips/c1.mp4 c2 c3 c4 c6(Higgsfield Kling 3.0 Turbo 5초) · clips/panel_blur.mp4(원본 15.5~24.25초 보상 화면 패널, 전환 수치 가림)
#       clips/bg5.png(데이터층 장면 흐림 배경) · overlays/*.png(captions.py) · 원본 영상 경로($1 — 오디오만 씀)
set -euo pipefail
cd "$(dirname "$0")"
SRC="${1:?원본 mp4 경로}"
OUT="${2:-wellbian-spaces-01-cafe.mp4}"
F="fps=30000/1001,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,format=yuv420p"
# 장면 경계(원본 오디오 기준) 0 · 4.0 · 8.0 · 12.0 · 15.5 · 24.25 · 29.49 — 경계마다 0.5초 크로스페이드
ffmpeg -v error -y \
  -i clips/c1.mp4 -i clips/c2.mp4 -i clips/c3.mp4 -i clips/c4.mp4 \
  -loop 1 -t 9.25 -i clips/bg5.png -i clips/panel_blur.mp4 -i clips/c6.mp4 \
  -loop 1 -t 29.49 -i overlays/chip.png \
  -loop 1 -t 29.49 -i overlays/cap1.png -loop 1 -t 29.49 -i overlays/cap2.png -loop 1 -t 29.49 -i overlays/cap3.png \
  -loop 1 -t 29.49 -i overlays/cap4.png -loop 1 -t 29.49 -i overlays/cap5a.png -loop 1 -t 29.49 -i overlays/cap5b.png \
  -loop 1 -t 29.49 -i overlays/end.png \
  -i "$SRC" \
  -filter_complex "\
[0:v]trim=0:4.25,setpts=PTS-STARTPTS,$F[s1];\
[1:v]trim=0:4.5,setpts=PTS-STARTPTS,$F[s2];\
[2:v]trim=0:4.5,setpts=PTS-STARTPTS,$F[s3];\
[3:v]trim=0:4.0,setpts=PTS-STARTPTS,$F[s4];\
[4:v]$F,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30000/1001,trim=0:9.25,setpts=PTS-STARTPTS[bg];\
[5:v]fps=30000/1001,format=yuva420p,fade=in:st=0:d=0.3:alpha=1,fade=out:st=8.5:d=0.27:alpha=1,setpts=PTS-STARTPTS+0.25/TB[pn];\
[bg][pn]overlay=748:0:eof_action=pass,format=yuv420p[s5];\
[6:v]$F,tpad=stop_mode=clone:stop_duration=0.6,trim=0:5.49,setpts=PTS-STARTPTS[s6];\
[s1][s2]xfade=transition=fade:duration=0.5:offset=3.75[x1];\
[x1][s3]xfade=transition=fade:duration=0.5:offset=7.75[x2];\
[x2][s4]xfade=transition=fade:duration=0.5:offset=11.75[x3];\
[x3][s5]xfade=transition=fade:duration=0.5:offset=15.25[x4];\
[x4][s6]xfade=transition=fade:duration=0.5:offset=24.0[v];\
[7:v]format=rgba,fade=in:st=0.3:d=0.4:alpha=1,fade=out:st=24.1:d=0.4:alpha=1[o0];\
[8:v]format=rgba,fade=in:st=0.3:d=0.3:alpha=1,fade=out:st=3.7:d=0.3:alpha=1[o1];\
[9:v]format=rgba,fade=in:st=4.15:d=0.3:alpha=1,fade=out:st=7.7:d=0.3:alpha=1[o2];\
[10:v]format=rgba,fade=in:st=8.15:d=0.3:alpha=1,fade=out:st=11.7:d=0.3:alpha=1[o3];\
[11:v]format=rgba,fade=in:st=12.15:d=0.3:alpha=1,fade=out:st=15.1:d=0.3:alpha=1[o4];\
[12:v]format=rgba,fade=in:st=15.6:d=0.3:alpha=1,fade=out:st=19.7:d=0.25:alpha=1[o5];\
[13:v]format=rgba,fade=in:st=20.0:d=0.25:alpha=1,fade=out:st=23.8:d=0.3:alpha=1[o6];\
[14:v]format=rgba,fade=in:st=24.6:d=0.6:alpha=1[o7];\
[v][o0]overlay=0:0[v0];[v0][o1]overlay=0:0[v1];[v1][o2]overlay=0:0[v2];[v2][o3]overlay=0:0[v3];\
[v3][o4]overlay=0:0[v4];[v4][o5]overlay=0:0[v5];[v5][o6]overlay=0:0[v6];[v6][o7]overlay=0:0,format=yuv420p[vout]" \
  -map "[vout]" -map 15:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t 29.49 -movflags +faststart "$OUT"
echo "built $OUT"
