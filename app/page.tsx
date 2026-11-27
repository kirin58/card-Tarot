"use client";

import { useEffect, useRef, useState } from "react";

const readings = [
  "รออีกนิด ใจมีเฉลย",
  "เชื่อเสียงใจ กูเกิลพักก่อน",
  "เงียบสักพัก คำตอบจะมา",
  "ฟังใจก่อน ชายังอุ่น",
  "ฝันอาจใบ้ จดก่อนลืม",
  "ใจรู้แล้ว สมองตามมา",
];

const TAU = Math.PI * 2;
const lead = "#100e22";
const clamp = (value = 0, limit = 1) => Math.max(-limit, Math.min(limit, value));

function randomFrom(seed = 1) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeMosaic(columns = 17, rows = 23) {
  const random = randomFrom(72);
  const palette = [
    ["#242045", "#222952", "#322256", "#1d345d", "#43275b", "#19264b"],
    ["#393271", "#47317a", "#2d467b", "#59408a", "#395b91", "#533265"],
    ["#65519c", "#536caf", "#6c5ca8", "#477daf", "#8472b8", "#664a98"],
    ["#a095cb", "#8da8db", "#7cb6d5", "#b28bc6", "#9eb4dd", "#8597d0"],
    ["#d0b9de", "#c5e0e8", "#ebd9e8", "#b4dfed", "#eed8c2", "#d1caeb"],
  ];
  const grid = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, col) => ({
      x: col * 320 / columns + (col > 0 && col < columns ? (random() - .5) * 15 : 0),
      y: row * 456 / rows + (row > 0 && row < rows ? (random() - .5) * 16 : 0),
    })),
  );

  return grid.slice(0, rows).flatMap((line, row) =>
    line.slice(0, columns).flatMap((topLeft, col) => {
      const topRight = line[col + 1];
      const bottomLeft = grid[row + 1][col];
      const bottomRight = grid[row + 1][col + 1];
      const triangles = random() < .5
        ? [[topLeft, topRight, bottomLeft], [topRight, bottomRight, bottomLeft]]
        : [[topLeft, topRight, bottomRight], [topLeft, bottomRight, bottomLeft]];

      return triangles.map((points) => {
        const x = points.reduce((sum, point) => sum + point.x, 0) / 3;
        const y = points.reduce((sum, point) => sum + point.y, 0) / 3;
        const distance = Math.hypot((x - 160) / 145, (y - 135) / 245);
        const band = Math.max(0, Math.min(4, Math.floor(5.3 - distance * 4.5 + random() * 1.3)));
        return {
          points: points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "),
          band,
          fill: palette[band][Math.floor(random() * palette[band].length)],
        };
      });
    }),
  );
}

const mosaic = makeMosaic();
const deckMosaic = makeMosaic(16, 23);
const glassBands = Array.from({ length: 5 }, (_, band) =>
  deckMosaic.filter((pane) => pane.band === band).map(({ points }) => "M" + points + "Z").join(""),
);
const facetHighlights = deckMosaic.filter((_, index) => index % 4 === 2).map(({ points }) => {
  const [first, second, opposite] = points.split(" ").map((pair) => pair.split(",").map(Number));
  const inset = (start = [0, 0], end = [0, 0]) => start.map((value, axis) =>
    (value * .76 + end[axis] * .13 + opposite[axis] * .11).toFixed(1),
  ).join(",");
  return "M" + inset(first, second) + "L" + inset(second, first);
}).join("");

function Glass({ d = "", fill = "#fff", width = 2.4 }) {
  return <path d={d} fill={fill} stroke={lead} strokeWidth={width} strokeLinejoin="round" />;
}

function polar(radius = 1, angle = 0) {
  return `${(Math.sin(angle) * radius).toFixed(2)},${(-Math.cos(angle) * radius).toFixed(2)}`;
}

function ringPane(inner = 1, outer = 2, start = 0, end = 1) {
  return `M${polar(outer, start)} A${outer},${outer} 0 0 1 ${polar(outer, end)}
    L${polar(inner, end)} A${inner},${inner} 0 0 0 ${polar(inner, start)} Z`;
}

function Petal({ angle = 0, fill = "#fff", tip = 12, width = 4 }) {
  return (
    <path
      d={`M0,-2 C${-width},${-tip * .48} ${-width * 1.1},${-tip * .8} 0,${-tip}
        C${width * 1.1},${-tip * .8} ${width},${-tip * .48} 0,-2Z`}
      transform={`rotate(${angle})`}
      fill={fill}
      stroke={lead}
      strokeWidth="1.1"
    />
  );
}

const flowerColors = [
  ["#f58f76", "#bc4f70", "#ffd5a0"],
  ["#b18be4", "#7356ba", "#e1b6ed"],
  ["#75c6cd", "#478aab", "#cceddb"],
  ["#f9c878", "#d88153", "#ffe2ac"],
  ["#dd87b7", "#ad528b", "#ffd1df"],
];

function Flower({ x = 0, y = 0, size = 1, hue = 0, count = 6, angle = 0, ring = false }) {
  const colors = flowerColors[hue];
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      {ring && <>
        <circle r="19" fill="#413a70" stroke={lead} strokeWidth="2.4" />
        <circle r="16.6" fill="#805495" stroke="#ae82b1" strokeWidth="1.3" />
        <circle r="14" fill="#322955" stroke={lead} strokeWidth="1.4" />
      </>}
      {Array.from({ length: count }, (_, index) => (
        <Petal key={index} angle={index * 360 / count} fill={colors[index % 2]} width={count > 6 ? 3.2 : 4.1} />
      ))}
      <circle r="3.3" fill={colors[2]} stroke={lead} strokeWidth="1.25" />
      <circle r="1.15" fill="#fff0c9" />
    </g>
  );
}

function Pillar({ x = 0, y = 0, height = 250, wide = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${wide ? 1 : .77} 1)`}>
      <Glass d={`M-7 8H7V${height}H-7Z`} fill="#1d192c" width={2.4} />
      <Glass d={`M-6 14H-2V${height - 4}H-6Z`} fill="#4b435c" width={1.4} />
      <Glass d={`M1 14H5V${height - 4}H1Z`} fill="#29243a" width={1.2} />
      <Glass d="M-12 0H12L9 5L7 9H-7L-9 5Z" fill="#41364d" width={2.2} />
      <Glass d="M-10 6H10L8 12H-8Z" fill="#252139" width={2} />
      <Glass d={`M-8 ${height - 3}H8L12 ${height + 8}H-12Z`} fill="#393048" width={2.2} />
      <path d={`M-9 3H9M-9 ${height + 4}H9`} stroke="#8c7384" strokeWidth=".85" />
    </g>
  );
}

function Halo() {
  const gold = ["#d79362", "#ffe0a1", "#efb977", "#f6d29b", "#a86a66", "#f6c47c"];
  return (
    <g transform="translate(160 136)">
      <circle r="88" fill="none" stroke="#b898a5" strokeWidth=".9" />
      {Array.from({ length: 32 }, (_, index) => {
        const angle = index * TAU / 32;
        return <path key={index} d={`M${polar(70, angle)} L${polar(index % 2 ? 80 : 88, angle)}`} stroke={index % 2 ? "#e9ae79" : "#ffdeb0"} strokeWidth={index % 2 ? 1.25 : 2} />;
      })}
      <circle r="72.5" fill="none" stroke={lead} strokeWidth="3.3" />
      {Array.from({ length: 32 }, (_, index) => (
        <Glass key={index} d={ringPane(60, 71, index * TAU / 32, (index + 1) * TAU / 32)} fill={gold[index % gold.length]} width={1.65} />
      ))}
      <circle r="58.5" fill="none" stroke="#f6c982" strokeWidth="2.6" />
      <circle r="54.5" fill="none" stroke={lead} strokeWidth="1.7" />
      <path d="M0-95 3-90 0-85-3-90ZM-90 0-85-3-80 0-85 3ZM90 0 85-3 80 0 85 3Z" fill="#ffe2a9" stroke={lead} strokeWidth="1" />
    </g>
  );
}

function Priestess() {
  return (
    <g>
      {/* The cloak's silhouette and the long panes in its skirt. */}
      <Glass d="M133 159C109 166 88 182 79 213C65 248 68 301 53 349L39 421Q85 445 160 434Q234 445 281 421L265 350C248 299 254 250 241 213C231 183 211 167 186 158Z" fill="#351a43" width={4.2} />
      <Glass d="M126 169C98 177 82 208 77 250C71 303 68 358 47 418L71 426C96 382 93 317 105 278C121 242 121 204 126 169Z" fill="#842839" />
      <Glass d="M194 169C222 177 238 208 243 250C250 307 253 366 273 419L248 426C222 383 229 319 215 277C196 235 199 199 194 169Z" fill="#8b2a40" />
      <Glass d="M124 176C108 196 102 222 93 261C82 310 90 369 70 426L99 432C116 381 118 327 128 289L148 196Z" fill="#d03c3e" />
      <Glass d="M196 176C213 200 218 228 227 263C240 313 230 371 249 426L221 432C206 384 203 327 192 289L173 196Z" fill="#c53037" />
      <Glass d="M130 174L109 193L105 231L119 281C112 336 119 385 96 432L127 436C153 395 130 341 151 294L163 192Z" fill="#ed654a" />
      <Glass d="M188 175L211 194L216 231L202 281C209 336 204 385 224 432L193 436C168 395 188 337 169 294L157 192Z" fill="#f26647" />
      <Glass d="M105 308Q115 323 116 342L108 399L94 432L74 427Q97 394 105 308Z" fill="#9e273c" />
      <Glass d="M214 312Q204 328 205 348L213 399L226 432L248 426Q225 393 214 312Z" fill="#972b3e" />
      <Glass d="M75 337 70 376 54 420 70 426 83 372Z" fill="#64203b" />
      <Glass d="M245 334 250 376 266 421 249 426 236 372Z" fill="#62203a" />

      <Glass d="M132 176Q161 167 189 176L205 227Q182 266 194 312L207 434Q161 443 112 434C128 392 120 330 132 295Q140 254 116 227Z" fill="#383168" />
      <Glass d="M132 211Q148 251 146 291Q140 349 143 436L114 434Q130 380 125 340L135 278Z" fill="#645199" />
      <Glass d="M189 210Q171 252 176 291Q183 357 177 436L206 434Q190 380 194 340L185 278Z" fill="#5652a1" />
      <Glass d="M160 229 181 281 169 327 181 388 177 438H143L139 388 151 327 139 281Z" fill="#474380" />
      <Glass d="M160 268 169 283 160 311 151 283ZM160 333 171 376 160 400 149 376ZM160 408 167 424 160 438 153 424Z" fill="#8b76bf" width={1.8} />
      <path d="M160 315V328M160 400V408M137 353L130 425M183 353L190 425" fill="none" stroke="#b19bd2" strokeWidth="1.35" />

      {/* Hair, neck and face. */}
      <Glass d="M160 81C134 80 115 96 110 123C106 146 111 155 102 175L87 202L115 198L134 187L186 187L206 198L233 202Q211 179 211 156C215 121 206 82 160 81Z" fill="#aaa1cc" width={3.1} />
      <Glass d="M156 84C133 86 119 99 116 125C115 152 119 167 98 192Q121 184 133 162L138 122Z" fill="#ece0ed" />
      <Glass d="M142 96Q123 105 126 134C128 155 121 173 108 192L124 189Q141 171 141 147Z" fill="#827da9" />
      <Glass d="M170 84C195 89 205 109 205 135C204 161 214 178 223 191Q201 184 188 169L180 119Z" fill="#ded9ed" />
      <Glass d="M182 99Q200 114 195 142Q191 167 213 193L194 188Q180 163 179 145Z" fill="#7878aa" />
      <Glass d="M144 151Q147 168 137 176L130 180Q159 209 189 180L181 175Q174 166 176 151Z" fill="#ce8fa1" />
      <Glass d="M146 153H172L173 167L160 183 145 174Z" fill="#e8b5b7" width={1.7} />
      <Glass d="M129 118C130 99 143 90 160 90C178 90 191 100 192 119L189 141Q185 159 174 167L161 174L147 167Q134 157 131 141Z" fill="#f0c5bd" width={2.7} />
      <Glass d="M130 122Q140 127 142 140Q143 157 158 169L147 167Q134 157 131 141Z" fill="#d99caa" width={1.45} />
      <Glass d="M192 121Q182 132 180 143Q180 156 162 173L174 167Q187 157 189 141Z" fill="#e1a4aa" width={1.45} />
      <Glass d="M160 88Q142 84 131 100Q123 111 126 134Q132 124 134 116Q151 109 160 97Q171 111 186 116Q189 128 195 134Q198 117 193 103Q186 87 160 88Z" fill="#f0e7f2" width={2.15} />
      <Glass d="M159 89Q139 85 129 108L136 111Q146 107 159 96Q173 106 188 114L193 113Q180 87 159 89Z" fill="#c8c8e5" width={1.3} />
      <path d="M138 129Q144 132 150 129M170 129Q176 132 182 129" fill="none" stroke="#432439" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M140 125Q145 122 150 124M170 124Q175 122 180 125M159 134L157 144 161 145M155 153Q160 155 165 153" fill="none" stroke="#a06178" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M164 112A5 5 0 1 1 156 112A4.3 4.3 0 0 0 164 112Z" fill="#f5c77e" stroke="#643954" strokeWidth=".85" />
      <path d="M128 144 132 149 128 155 124 149ZM192 144 196 149 192 155 188 149Z" fill="#ffd193" stroke={lead} strokeWidth="1.3" />

      {/* Mantle edges and the two folded sleeves. */}
      <Glass d="M130 174Q139 182 160 193Q182 181 189 174L198 184Q183 205 160 212Q135 206 122 184Z" fill="#d78a79" />
      <Glass d="M130 180 160 199 190 180 193 184 160 208 127 184Z" fill="#f7c58d" width={1.45} />
      <Glass d="M111 185Q96 191 88 221Q80 252 89 274Q100 295 124 291L154 260L141 242Q119 260 112 258Q125 224 133 209Z" fill="#dc473b" width={3} />
      <Glass d="M209 185Q224 192 232 222Q240 251 231 274Q220 295 196 291L166 260L179 242Q203 261 208 258Q196 226 187 209Z" fill="#e94e3a" width={3} />
      <Glass d="M110 189Q95 203 91 224Q94 240 91 250Q105 236 113 219L124 198Z" fill="#fd9364" />
      <Glass d="M210 189Q225 203 229 224Q226 240 229 250Q215 236 207 219L196 198Z" fill="#ff9666" />
      <Glass d="M89 250Q94 279 115 275L146 251L151 260L124 290Q101 295 90 273Z" fill="#9d2942" />
      <Glass d="M231 250Q226 278 205 275L174 251L169 260L196 290Q219 295 230 273Z" fill="#a02b42" />
      <Glass d="M103 261Q121 260 140 242L145 248Q130 267 113 273Z" fill="#fdab7c" width={1.8} />
      <Glass d="M217 261Q199 260 180 242L175 248Q190 267 207 273Z" fill="#ffab7c" width={1.8} />
      <Glass d="M134 247 143 236 156 255 148 268 137 262Z" fill="#f1b68b" width={1.8} />
      <Glass d="M186 247 177 236 164 255 172 268 183 262Z" fill="#f1b68b" width={1.8} />

      {/* Each hand meets the other along a single lead line. */}
      <Glass d="M144 242Q148 234 147 221L155 201Q157 196 160 198L160 242Q157 252 152 257Z" fill="#f2c7b9" width={2} />
      <Glass d="M176 242Q172 235 173 221L165 201Q163 196 160 198L160 242Q163 252 168 257Z" fill="#e6a8a8" width={2} />
      <path d="M151 228 155 211M169 228 165 211M149 239Q156 235 158 226M171 239Q164 235 162 226" fill="none" stroke="#a56b83" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M95 302Q91 347 76 378M225 302Q229 347 244 378M114 330Q114 378 98 410M206 330Q206 378 222 410" fill="none" stroke="#f2ad86" strokeWidth="1.35" />
      <path d="M160 187 165 193 160 199 155 193Z" fill="#ffe4aa" stroke={lead} strokeWidth="1.4" />
    </g>
  );
}

const climbingFlowers = [
  [24, 347, .92, 0, 5], [38, 324, .88, 1, 6], [20, 304, .85, 3, 6],
  [48, 285, .9, 4, 5], [29, 267, 1, 2, 7], [51, 242, .7, 0, 6],
  [26, 224, .78, 1, 5], [45, 203, .64, 3, 6], [29, 184, .54, 4, 5],
];

const footFlowers = [
  [36, 415, 1.27, 1], [54, 398, .91, 3], [66, 425, 1.35, 0], [85, 408, 1.03, 4],
  [107, 430, 1.2, 2], [122, 411, .84, 1], [139, 432, 1.2, 3], [159, 421, 1.38, 4],
  [179, 433, 1.21, 1], [197, 409, .85, 3], [218, 430, 1.13, 0], [239, 410, 1.06, 2],
  [256, 424, 1.32, 1], [272, 400, .91, 4], [288, 416, 1.16, 3],
];

function Vines({ mirror = false }) {
  return (
    <g transform={mirror ? "translate(320 0) scale(-1 1)" : undefined}>
      <path d="M40 439Q14 397 31 344Q48 309 32 279Q19 251 41 225Q55 201 29 182M33 363Q48 349 55 329M33 345L24 327M36 307L15 294M33 265L49 245M41 227L27 217" fill="none" stroke={lead} strokeWidth="4" />
      <path d="M40 439Q14 397 31 344Q48 309 32 279Q19 251 41 225Q55 201 29 182M33 363Q48 349 55 329M33 345L24 327M36 307L15 294M33 265L49 245M41 227L27 217" fill="none" stroke="#7cb9ac" strokeWidth="1.65" />
      {climbingFlowers.map(([x, y, size, hue, count], index) => (
        <g key={y} transform={`translate(${x} ${y})`}>
          <path d="M0 6Q-12 11-13 20Q-4 20 0 6ZM0 9Q10 10 14 2Q4 2 0 9Z" fill={index % 2 ? "#4b8f9a" : "#6ba69f"} stroke={lead} strokeWidth="1.5" />
          <Flower size={size} hue={mirror ? (hue + 2) % 5 : hue} count={count} angle={index * 11} />
        </g>
      ))}
    </g>
  );
}

function CardArt() {
  return (
    <svg className="tarot-art block h-full w-full" viewBox="0 0 320 456" aria-hidden="true">
      <rect width="320" height="456" fill={lead} />
      <g stroke={lead} strokeWidth="1.65" strokeLinejoin="round">
        {mosaic.map(({ points, fill }, index) => <polygon key={index} points={points} fill={fill} />)}
      </g>
      <path d="M55 416V156Q55 86 160 23Q265 86 265 156V416M69 401V158Q69 92 160 38Q251 92 251 158V401" fill="none" stroke={lead} strokeWidth="5.5" />
      <path d="M55 416V156Q55 86 160 23Q265 86 265 156V416M69 401V158Q69 92 160 38Q251 92 251 158V401" fill="none" stroke="#a5758b" strokeWidth="2.1" />
      <path d="M60 410V156Q60 88 160 29Q260 88 260 156V410M55 155H70M61 114L76 122M84 81L97 87M117 50L128 57M160 23V38M203 50L192 57M236 81L223 87M259 114L244 122M265 155H251" fill="none" stroke={lead} strokeWidth="2.15" />
      <path d="M16 98Q37 71 58 98M262 98Q283 71 304 98M15 83 35 72 56 82M264 82 285 72 305 83" fill="none" stroke={lead} strokeWidth="2.2" />
      <path d="M12 110V23L35 9 61 24V66L35 81 12 66M308 110V23L285 9 259 24V66L285 81 308 66" fill="none" stroke="#7b5e8e" strokeWidth="2" />
      <Flower x={35} y={43} size={1.06} hue={4} count={8} ring />
      <Flower x={285} y={43} size={1.06} hue={1} count={8} ring />
      <Pillar x={19} y={121} height={291} />
      <Pillar x={43} y={104} height={306} wide />
      <Pillar x={277} y={104} height={306} wide />
      <Pillar x={301} y={121} height={291} />
      <Halo />
      <Priestess />
      <Vines />
      <Vines mirror />
      <path d="M0 426Q45 403 85 425T161 431Q205 419 234 426T320 425V456H0Z" fill="#211d39" stroke={lead} strokeWidth="3" />
      {footFlowers.map(([x, y, size, hue], index) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0 4Q5 16 7 25M3 13Q-6 7-12 15Q-6 22 3 13ZM4 17Q12 10 19 16Q14 23 4 17Z" fill={index % 2 ? "#4e8c84" : "#69a89b"} stroke={lead} strokeWidth="1.7" />
          <Flower size={size} hue={hue} angle={index * 13} count={index % 3 + 5} />
        </g>
      ))}
      <path d="M0 449Q74 429 159 446Q253 427 320 449" fill="none" stroke="#876884" strokeWidth="1.5" />
      <path d="M6 48V6H46M274 6H314V48M6 410V450H46M274 450H314V410" fill="none" stroke="#c49cba" strokeWidth="1.4" />
    </svg>
  );
}

const starPath = "M0-9Q1-1 9 0Q1 1 0 9Q-1 1-9 0Q-1-1 0-9Z";

const nightDots = (() => {
  const random = randomFrom(419);
  return Array.from({ length: 83 }, () => ({
    x: `${random() * 100}%`,
    y: `${random() * 100}%`,
    size: `${.8 + random() * 1.8}px`,
    time: `${5 + random() * 9}s`,
    delay: `${-random() * 14}s`,
  }));
})();

const foilStars = (() => {
  const random = randomFrom(816);
  return Array.from({ length: 54 }, (_, index) => {
    const x = 5 + random() * 90;
    const y = 4 + random() * 92;
    return {
      x,
      y: y * 1.62,
      size: index % 6 === 0 ? .76 : .2 + random() * .42,
    };
  });
})();

function MoonMark() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="16.35" stroke="currentColor" opacity=".55" />
      <path d="M21.9 8.5a10.4 10.4 0 1 0 4.9 16.2A9.9 9.9 0 0 1 21.9 8.5Z" stroke="currentColor" strokeWidth="1.05" />
      <path d={starPath} transform="translate(24.5 14.5) scale(.55)" fill="currentColor" />
    </svg>
  );
}

function CardBack() {
  return (
    <svg className="back-art" viewBox="0 0 320 518" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="306" height="504" rx="13" stroke="#b6b6d2" opacity=".8" />
      <rect x="13" y="13" width="294" height="492" rx="9" stroke="#747395" />
      <path d="M25 61V25H61M259 25H295V61M25 457V493H61M259 493H295V457" stroke="#d3cbe2" />
      <path d="M160 46 277 259 160 472 43 259Z" stroke="#a8a0c4" opacity=".5" />
      <circle cx="160" cy="259" r="99" stroke="#a8a0c4" />
      <circle cx="160" cy="259" r="89" stroke="#9890b9" strokeDasharray="1 5" />
      <circle cx="160" cy="259" r="76" stroke="#bcb3d1" opacity=".69" />
      <path d="M160 190C166 235 178 252 227 259C178 267 166 283 160 328C153 283 142 267 93 259C142 252 153 235 160 190Z" fill="#cfcce0" fillOpacity=".17" stroke="#eee9f6" strokeWidth="1.5" />
      <path d="M160 214V304M115 259H205M129 228 191 290M191 228 129 290" stroke="#d4c9e3" />
      {foilStars.map(({ x, y, size }, index) => (
        <path key={index} d={starPath} transform={`translate(${x * 3.2} ${y * 3.19}) scale(${size * .66})`} fill={index % 4 === 0 ? "#eeedf7" : "#aaa0c7"} opacity={index % 3 === 0 ? .95 : .5} />
      ))}
      <path d={starPath} transform="translate(160 75) scale(1.05)" fill="#e3d9ea" />
      <path d={starPath} transform="translate(160 443) scale(1.05)" fill="#e3d9ea" />
    </svg>
  );
}

function Foil() {
  return (
    <span className="foil" aria-hidden="true">
      <span className="foil-rainbow" />
      <span className="foil-iridescence" />
      <span className="foil-grain" />
      <span className="foil-lines" />
      <span className="foil-sheen" />
      <span className="foil-glare" />
      <svg className="foil-sparks" viewBox="0 0 100 162" preserveAspectRatio="none">
        {foilStars.map(({ x, y, size }, index) => (
          <path key={index} d={starPath} transform={`translate(${x} ${y}) scale(${size * .42})`} fill={index % 3 ? "#f8eaff" : "#bdf4ff"} />
        ))}
      </svg>
    </span>
  );
}

const majorCards = [
  ["The Fool", "ผู้เดินทาง", "เริ่มเลย เดี๋ยวทางค่อยมา", "ก้าวเล็ก ๆ ที่ยังไม่รู้ปลายทางอาจพาไปไกลกว่าที่คิด ลองเริ่มจากสิ่งที่ยอมพลาดได้"],
  ["The Magician", "นักมายากล", "ของพร้อมแล้ว ลงมือเถอะ", "ลองใช้ทักษะและเครื่องมือที่มีอยู่กับงานหนึ่งชิ้นวันนี้ คุณอาจพร้อมกว่าที่รู้ตัว"],
  ["The High Priestess", "นักบวชหญิง", "รออีกนิด ใจมีเฉลย", "เว้นช่วงเงียบ ๆ ก่อนตอบ เผื่อเสียงแรกที่ได้ยินเป็นความกังวล ส่วนเสียงเบากว่าคือสิ่งที่คุณรู้จริง"],
  ["The Empress", "จักรพรรดินี", "สิ่งที่ดูแลกำลังงอกงาม", "เลี้ยงความคิดหรือความสัมพันธ์ให้โตด้วยเวลาและความใส่ใจ เริ่มด้วยการให้ตัวเองได้พักอย่างเต็มที่"],
  ["The Emperor", "จักรพรรดิ", "วางขอบเขต แล้วใจโล่ง", "กำหนดว่าใครรับผิดชอบอะไรและงานจบที่ตรงไหน โครงสร้างที่ชัดช่วยให้ทุกคนหายใจสะดวกขึ้น"],
  ["The Hierophant", "มหาปุโรหิต", "บทเรียนเก่ามีมุมใหม่", "ขอคำแนะนำจากคนที่เคยผ่านเรื่องคล้ายกัน แล้วเลือกนำเฉพาะส่วนที่เหมาะกับคุณไปใช้"],
  ["The Lovers", "คู่รัก", "เลือกด้วยใจที่ซื่อตรง", "ถามว่าทางเลือกไหนสอดคล้องกับคุณค่าที่อยากรักษา แล้วพูดความต้องการออกมาตรง ๆ"],
  ["The Chariot", "ราชรถ", "จับทิศให้มั่น แล้วไป", "พลังที่ดึงคนละทางอาจขับเคลื่อนสิ่งเดียวกันได้เมื่อมีเป้าหมายร่วมกัน เลือกปลายทางหนึ่งก่อน"],
  ["Strength", "พลังใจ", "ใจเย็นก็ทรงพลัง", "คุยกับตัวเองแบบที่คุยกับเพื่อนคนสำคัญ ความอ่อนโยนอาจพาคุณผ่านเรื่องที่ฝืนมานาน"],
  ["The Hermit", "ฤๅษี", "หลบเสียงดัง หาแสงตัวเอง", "กันเวลาสั้น ๆ ไว้สำหรับอยู่คนเดียว ลองจดคำตอบที่นึกได้ก่อนอ่านความเห็นของคนอื่น"],
  ["Wheel of Fortune", "วงล้อแห่งโชคชะตา", "จังหวะเปลี่ยน เตรียมขยับ", "แผนรอบนี้อาจเปลี่ยนตามสิ่งที่คุณควบคุมไม่ได้ เก็บแผนสำรองเล็ก ๆ ไว้ให้ตัวเองมีทางเลือก"],
  ["Justice", "ความยุติธรรม", "ชั่งข้อมูลก่อนชั่งใจ", "แยกสิ่งที่เกิดขึ้นจริงออกจากสิ่งที่คาดเดา แล้วตัดสินด้วยเกณฑ์เดียวกันสำหรับทุกคน"],
  ["The Hanged Man", "ชายที่ห้อยหัว", "กลับมุม แล้วค่อยตอบ", "ลองพักการแก้ปัญหาไว้ก่อน แล้วดูว่าคนที่อยู่ฝั่งตรงข้ามมองเห็นอะไรที่คุณยังไม่เห็น"],
  ["Death", "การเปลี่ยนผ่าน", "ปิดบทเก่า ให้บทใหม่เริ่ม", "บางอย่างทำหน้าที่ของมันครบแล้ว การบอกลาอย่างมีเจตนาช่วยให้คุณเหลือแรงสำหรับสิ่งที่อยากเริ่ม"],
  ["Temperance", "ความพอดี", "ผสมทีละนิด เดี๋ยวลงตัว", "ปรับเพียงอย่างเดียวต่อครั้งเพื่อให้รู้ว่าอะไรได้ผล ความสม่ำเสมอมักช่วยได้มากกว่าการเปลี่ยนทุกอย่างพร้อมกัน"],
  ["The Devil", "พันธนาการ", "เห็นโซ่แล้ว ค่อยปลด", "สังเกตสิ่งที่คุณกลับไปหาโดยอัตโนมัติ แม้ใจอยากหยุด ลองตัดวงจรที่จุดเล็กที่สุดก่อน"],
  ["The Tower", "หอคอย", "ของไม่มั่นคงกำลังเผยรอย", "เมื่อแผนเดิมสั่นคลอน จัดการสิ่งที่จำเป็นเฉพาะหน้าก่อน แล้วค่อยดูว่าส่วนไหนสมควรสร้างขึ้นใหม่"],
  ["The Star", "ดวงดาว", "มีแสงเล็ก ๆ ให้ไปต่อ", "ให้พื้นที่กับสิ่งที่ช่วยเยียวยาคุณ แม้จะดูเล็กน้อย จดไว้สักเรื่องที่ทำให้วันนี้เบากว่าเมื่อวาน"],
  ["The Moon", "ดวงจันทร์", "หมอกยังอยู่ ค่อย ๆ ดู", "ความรู้สึกบอกได้ว่าควรชะลอ ส่วนข้อเท็จจริงจะช่วยบอกว่าควรไปทางไหน ลองตรวจอีกหนึ่งจุดก่อนสรุป"],
  ["The Sun", "ดวงอาทิตย์", "ยอมให้ตัวเองฉายแสง", "แบ่งปันความสำเร็จเล็ก ๆ หรือใช้เวลากับคนที่ทำให้คุณเป็นตัวเองได้เต็มที่"],
  ["Judgement", "เสียงเรียก", "ถึงเวลาตอบเสียงเรียก", "มองบทเรียนเดิมด้วยสายตาปัจจุบัน คุณอาจพร้อมตอบคำถามที่เคยเลี่ยงมานานแล้ว"],
  ["The World", "โลก", "ปิดวงให้สวย แล้วพัก", "รับรู้ว่าสิ่งที่ทำมาถึงจุดจบที่สมบูรณ์ เก็บบทเรียนไว้และให้เวลาตัวเองได้ฉลองก่อนเริ่มรอบใหม่"],
];

const minorSuits = [
  {
    name: "Wands", thai: "ไม้เท้า", element: "ไฟ",
    panes: ["#23132b", "#602546", "#b74c54", "#ef9961", "#ffe0ae"],
    readings: [
      ["ประกายมาแล้ว ลองจุดดู", "ไอเดียเล็ก ๆ มีแรงส่งมากกว่าที่คิด ลองทำต้นแบบก่อนตัดสินว่าคุ้มแรงไหม"],
      ["วางหมุด ก่อนออกเดิน", "มองให้ไกลกว่างานตรงหน้า แล้วเลือกเป้าหมายหนึ่งที่อยากพาไอเดียนี้ไปถึง"],
      ["ส่งงานออกไป แล้วดูผล", "คุณเริ่มขยับแล้ว ให้เวลาสิ่งที่ส่งออกไปได้ผลตอบกลับก่อนขยายแผน"],
      ["จัดที่ให้ความยินดี", "ชวนคนที่ร่วมทางรับรู้ว่ามาถึงหลักหมายหนึ่งแล้ว แม้การฉลองจะมีแค่ของว่างกับบทสนทนา"],
      ["เห็นต่างได้ ลองฟัง", "ความเห็นที่ชนกันอาจให้คำตอบที่ดีขึ้น ถามว่าแต่ละคนกำลังปกป้องอะไร"],
      ["รับคำชมได้เต็ม ๆ", "ยอมรับความสำเร็จและแบ่งเครดิตให้คนที่มีส่วนร่วม คุณมีสิทธิ์ภูมิใจกับงานนี้"],
      ["ยืนหยัดในเรื่องที่สำคัญ", "เลือกปกป้องจุดยืนที่มีเหตุผล แล้วปล่อยให้เรื่องเล็กผ่านไปบ้าง"],
      ["จังหวะมา อย่ารอคิว", "ข่าวหรือโอกาสอาจมาถึงพร้อมกัน จัดลำดับแล้วตอบเรื่องที่มีเวลาจำกัดก่อน"],
      ["พักแขนบ้าง ยังไหวอยู่", "ความอึดช่วยพาคุณมาถึงตรงนี้ ลองลดภาระหนึ่งอย่างเพื่อเก็บแรงสำหรับช่วงสุดท้าย"],
      ["วางสักชิ้น ก็เบามาก", "ลิสต์ภาระที่แบกอยู่ แล้วมอบหมายหรือเลื่อนสิ่งที่ไม่จำเป็นออกไปหนึ่งเรื่อง"],
      ["อยากรู้ ก็ลองดู", "ความตื่นเต้นเป็นจุดเริ่มที่ดี เลือกทดลองแบบเล็กและสนุกก่อนกำหนดเป้าหมายจริงจัง"],
      ["พุ่งได้ แต่อ่านทางด้วย", "ใช้แรงส่งกับเรื่องที่ต้องการความกล้า แล้วตั้งจุดแวะทบทวนก่อนรับปากเรื่องใหญ่"],
      ["ให้ไฟของคุณอุ่นคนอื่น", "เผยความมั่นใจพร้อมเปิดพื้นที่ให้คนอื่นได้แสดงฝีมือ พลังของทีมอาจโตขึ้นพร้อมกัน"],
      ["ชวนคนไปด้วยวิสัยทัศน์", "ทำให้เป้าหมายชัดพอที่คนอื่นอยากร่วมทาง แล้วมอบอิสระให้แต่ละคนรับผิดชอบส่วนของตัวเอง"],
    ],
  },
  {
    name: "Cups", thai: "ถ้วย", element: "น้ำ",
    panes: ["#151938", "#29466c", "#438ca4", "#84caca", "#d9f6df"],
    readings: [
      ["ให้ใจได้ไหลบ้าง", "เปิดพื้นที่ให้ความรู้สึกใหม่ ลองส่งข้อความหรือทำสิ่งเล็ก ๆ ที่คุณเก็บไว้ในใจมานาน"],
      ["ยื่นมือ แล้วฟังกัน", "ความไว้ใจเติบโตได้จากการคุยที่จริงใจ ชวนอีกฝ่ายบอกความต้องการของตัวเองด้วย"],
      ["มีคนพร้อมยินดีด้วย", "นัดเจอเพื่อนหรือส่งข่าวดีให้คนที่คอยหนุนคุณ การแบ่งปันอาจทำให้ความสุขอยู่ได้นานขึ้น"],
      ["เงยหน้าดูถ้วยใบใหม่", "ถ้าทุกทางดูไม่น่าสนใจ ลองถามตัวเองว่าต้องพักก่อน หรือมีข้อเสนอที่ยังอ่านไม่ครบ"],
      ["เสียใจได้ ยังมีที่พักใจ", "ยอมรับสิ่งที่เสียไป แล้วหันไปหาคนหรือกิจวัตรที่ยังช่วยพยุงคุณได้"],
      ["ความทรงจำพาใจอุ่น", "ลองหยิบสิ่งที่เคยชอบกลับมาทำ หรือทักคนที่ทำให้คุณนึกถึงตัวเองในวันที่สบายใจ"],
      ["ฝันได้ เลือกทีละอย่าง", "เขียนตัวเลือกลงมาแล้วเทียบกับเวลาหรือแรงที่มีจริง จะเห็นว่าอะไรเหมาะจะลองก่อน"],
      ["ถึงเวลาเดินหาใจตัวเอง", "สังเกตสิ่งที่เคยเติมเต็มแต่ตอนนี้เหลือแค่ความเคยชิน คุณมีสิทธิ์เดินไปค้นหาสิ่งใหม่"],
      ["ขอแล้ว รับไว้ด้วย", "ให้เวลาซึมซับสิ่งที่สมหวังและถามว่าคุณพอใจกับมันตรงไหน จะได้จำสิ่งที่สำคัญจริง ๆ"],
      ["ความสุขอยู่ในวงสนทนา", "ลงแรงกับความสัมพันธ์ที่ให้ความรู้สึกเป็นบ้าน ด้วยการฟังหรือใช้เวลาร่วมกันโดยไม่เร่ง"],
      ["ความรู้สึกมีข่าวมาฝาก", "บันทึกความฝัน ไอเดีย หรือความรู้สึกที่โผล่มาแบบไม่ทันตั้งตัว มันอาจช่วยให้เข้าใจตัวเองขึ้น"],
      ["บอกความรู้สึก พร้อมลงมือ", "ให้การกระทำเล็ก ๆ ตามทันคำพูด ความตั้งใจดีจะชัดขึ้นเมื่ออีกฝ่ายสัมผัสได้จริง"],
      ["โอบใจไว้ แล้วขีดเส้น", "รับฟังด้วยความเข้าใจพร้อมรักษาเวลาพักของตัวเอง ความเห็นใจมีขอบเขตที่เคารพได้"],
      ["ใจสงบ คุยเรื่องยากได้", "รอให้อารมณ์ลงตัวก่อนตอบ แล้วอธิบายเรื่องยากด้วยภาษาที่รักษาน้ำใจทั้งสองฝ่าย"],
    ],
  },
  {
    name: "Swords", thai: "ดาบ", element: "ลม",
    panes: ["#16182f", "#3f386b", "#6969ac", "#a5a9de", "#e3e7fa"],
    readings: [
      ["ตัดเรื่องมัวให้ชัด", "ตั้งชื่อปัญหาให้ชัดในประโยคเดียว แล้วบอกความจริงที่จำเป็นด้วยถ้อยคำสุภาพ"],
      ["พักก่อน แล้วเลือก", "ถ้ายังตัดสินใจไม่ได้ ให้ระบุข้อมูลที่ขาดหนึ่งอย่างและกำหนดเวลาที่จะกลับมาชั่งใจ"],
      ["ความจริงเจ็บ แต่เยียวยาได้", "ให้พื้นที่กับความเจ็บปวดและคุยกับคนที่รับฟังได้ดี คุณค่อย ๆ ไปต่อได้"],
      ["พักให้จริง สมองจะขอบคุณ", "กันช่วงที่ไม่มีงานหรือหน้าจอมารบกวนสักพัก ให้สมองมีโอกาสฟื้นก่อนคิดต่อ"],
      ["มีชัยแล้ว ใจแพ้ไหม", "ทบทวนว่าการเอาชนะครั้งนี้แลกกับอะไร หากความสัมพันธ์มีค่า ลองหาทางคุยใหม่"],
      ["ข้ามน้ำไปทีละช่วง", "แบ่งการเปลี่ยนผ่านเป็นขั้นสั้น ๆ แล้วรับความช่วยเหลือในจุดที่หนักเกินจะไปคนเดียว"],
      ["เดินฉลาด พร้อมซื่อตรง", "วางแผนให้รอบคอบและบอกส่วนที่คนอื่นจำเป็นต้องรู้ ความลับที่มากเกินไปอาจย้อนมาสร้างภาระ"],
      ["มองหาช่องที่ยังเปิด", "เขียนข้อจำกัดที่ตรวจสอบได้ แล้วเลือกหนึ่งการกระทำเล็ก ๆ ที่ยังอยู่ในอำนาจของคุณ"],
      ["เรื่องกังวล จดไว้ก่อนนอน", "ย้ายความคิดวน ๆ จากหัวลงกระดาษ แล้วกำหนดเรื่องเดียวที่คุณจัดการได้ในตอนเช้า"],
      ["วันนี้พอแล้ว พรุ่งนี้ค่อยเริ่ม", "ยอมรับว่าบทหนึ่งจบลงแล้ว ให้เวลาตัวเองได้ฟื้น ก่อนตัดสินใจว่าจะพาอะไรติดตัวไป"],
      ["ถามให้ดี ก่อนส่งข่าว", "ใช้ความอยากรู้เพื่อตรวจสอบแหล่งที่มา ถามอย่างตรงไปตรงมาแทนการคาดเดาเจตนา"],
      ["เร็วได้ เว้นที่ให้ฟัง", "แรงตัดสินใจช่วยให้เรื่องเดินหน้า ลองฟังอีกฝ่ายให้จบก่อนลงมือเรื่องที่แก้กลับยาก"],
      ["พูดตรง โดยยังอ่อนโยน", "ระบุขอบเขตและเหตุผลด้วยภาษาที่ตรงประเด็น พร้อมรับฟังข้อเท็จจริงใหม่ถ้ามี"],
      ["ยึดเหตุผล แล้วตัดสิน", "ตั้งเกณฑ์ให้ชัดก่อนเลือกและใช้กับทุกทางอย่างสม่ำเสมอ จะอธิบายคำตอบได้ง่ายขึ้น"],
    ],
  },
  {
    name: "Pentacles", thai: "เหรียญ", element: "ดิน",
    panes: ["#172533", "#285c58", "#54856e", "#a7ae6e", "#f9e5a7"],
    readings: [
      ["เมล็ดเล็กมีที่ให้โต", "สำรวจโอกาสที่จับต้องได้ เช่น งานเล็ก งบที่จัดใหม่ได้ หรือทักษะที่เริ่มฝึกวันนี้"],
      ["สลับจังหวะให้พอดี", "จัดสมดุลงานหรือรายจ่ายสองด้านด้วยรายการสั้น ๆ แล้วตัดเรื่องที่รอได้ออกชั่วคราว"],
      ["รวมฝีมือ งานจะงาม", "ชวนคนที่ถนัดคนละอย่างมาร่วมงาน แล้วคุยเรื่องมาตรฐานกับบทบาทให้ตรงกันตั้งแต่ต้น"],
      ["เก็บให้พอดี มือจะว่าง", "ทบทวนว่ากำลังเก็บเงินหรือเวลาไว้เพื่ออะไร แล้วจัดส่วนที่ยืดหยุ่นได้ออกมาบ้าง"],
      ["ขอแรงได้ ทางยังเปิด", "หาคนหรือแหล่งช่วยเหลือที่เข้าถึงได้ แล้วบอกให้ชัดว่าคุณต้องการความช่วยเหลือแบบไหน"],
      ["แบ่งด้วยใจและขอบเขต", "ให้หรือรับความช่วยเหลือด้วยข้อตกลงที่สบายใจทั้งสองฝ่าย ดูว่าทรัพยากรไปถึงคนที่ต้องการจริงหรือยัง"],
      ["รอผล แล้วดูต้นทุน", "กลับมาดูว่าสิ่งที่ลงทุนลงแรงไปเติบโตตามเป้าหมายไหม แล้วปรับวิธีดูแลก่อนเร่งเก็บผล"],
      ["ทำซ้ำอย่างตั้งใจ", "เลือกทักษะย่อยหนึ่งอย่างมาฝึกให้คล่อง ข้อเสนอแนะทันทีช่วยให้การฝึกแต่ละครั้งต่างจากเดิม"],
      ["เก็บเกี่ยวได้ ใช้เวลาชื่นชม", "ใช้เวลาสบาย ๆ กับสิ่งที่ค่อย ๆ สร้างขึ้น ความภูมิใจช่วยบอกได้ว่าคุณอยากเก็บอะไรต่อ"],
      ["สร้างสิ่งที่คนอื่นใช้ต่อได้", "ลองจัดความรู้ งบ หรือทรัพยากรให้คนรอบข้างใช้งานได้ ภาระจะได้ไม่อยู่กับคนเดียว"],
      ["เริ่มเรียนด้วยของจริง", "ตั้งเป้าหมายเล็กที่วัดได้ แล้วหาโจทย์จริงมาทดสอบความรู้ใหม่ภายในสัปดาห์นี้"],
      ["ช้าแต่ถึง มีแผนรองรับ", "ทำกิจวัตรที่พาไปข้างหน้าทีละนิด จดความคืบหน้าไว้แม้วันที่ดูเหมือนไม่มีอะไรเปลี่ยน"],
      ["ดูแลบ้าน แล้วดูแลใจ", "จัดสิ่งจำเป็นให้รอบตัวอยู่สบายขึ้น และนับเวลาพักของตัวเองเป็นส่วนหนึ่งของแผนดูแล"],
      ["สร้างฐานที่พึ่งได้", "ใช้ทรัพยากรที่มีอย่างมีแผน ให้คุณภาพและความสม่ำเสมอนำการตัดสินใจระยะยาว"],
    ],
  },
];

const roman = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const rankThai = ["หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ", "มหาดเล็ก", "อัศวิน", "ราชินี", "ราชา"];

const deck = [
  ...majorCards.map(([name, thai, line, meaning], id) => ({
    id, name, thai, line, meaning, group: 0, rank: id, number: roman[id],
  })),
  ...minorSuits.flatMap((suit, group) => suit.readings.map(([line, meaning], rank) => ({
    id: 22 + group * 14 + rank,
    name: ranks[rank] + " of " + suit.name,
    thai: rankThai[rank] + (rank > 9 ? "แห่ง" : "") + suit.thai,
    line, meaning, group: group + 1, rank, number: "",
  }))),
];

const spreads = [
  {
    key: "single", name: "ไพ่ใบเดียว", description: "เลือกเรื่องหนึ่งในใจ แล้วแตะไพ่เพื่อฟังคำแนะนำ", slots: [
      ["คำแนะนำ", "สิ่งที่ควรใส่ใจในตอนนี้"],
    ],
  },
  {
    key: "timeline", name: "อดีต–ปัจจุบัน–อนาคต", description: "มองเรื่องเดียวกันผ่านสามช่วงเวลา", slots: [
      ["อดีต", "สิ่งที่พาคุณมาถึงตรงนี้"], ["ปัจจุบัน", "พลังและเงื่อนไขที่กำลังส่งผล"], ["อนาคต", "ทิศทางที่อาจเกิดจากทางเลือกตอนนี้"],
    ],
  },
  {
    key: "choices", name: "เปรียบเทียบสองทางเลือก", description: "ตั้งทางเลือก A กับ B ไว้ในใจ แล้วสำรวจผลของแต่ละทาง", slots: [
      ["ใจกลางเรื่อง", "สิ่งสำคัญที่อยู่ร่วมกันทั้งสองทาง"],
      ["ข้อดีของทาง A", "โอกาสหรือจุดแข็งของทางเลือกแรก"],
      ["สิ่งที่ต้องระวังในทาง A", "ข้อแลกเปลี่ยนที่ควรเผื่อใจ"],
      ["ข้อดีของทาง B", "โอกาสหรือจุดแข็งของทางเลือกที่สอง"],
      ["สิ่งที่ต้องระวังในทาง B", "ข้อแลกเปลี่ยนที่ควรเผื่อใจ"],
    ],
  },
  {
    key: "celtic", name: "กางเขนเซลติก", description: "สำรวจต้นเหตุ สิ่งรอบตัว และแนวโน้มของเรื่องเดียวผ่านไพ่สิบใบ", slots: [
      ["สถานการณ์", "สิ่งที่กำลังเกิดขึ้นในใจกลางเรื่อง"],
      ["อุปสรรค", "แรงที่ขวางหรือท้าทายสถานการณ์"],
      ["เป้าหมาย", "ผลที่คุณกำลังพยายามไปให้ถึง"],
      ["รากของเรื่อง", "แรงขับหรือข้อเท็จจริงที่อยู่เบื้องหลัง"],
      ["อดีตใกล้", "อิทธิพลจากเหตุการณ์ที่เพิ่งผ่านไป"],
      ["อนาคตใกล้", "สิ่งที่กำลังเริ่มเข้ามามีบทบาท"],
      ["ตัวคุณ", "วิธีที่คุณกำลังวางตัวต่อเรื่องนี้"],
      ["สภาพแวดล้อม", "คนหรือเงื่อนไขภายนอกที่มีผล"],
      ["ความหวังและความกลัว", "สิ่งที่คุณอยากให้เกิดหรือกังวลว่าจะเจอ"],
      ["แนวโน้ม", "ทิศทางหากสถานการณ์ยังเดินต่อแบบเดิม"],
    ],
  },
];

function dealCards(count = 1, exclude = -1) {
  const available = deck.filter((card) => card.id !== exclude);
  for (let index = 0; index < count; index++) {
    const next = index + Math.floor(Math.random() * (available.length - index));
    [available[index], available[next]] = [available[next], available[index]];
  }
  return available.slice(0, count);
}


function SuitGlyph({ group = 1, color = "#f5c686", light = "#ffecc7" }) {
  if (group === 1) return (
    <g>
      <Glass d="M-8 38-5-10-8-25 0-39 8-25 5-10 8 38Z" fill={color} width={2.1} />
      <Glass d="M0-36 4-24 1-17 4 34H0Z" fill={light} width={1} />
      <Glass d="M-1-8Q-12-8-15-20Q-4-19-1-8ZM2 4Q14 5 17-8Q5-7 2 4Z" fill="#85a878" width={1.8} />
      <Glass d="M-5 16 5 10 6 16-5 22ZM-6 26 7 20 7 25-6 32Z" fill="#efc391" width={.95} />
      <path d="M-12-16-4-10M13-4 5 1M0-32 1-24" fill="none" stroke={light} strokeWidth=".9" opacity=".7" />
    </g>
  );
  if (group === 2) return (
    <g>
      <Glass d="M-13 28-7 21-4 9Q-18 3-19-16L-17-26H17L19-16Q18 3 4 9L7 21 13 28Z" fill={color} width={2.1} />
      <Glass d="M-18-17Q0-10 18-17L16-9Q0-1-16-9Z" fill={light} width={1.4} />
      <Glass d="M-5-4 0-8 5-4 0 2Z" fill="#ffdf94" width={1.1} />
      <Glass d="M-16-24Q0-20 16-24L15-20Q0-16-15-20Z" fill="#fff3c1" width={1.1} />
      <Glass d="M-3 10 1 11 3 22 10 26H-8L-4 22Z" fill={light} width={1.1} />
      <path d="M-12-15Q-10-8-7-5M9-14Q9-8 6-6" fill="none" stroke="#98697b" strokeWidth="1.25" strokeLinecap="round" />
    </g>
  );
  if (group === 3) return (
    <g>
      <Glass d="M0-39 7-25 4 13H-4L-7-25Z" fill={light} width={2.1} />
      <Glass d="M-12 13Q-5 17 0 13Q5 17 12 13L10 22Q5 20 3 23V31L6 35 0 40-6 35-3 31V23Q-5 20-10 22Z" fill={color} width={2.1} />
      <Glass d="M0-37 5-24 2 11H0Z" fill="#b1a7bd" width={1} />
      <path d="M0-33V12" stroke={lead} strokeWidth="1.1" />
      <Glass d="M-4 16 0 13 4 16 0 20Z" fill="#f5d393" width={.85} />
      <path d="M-2 25l4 3m-4 1 4 3" fill="none" stroke="#e6c2a2" strokeWidth=".9" />
    </g>
  );
  return (
    <g>
      <circle r="23" fill={color} stroke={lead} strokeWidth="2.2" />
      <circle r="18.6" fill="#717754" stroke={lead} strokeWidth="1.2" />
      <Glass d="M0-17 4-5 17-5 7 3 11 15 0 8-11 15-7 3-17-5-4-5Z" fill={light} width={1.5} />
      <path d="M0-17 0 8M-17-5 7 3M17-5-7 3" stroke="#8e7548" strokeWidth=".8" />
      <circle r="20.8" fill="none" stroke={light} strokeWidth="1.05" strokeDasharray="1.8 3.35" opacity=".84" />
      <circle r="2.8" fill="#f4cf8b" stroke={lead} strokeWidth="1.05" />
    </g>
  );
}

function MountedKnight({ group = 1, tint = minorSuits[0].panes }) {
  const mounts = [
    ["#bd765d", "#edb991", "#8d504c"],
    ["#b0bfd0", "#e7e9e8", "#697a9a"],
    ["#a29ec1", "#d2c9e4", "#676588"],
    ["#c2a078", "#eed2a4", "#86694f"],
  ];
  const [coat, blaze, mane] = mounts[group - 1];

  return (
    <g transform="translate(160 216)" data-court-art="mounted-knight">
      {/* Plume and cloak form one clear outline behind the armor. */}
      <Glass d="M14-80Q35-111 62-112Q89-113 104-93Q88-100 69-95Q87-93 94-82Q66-87 50-77L34-69Z"
        fill={tint[3]} width={4.4} />
      <Glass d="M26-83Q45-109 66-105Q82-104 89-98Q61-103 40-79Z"
        fill={tint[4]} width={2.5} />
      <Glass d="M37-23Q63-30 75-8Q79 15 103 25Q90 35 102 74L84 94 41 78 29 30Z"
        fill={tint[3]} width={4.7} />
      <Glass d="M66-12Q70 17 89 31Q79 42 92 72L81 82 64 61 51 7Z"
        fill={tint[2]} width={2.6} />

      {/* Broad chest and shoulder plates keep their contrast at thumbnail size. */}
      <Glass d="M13-32L47-34 55-16Q68-9 70 10L63 41 47 77 22 87-8 73-26 44-25 4Q-18-14-1-17Z"
        fill="#98a8c5" width={4.7} />
      <Glass d="M12-15Q32-24 50-16L57-3 43 29 27 57 6 49-5 13Z"
        fill="#dce3ed" width={3.2} />
      <Glass d="M13-29 29-19 48-25 48-15 34-8 15-16Z"
        fill="#e9e6ef" width={3} />

      {/* The horse has a long muzzle, upright ears, and a dark flowing mane. */}
      <Glass d="M-100 18Q-95 6-84-1L-76-14-70-29-72-50-56-37-47-49-42-25Q-25-19-17-3Q-7 14-7 34Q-7 64 8 84L-11 99-56 98Q-69 74-65 43L-59 12-76 27Q-87 34-97 29Q-103 25-100 18Z"
        fill={coat} width={4.9} />
      <Glass d="M-48-27Q-25-22-17-3Q-7 12-7 34Q-7 63 8 84L-11 99-22 83Q-29 63-29 40Q-27 10-39-4L-49-14Z"
        fill={mane} width={3.3} />
      <Glass d="M-69-28-68-42-57-31-54-23Q-67-9-74 10L-86 25Q-95 26-99 22L-92 13-83 0-78-11Z"
        fill={blaze} width={2.5} />
      <Glass d="M-61 17Q-39 30-35 55L-31 83-19 95-55 97Q-67 75-64 44Z"
        fill={blaze} width={2.8} />
      <path d="M-70-12Q-64-17-58-12Q-64-8-68-9ZM-94 18Q-89 15-86 18Q-90 22-94 18Z" fill={lead} />
      <path d="M-54-26Q-45-6-61 11L-75 24M-89 10Q-83 21-76 24" fill="none" stroke="#443043" strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="-76" cy="24" r="3.7" fill="#f3ce90" stroke={lead} strokeWidth="2.1" />
      <path d="M-74 26Q-50 41-25 20" fill="none" stroke={lead} strokeWidth="5" strokeLinecap="round" />
      <path d="M-74 26Q-50 41-25 20" fill="none" stroke="#d8ab77" strokeWidth="1.6" strokeLinecap="round" />

      <Glass d="M-6-17Q8-23 19-12Q26-2 17 12L6 19-13 14-20 5Z"
        fill="#e6e9f2" width={3.8} />
      <Glass d="M-13 10 7 16 3 29-17 36-30 27-28 17Z"
        fill="#aebbd2" width={3.7} />
      <Glass d="M-29 15-20 18-18 25-25 30-34 25-34 19Z"
        fill="#efeaf1" width={2.7} />

      {/* A dark visor slit separates the helmet from the horse and plume. */}
      <Glass d="M-12-46Q-10-72 12-83Q31-92 50-79Q67-67 65-47L61-30 49-18 22-17 4-26-10-31-17-40Z"
        fill="#a6b5cf" width={5} />
      <Glass d="M-8-54Q1-75 18-79Q36-85 51-71L56-57 32-56 15-50Z"
        fill="#f0edf3" width={3.1} />
      <Glass d="M-10-46-3-55 30-55 46-49 40-40 16-37-14-40Z"
        fill="#2b233a" width={2.8} />
      <path d="M-7-46 29-48 35-46" fill="none" stroke="#e9e5f4" strokeWidth="2.3" strokeLinecap="round" />
      <Glass d="M-14-39 9-38 31-42 37-33 25-24 6-26-8-31Z"
        fill="#c5cde2" width={2.8} />
      <Glass d="M38-53 62-57 62-36 53-25 35-29 42-43Z"
        fill="#7c89aa" width={2.8} />
      <circle cx="48" cy="-42" r="4.2" fill="#ebdbbd" stroke={lead} strokeWidth="2.1" />
      <path d="M-3-34 1-32M7-32 11-30M17-33 21-31" stroke={lead} strokeWidth="2.5" strokeLinecap="round" />

      <Glass d="M19 24Q54 13 89 24L84 62Q76 88 54 101Q31 89 24 63Z"
        fill={tint[4]} width={4.7} />
      <Glass d="M29 31Q54 23 79 31L75 60Q70 79 54 89Q37 78 33 60Z"
        fill={tint[1]} width={2.8} />
      <path d="M24 23Q54 15 83 23M25 58Q31 79 46 91M82 31 76 54M72 77 66 86" fill="none" stroke="#f2d8a7" strokeWidth="1.15" opacity=".9" />
      <path d="M-12-55Q1-74 20-78m-22 65q9-6 17-2m-23 21 11 8m-73 30 20-3" fill="none" stroke="#f1d9bc" strokeWidth="1.12" opacity=".82" />
      <Glass d="M54 26Q68 27 79 31L75 60Q70 79 54 89Z"
        fill={tint[2]} width={1.7} />
      <g transform="translate(54 55) scale(.57)">
        <SuitGlyph group={group} color={tint[3]} light={tint[4]} />
      </g>
    </g>
  );
}

const scenery = {
  dawn: ["#26243e", "#62476e", "#9d6b89", "#e2a68c", "#ffe1ab"],
  moon: ["#151b39", "#29365d", "#454d8d", "#7c88b7", "#d6d5ef"],
  grove: ["#172b37", "#255358", "#52807b", "#9db395", "#f0dfa9"],
  ember: ["#301d36", "#642d48", "#9e4a5d", "#dc8663", "#ffe0a8"],
  sea: ["#14213c", "#285272", "#447f9d", "#89bbc4", "#e0eee5"],
  frost: ["#22213c", "#40456c", "#667bab", "#a7b0d1", "#e4ebed"],
  chapel: ["#25213d", "#4f4169", "#7462a0", "#b299c7", "#eee0ea"],
  gold: ["#3b2a35", "#70504b", "#aa7455", "#dba16f", "#ffe5a0"],
  storm: ["#1c203c", "#333254", "#534873", "#9683a9", "#ece2eb"],
  rose: ["#342240", "#663b63", "#9e577a", "#da93a6", "#ffe0c4"],
};

const clothes = {
  coral: ["#aa374c", "#d86060", "#f8ac86"],
  indigo: ["#303661", "#555eaa", "#a5b5e2"],
  teal: ["#28536a", "#458a91", "#a1d5bd"],
  gold: ["#a75545", "#d58c48", "#f6c981"],
  plum: ["#62305e", "#9c5692", "#dbabd9"],
  ivory: ["#8a718e", "#c1b2d0", "#f2dfdf"],
  moss: ["#40594f", "#678c61", "#c8d19c"],
  dusk: ["#302b51", "#584871", "#a08cba"],
};

const complexions = [
  ["#edc2aa", "#c88886", "#6e465b"],
  ["#c38a71", "#996058", "#382239"],
  ["#a67264", "#7c4a4f", "#35223b"],
  ["#edc9b8", "#b98990", "#c3b5d2"],
];

const poses = {
  still: { arms: [[-27, -77, -30, -57], [27, -78, 29, -57]], feet: [-15, 16], lean: 0, drop: 0 },
  walk: { arms: [[-21, -77, -36, -65], [23, -76, 37, -88]], feet: [-32, 26], lean: 7, drop: 0 },
  offer: { arms: [[-25, -76, -20, -59], [35, -85, 57, -93]], feet: [-13, 19], lean: 3, drop: 0 },
  raise: { arms: [[-30, -116, -46, -140], [34, -106, 51, -127]], feet: [-21, 20], lean: 0, drop: 0 },
  toast: { arms: [[-27, -109, -44, -128], [23, -119, 5, -139]], feet: [-21, 20], lean: 0, drop: 0 },
  point: { arms: [[-22, -73, -21, -56], [36, -105, 62, -123]], feet: [-12, 18], lean: 0, drop: 0 },
  hold: { arms: [[-28, -83, -3, -73], [28, -84, 6, -76]], feet: [-12, 13], lean: 0, drop: 0 },
  seated: { arms: [[-30, -75, -23, -58], [30, -74, 23, -58]], feet: [-20, 28], lean: 0, drop: 28 },
  rest: { arms: [[-29, -78, -15, -63], [28, -101, 11, -117]], feet: [-16, 25], lean: 7, drop: 32 },
  kneel: { arms: [[-27, -84, -8, -70], [31, -86, 46, -81]], feet: [-28, 30], lean: 10, drop: 28 },
  bend: { arms: [[-21, -81, 2, -48], [37, -79, 55, -56]], feet: [-18, 27], lean: 26, drop: 19 },
  dance: { arms: [[-35, -94, -55, -97], [29, -117, 41, -143]], feet: [-29, 15], lean: -4, drop: 2 },
  play: { arms: [[-27, -84, 24, -113], [30, -99, 50, -112]], feet: [-14, 21], lean: 0, drop: 2 },
  guard: { arms: [[-27, -87, -45, -108], [30, -82, 10, -67]], feet: [-26, 21], lean: -5, drop: 3 },
  lift: { arms: [[-32, -106, -29, -124], [32, -107, 31, -124]], feet: [-18, 20], lean: 0, drop: 4 },
  pray: { arms: [[-25, -80, -3, -105], [26, -80, 3, -105]], feet: [-12, 13], lean: 0, drop: 0 },
};

function PortraitFeatures({ skin = "#edc2aa", shade = "#c88886", hair = "#6e465b", eyes = "open", beard = false }) {
  return (
    <>
      <Glass d="M-14-6Q-14-18 0-19Q14-18 14-6L12 5Q10 13 0 17Q-10 13-12 5Z" fill={skin} width={2.35} />
      <Glass d="M-14-7-9-4Q-10 8-1 16L-6 14Q-13 10-14-7ZM14-7 9-4Q10 8 1 16L6 14Q13 10 14-7Z" fill={shade} width={1.05} />
      <Glass d="M-15-4Q-17-14-10-20Q-4-24 0-20Q5-24 11-20Q18-15 15-4L11-8Q5-8 0-14Q-4-9-11-8Z" fill={hair} width={1.85} />
      <path d="M-11-15Q-6-21-1-19M2-19Q7-20 11-15" stroke="#f3dab2" strokeWidth=".95" opacity=".44" fill="none" />
      {beard && <>
        <Glass d="M-12 5Q-7 9-3 7L0 8 3 7Q7 9 12 5L10 13 5 17 0 21-6 17-10 13Z" fill={hair} width={1.45} />
        <path d="M-7 11-4 16m11-5-3 5M0 12v6" stroke="#f2d7b4" strokeWidth=".8" opacity=".55" fill="none" />
      </>}
      {eyes === "blind" ? <Glass d="M-13-6 13-6 12 0Q0 3-12 0Z" fill="#e1d7e5" width={1.6} /> :
        <g fill="none" strokeLinecap="round">
          <path d="M-10-4Q-7-6-3-4M3-4Q7-6 10-4" stroke={shade} strokeWidth="1.12" />
          <path d={eyes === "closed" ? "M-9-.5Q-6 1-3-.4M3-.4Q6 1 9-.5" : "M-9-.5Q-6-2-3-.4M3-.4Q6-2 9-.5"} stroke="#3b293f" strokeWidth="1.24" />
          {eyes === "open" && <path d="M-6-.8v1M6-.8v1" stroke="#3b293f" strokeWidth="1.5" />}
        </g>
      }
      <path d="M0-2-1.5 5 1 5.6M-3 9Q0 10.1 3 9" fill="none" stroke={shade} strokeWidth="1.28" strokeLinecap="round" />
    </>
  );
}

function Face({ skin = "#edc2aa", shade = "#c88886", hair = "#6e465b", metal = "#f4cb8e", hat = "hair", eyes = "open", beard = false, frontal = false }) {
  return (
    <g transform="translate(0 -132)">
      {frontal ? <PortraitFeatures skin={skin} shade={shade} hair={hair} eyes={eyes} beard={beard} /> : <>
      <Glass d="M-13-4Q-14-14-4-17Q7-20 13-11Q17-6 15 1L18.5 5 14 7Q12 13 6 16Q1 16-5 12L-11 7Z"
        fill={skin} width={2.25} />
      <Glass d="M-12-6Q-7-9-5-2L-6 4Q-4 10 6 15L2 15-5 12-11 7Z" fill={shade} width={1.15} />
      <path d="M6-5Q7 0 11 4L8 6M1 10Q5 11 9 9" stroke={shade} strokeWidth="1.35" fill="none" strokeLinecap="round" />
      <Glass d="M-13-4Q-17-12-8-18Q0-23 9-18Q16-16 16-8L10-10 5-13-1-8-8-6-10 5-15 1Z"
        fill={hair} width={2.1} />
      <path d="M-11-11Q-7-17 2-18M6-17 12-13" fill="none" stroke={metal} strokeWidth="1.05" strokeLinecap="round" opacity=".5" />
      {beard && (
        <Glass d="M-8 5Q-6 8-2 9L3 7 7 8.5 13 5Q12 12 8 15L5 21-2 17-8 12Z" fill={hair} width={1.45} />
      )}
      {eyes === "blind" ? (
        <Glass d="M-12-4 15-5 15 0 11 3-12 2Z" fill="#ddd1e6" width={1.65} />
      ) : (
        <g fill="none" strokeLinecap="round">
          <path d="M-5-5Q-1-7 3-5M7-6Q11-7 13-5" stroke="#744b5e" strokeWidth="1.05" />
          <path d={eyes === "closed" ? "M-5-1Q-1 1 3-1M7-2Q10 0 13-2" : "M-5-1Q-1-3 3-1M7-2Q10-4 13-2"} stroke="#382336" strokeWidth="1.15" />
          {eyes === "open" && <path d="M-.6-1.4v1M10-2.5v1" stroke="#342239" strokeWidth="1.65" />}
        </g>
      )}
      </>}
      {hat === "hood" && <>
        <Glass d="M-21 11Q-24-18-11-23Q0-29 13-19L18-9 12-10Q3-19-6-12Q-14-6-12 8L-5 16-16 18Z" fill={metal} width={2.2} />
        <path d="M-17 10Q-20-8-11-16Q1-23 10-18" fill="none" stroke="#efcb98" strokeWidth="1.1" opacity=".68" />
      </>}
      {hat === "cap" && (
        <Glass d="M-16-11Q-14-21 1-23Q11-25 16-17L24-12 14-10-3-12-14-6Z" fill={metal} width={2.1} />
      )}
      {hat === "flowers" && <>
        <path d="M-15-12Q0-24 15-12" fill="none" stroke={lead} strokeWidth="4" />
        <Flower x={-10} y={-17} size={.36} hue={4} count={5} />
        <Flower x={1} y={-20} size={.43} hue={3} count={7} />
        <Flower x={11} y={-16} size={.34} hue={0} count={5} />
      </>}
      {hat === "crown" && <>
        <Glass d="M-15-11-18-24-7-20 0-28 8-20 18-24 15-11Q0-7-15-11Z" fill={metal} width={2.2} />
        <Glass d="M-13-14Q0-18 13-14L12-10Q0-8-12-10Z" fill="#e2ad77" width={1.4} />
        <Glass d="M0-22 4-17 0-13-4-17Z" fill="#a9587b" width={1.2} />
      </>}
      {hat === "mitre" && <>
        <Glass d="M-14-11-15-24 1-40 15-24 14-12Q0-8-14-11Z" fill="#ead3aa" width={2.5} />
        <path d="M1-34V-15m-6-12h12" stroke="#9a6168" strokeWidth="2.3" />
      </>}
      {hat === "wrap" && (
        <Glass d="M-14-9-14-15Q-10-21-5-19L16-16 16-10Q0-15-14-9Z" fill="#eadad4" width={1.9} />
      )}
      {!beard && hat !== "hood" && <circle cx="-8.4" cy="6" r="1.85" fill="#e8bd87" stroke={lead} strokeWidth=".85" />}
    </g>
  );
}

function Sleeve({
  start = -17, elbowX = -27, elbowY = -77, handX = -30, handY = -57,
  cloth = "#ad6384", shade = "#704769", lining = "#e5afab", skin = "#edc2aa",
}) {
  const shoulderY = -103;
  const length = Math.hypot(handX - elbowX, handY - elbowY) || 1;
  const ux = (handX - elbowX) / length;
  const uy = (handY - elbowY) / length;
  const shoulderLength = Math.hypot(elbowX - start, elbowY - shoulderY) || 1;
  const sx = (elbowY - shoulderY) / shoulderLength;
  const sy = (elbowX - start) / shoulderLength;
  const wristX = handX - ux * 3;
  const wristY = handY - uy * 3;
  const point = (x = 0, y = 0) => x.toFixed(2) + "," + y.toFixed(2);
  const shoulderEdge = (side = 1) => point(start + sx * 7.1 * side, shoulderY - sy * 7.1 * side);
  const elbowEdge = (side = 1) => point(elbowX + uy * 6.2 * side, elbowY - ux * 6.2 * side);
  const wristEdge = (side = 1) => point(wristX + uy * 4.2 * side, wristY - ux * 4.2 * side);
  const centerline = point(elbowX, elbowY);
  const wrist = point(wristX, wristY);
  return (
    <g>
      <Glass d={"M" + shoulderEdge(1) + "Q" + elbowEdge(1) + " " + wristEdge(1) + "L" + wristEdge(-1) + "Q" + elbowEdge(-1) + " " + shoulderEdge(-1) + "Z"}
        fill={cloth} width={2.55} />
      <Glass d={"M" + shoulderEdge(-1) + "Q" + elbowEdge(-1) + " " + wristEdge(-1) + "L" + wrist + "Q" + centerline + " " + point(start, shoulderY + 1) + "Z"}
        fill={shade} width={1.1} />
      <g transform={"translate(" + handX + " " + handY + ") rotate(" + Math.atan2(uy, ux) * 180 / Math.PI + ")"}>
        <Glass d="M-7-4.3-3-4.5-2 3.9-7 4.7Z" fill={lining} width={1.35} />
        <Glass d="M-2-3.1Q0-5 2-4Q3-3.2 1.9-2.5L5.8-1.5Q7.7.7 5.4 2.9L2.8 4.1-2 3.1Z"
          fill={skin} width={1.5} />
        <path d="M2.6-.7 5.4 0M2.1 1.7 4.8 2.2" fill="none" stroke={shade} strokeWidth=".75" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Trousers({ left = -15, right = 16, dark = "#594060", cloth = "#995e82", rim = "#e4b4a2" }) {
  return (
    <>
      {[left, right].map((foot, index) => {
        const upper = index ? 6 : -14;
        const knee = (upper + foot) / 2;
        return (
          <g key={index}>
            <Glass d={"M" + (upper - 6) + " -63H" + (upper + 12) + "Q" + (knee + 11) + " -46 " + (knee + 7) + " -32L" + (foot + 4) + " -12H" + (foot - 5) + "Q" + (knee - 9) + " -31 " + (upper - 6) + " -63Z"}
              fill={index ? cloth : dark} width={2.45} />
            <path d={"M" + (upper + 8) + " -53Q" + (knee + 7) + " -41 " + (foot + 1) + " -18"} fill="none" stroke={rim} strokeWidth="1.6" opacity=".77" />
            <Glass d={"M" + (foot - 5) + " -17L" + (foot + 5) + " -18 " + (foot + 4) + " -7 " + (foot + 12) + " -2 " + (foot + 11) + " 3H" + (foot - 9) + "Z"} fill="#34283e" width={2.35} />
            <path d={"M" + (foot - 3) + " -13h6"} stroke={rim} strokeWidth="1.2" />
          </g>
        );
      })}
    </>
  );
}

function Skirt({ dark = "#594060", cloth = "#995e82", rim = "#e4b4a2", seated = false }) {
  const width = seated ? 1.08 : 1;
  return (
    <g transform={"scale(" + width + " 1)"}>
      <Glass d="M-20-74Q-2-79 19-74Q22-50 27-35Q33-18 46-4Q33 7 15 5L3 8-12 5Q-30 8-48-3Q-31-23-20-74Z" fill={cloth} width={3.15} />
      <Glass d="M-18-71-9-68Q-12-47-18-34Q-22-19-36-7L-43-3-47-4Q-34-31-29-48Z" fill={dark} width={2.05} />
      <Glass d="M-8-67Q-3-70 4-68L1-43Q4-22-6 4L-16 5-28 2Q-14-19-13-38Z" fill={rim} width={2.05} />
      <Glass d="M4-65 13-61Q17-41 14-30Q12-13 18 4L3 7-5 5Q3-23 0-43Z" fill={dark} width={2.05} />
      <Glass d="M16-68Q24-45 26-36Q33-25 45-5L29 2Q19-8 18-25L12-47Z" fill={rim} width={2.05} />
      <Glass d="M-23-22Q-22-36-16-43L-13-32Q-16-20-22-12Z" fill={cloth} width={1.25} />
      <Glass d="M17-51Q24-41 25-30L32-13Q25-20 23-26Z" fill={cloth} width={1.25} />
      <path d="M-41-4Q-28 2-20 0M-5 1 2 4M22 1Q33 1 41-4M-20-47Q-23-29-29-23M21-40 25-25" fill="none" stroke="#edbc93" strokeWidth="1.15" strokeLinecap="round" opacity=".83" />
    </g>
  );
}

function CeremonialMantle({ dark = "#594060", cloth = "#995e82", rim = "#e4b4a2", drop = 0 }) {
  const top = -108 + drop;
  const edges = "M-22 " + top + "Q-19 " + (top - 8) + " 0 " + (top - 5) + "Q18 " + (top - 7) + " 23 " + top +
    "C35 " + (top + 10) + " 36-41 57-16L69 0Q50 10 28 6L0 3-28 6Q-50 10-69 0L-57-16C-37-40-35 " + (top + 11) + "-22 " + top + "Z";
  return (
    <g>
      <Glass d={edges} fill={dark} width={3.4} />
      {[-1, 1].map((side) => (
        <g key={side} transform={"scale(" + side + " 1)"}>
          <Glass d={"M18 " + (top - 1) + "Q32 " + (top + 4) + " 34 " + (top + 19) + "Q43-29 63-2Q54 2 46 2Q29-15 25-43L20 " + (top + 14) + "Z"}
            fill={cloth} width={2.1} />
          <Glass d={"M24 " + (top + 7) + "Q36 " + (top + 15) + " 37 " + (top + 27) + "Q47-25 65 0L59 2Q40-16 34-38Z"}
            fill={rim} width={1.65} />
          <Glass d={"M32 " + (top + 18) + "Q41-33 54-17L62-3 51 0Q44-13 41-16L37-36Z"}
            fill={dark} width={1.65} />
          <path d="M54-2 61 0M43-17 49-9M37-37 41-27" fill="none" stroke="#f2cc91" strokeWidth="1.25" strokeLinecap="round" opacity=".86" />
          <Glass d="M47-11l3 3-3 4-3-4Z" fill="#ecc181" width={1.15} />
        </g>
      ))}
    </g>
  );
}

function TravelCloak({ dark = "#594060", cloth = "#995e82", rim = "#e4b4a2", drop = 0, sweeping = false }) {
  const shoulder = -108 + drop;
  const corner = sweeping ? -63 : -48;
  return (
    <g>
      <Glass d={"M-20 " + shoulder + "Q-32 " + (shoulder + 1) + " -36-63Q-38-33 " + corner + " 3Q-36 9-16-2Q2-7 24-1L38-7Q25-28 31-61Q31 " + (shoulder + 11) + " 19 " + shoulder + "Z"} fill={dark} width={2.95} />
      <Glass d={"M-26 " + (shoulder + 5) + "Q-32 " + (shoulder + 10) + " -30-65Q-35-31 " + (corner + 5) + " 0L-41 1Q-26-21-26-40L-19 " + (shoulder + 13) + "Z"} fill={cloth} width={2.05} />
      <Glass d={"M-34-43Q-40-17 " + (corner + 3) + "-1L-39 2Q-22-25-26-43Z"} fill={rim} width={1.65} />
      <Glass d={"M17 " + (shoulder + 4) + "Q32 " + (shoulder + 13) + " 28-60Q24-25 36-9L25-3Q13-27 17-54L13 " + (shoulder + 17) + "Z"} fill={cloth} width={2.15} />
      <Glass d="M22-46Q18-23 25-5L19-4Q12-21 17-40Z" fill={rim} width={1.7} />
      <path d={"M-27 " + (shoulder + 15) + "Q-34-47-51-4m11-4 9-26m57 26q-10-17-7-36"} fill="none" stroke="#eab98e" strokeWidth="1.12" opacity=".72" strokeLinecap="round" />
    </g>
  );
}

function Person({
  x = 160, y = 375, size = 1, face = 1, angle = 0, wear = "coral",
  pose = "still", tone = 0, hat = "hair", eyes = "open", dress = false, beard = false,
}) {
  const [dark, cloth, rim] = Object.entries(clothes).find(([name]) => name === wear)?.[1] ?? clothes.coral;
  const [skin, shade, hair] = complexions[tone];
  const { arms, feet, lean, drop } = Object.entries(poses).find(([name]) => name === pose)?.[1] ?? poses.still;
  const [left, right] = feet;
  const longCoat = dress || hat === "hood" || hat === "mitre" || (size >= 1.16 && angle === 0 && pose !== "walk" && pose !== "lift");
  const royal = hat === "crown" || hat === "mitre" || hat === "flowers";
  return (
    <g className="tarot-figure" transform={"translate(" + x + " " + y + ") rotate(" + angle + ") scale(" + face * size + " " + size + ")"}>
      <ellipse cy="4" rx={longCoat ? 39 : 28} ry="4.6" fill={lead} opacity=".27" />
      {royal ? <CeremonialMantle dark={dark} cloth={cloth} rim={rim} drop={drop} /> :
        size >= .84 && angle === 0 && <TravelCloak dark={dark} cloth={cloth} rim={rim} drop={drop} sweeping={pose === "walk" || pose === "dance" || pose === "raise"} />}
      {longCoat
        ? <Skirt dark={dark} cloth={cloth} rim={rim} seated={pose === "seated"} />
        : <Trousers left={left} right={right} dark={dark} cloth={cloth} rim={rim} />}
      <g transform={"translate(" + lean + " " + drop + ")"}>
        {hat === "hood" ? (
          <Glass d="M-24-63Q-27-79-22-109Q-25-131-15-147Q1-159 16-141Q25-130 23-108L30-76 21-65-3-75Z" fill={dark} width={2.85} />
        ) : dress && !beard && (
          <g>
            <Glass d="M-19-73Q-12-91-14-108Q-21-119-17-136Q-16-150 1-153Q18-152 20-136Q21-125 19-113L24-92Q25-80 31-73Q16-79 8-90L-2-88-8-73Z"
              fill={hair} width={2.5} />
            <path d="M-13-137Q-19-127-9-106Q-8-94-14-85M13-139Q19-128 15-116Q14-105 22-91" fill="none" stroke={rim} strokeWidth="1.6" opacity=".53" />
          </g>
        )}
        <Glass d="M-23-103Q-18-114-7-116L8-116Q19-114 24-102Q23-85 21-75L26-55Q15-44 0-47Q-14-43-29-53L-22-76Z"
          fill={cloth} width={2.9} />
        <Glass d="M-22-104-15-109-2-94-8-80Q-10-69-19-53L-28-53-22-76Z"
          fill={dark} width={1.9} />
        <Glass d="M9-113 21-106 23-96 18-76 25-56 9-50 5-65 9-83 4-94Z"
          fill={dark} width={1.9} />
        <Glass d="M-10-112-6-121 8-122 9-111 2-103Z" fill={shade} width={1.9} />
        <Glass d="M-15-112-4-105 3-101 13-112 19-109 4-91-4-93-21-107Z"
          fill={rim} width={2.15} />
        <Glass d="M-7-91 2-88 10-93 7-74 1-70-7-78Z" fill={cloth} width={1.55} />
        <Glass d="M-18-96-13-95Q-10-85-15-76L-21-73-24-78ZM15-94 20-98 22-89 18-77 12-72 9-76Z" fill={cloth} width={1.45} />
        <path d="M-17-101Q-21-98-20-90M18-104Q22-97 20-91" stroke="#f3d1a1" fill="none" strokeWidth="1.1" opacity=".77" />
        <path d="M-15-94-18-81M15-90 12-78M-18-58Q-13-63-11-70M11-71 16-54" fill="none" stroke={rim} strokeWidth="1.25" opacity=".91" strokeLinecap="round" />
        {royal && (
          <Glass d="M-24-108Q-17-115-10-115L-5-108-12-97-23-96ZM11-115Q20-113 25-104L22-97 13-98 6-108Z"
            fill={rim} width={1.65} />
        )}
        <Glass d="M-21-71Q0-67 22-72L23-65Q3-58-22-64Z" fill={rim} width={1.8} />
        <Glass d="M0-70 5-66 0-61-5-65Z" fill="#dba675" width={1.35} />
        <path d="M-17-65q8 2 12 0m10 0q6-1 13-3M-15-54l7 2m16 0 7-2" fill="none" stroke="#f1c997" strokeWidth="1" opacity=".74" />
        {longCoat && <>
          <Glass d="M-21-59Q-8-53 0-56Q14-57 25-62L26-57Q15-50 1-49Q-9-47-23-54Z" fill={dark} width={1.35} />
          <path d="M-19-55Q-7-50 1-52Q12-53 23-57" fill="none" stroke={rim} strokeWidth="1.05" />
        </>}
        <Face skin={skin} shade={shade} hair={hair} metal={hat === "hood" ? cloth : royal ? "#efd095" : rim} hat={hat} eyes={eyes} beard={beard} frontal={royal} />
        {arms.map(([elbowX, elbowY, handX, handY], index) => (
          <Sleeve key={index} start={index ? 17 : -17} elbowX={elbowX} elbowY={elbowY} handX={handX} handY={handY}
            cloth={cloth} shade={dark} lining={rim} skin={skin} />
        ))}
        {royal && <Glass d="M3-101 6-97 3-93 0-97Z" fill="#f4d198" width={1.25} />}
      </g>
    </g>
  );
}

function Prop({ group = 2, x = 160, y = 230, size = 1, tilt = 0 }) {
  const colors = [["#bb734e", "#f9d998"], ["#d3a561", "#ffe9b1"], ["#b89772", "#eee8fc"], ["#d3a758", "#fde49e"]][group - 1];
  return (
    <g transform={"translate(" + x + " " + y + ") rotate(" + tilt + ") scale(" + size + ")"}>
      <SuitGlyph group={group} color={colors[0]} light={colors[1]} />
    </g>
  );
}

function Props({ group = 2, points = [[160, 230]] }) {
  return points.map(([x, y, size, tilt], index) => <Prop key={index} group={group} x={x} y={y} size={size ?? 1} tilt={tilt ?? 0} />);
}

function Tree({ x = 80, y = 365, size = 1, evergreen = false, autumn = false }) {
  const leaves = autumn ? ["#b25366", "#d77e65", "#f5b377"] : ["#325b68", "#659287", "#9eb791"];
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-14 0-7-59-16-105-7-112 0-78 16-111 24-104 10-59 14 0Z" fill="#895b57" width={3.4} />
      {evergreen ? <>
        <Glass d="M0-150 26-106 14-109 35-76 19-82 43-46Q0-29-43-46L-18-82-35-76-15-109-26-106Z" fill={leaves[0]} width={3.6} />
        <Glass d="M0-142-2-45-38-47-18-82-34-77-13-111-24-108Z" fill={leaves[1]} width={2.5} />
      </> : <>
        <Glass d="M-35-139Q-19-166 6-147Q27-155 36-132Q65-118 42-94Q33-77 11-84Q-6-69-25-88Q-49-85-54-107Q-56-126-35-139Z" fill={leaves[1]} width={3.8} />
        <Glass d="M-35-139Q-19-166 6-147L3-121-19-107-54-107Q-56-126-35-139Z" fill={leaves[2]} width={2.5} />
        <Glass d="M4-122 35-131Q65-118 42-94Q33-77 11-84L-3-101Z" fill={leaves[0]} width={2.6} />
        <path d="M-35-124-22-122-9-131M13-106 26-107 33-117" fill="none" stroke={lead} strokeWidth="2.1" />
      </>}
    </g>
  );
}

function House({ x = 160, y = 331, size = .9, tower = false, lit = true }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      {tower ? <>
        <Glass d="M-37 0-34-129-43-136-43-161-28-161-28-147-15-147-15-161 1-161 1-147 15-147 15-161 31-161 31-147 42-161 42-136 34-129 38 0Z" fill="#988fae" width={4.4} />
        <Glass d="M0-129H34L38 0H0Z" fill="#70698a" width={2.5} />
        <Glass d="M-10-111Q0-124 10-111V-85H-10ZM-10-54Q0-67 10-54V-30H-10Z" fill={lit ? "#f5c887" : "#2e2849"} width={2.8} />
        <path d="M-32-75H35M-33-19H37M-17-75V-58M17-19V-4" fill="none" stroke={lead} strokeWidth="2.7" />
      </> : <>
        <Glass d="M-46 0V-59L0-92 47-59V0Z" fill="#c28a83" width={3.5} />
        <Glass d="M-56-56 0-108 56-56 45-48 0-87-46-48Z" fill="#673b60" width={3.6} />
        <Glass d="M-13 0V-30Q0-46 13-30V0Z" fill="#544063" width={2.8} />
        <Glass d="M-34-48H-20V-27H-34ZM22-48H36V-27H22Z" fill={lit ? "#ffe2a3" : "#8989af"} width={2.7} />
        <path d="M-27-48V-27M29-48V-27" stroke={lead} strokeWidth="1.5" />
      </>}
    </g>
  );
}

function Seat({ x = 160, y = 377, size = 1, tall = true }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      {tall && <>
        <Glass d="M-51-30V-148L0-177 51-148V-30Z" fill="#6e3f59" width={4.4} />
        <Glass d="M-39-39V-141L0-164 39-141V-39Z" fill="#c48672" width={3} />
        <path d="M0-159V-71M-35-143 0-119 35-143" stroke={lead} strokeWidth="2.8" fill="none" />
      </>}
      <Glass d="M-53-48H53V-20H-53ZM-48-21H-32V0H-48ZM32-21H48V0H32Z" fill="#9c686e" width={3.7} />
      <Glass d="M-50-48 0-55 50-48 0-36Z" fill="#e0a582" width={2.6} />
    </g>
  );
}

function WorkTable({ x = 160, y = 357, size = 1, cloth = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-70-40H70V-23H-70ZM-62-23H-49V9H-62ZM49-23H62V9H49Z" fill="#95616a" width={3.4} />
      {cloth && <Glass d="M-48-36H48L41 3 0 13-39 3Z" fill="#ad5986" width={3} />}
      {cloth && <Glass d="M-8-35 8-35 10 8 0 13-10 8Z" fill="#eeb480" width={2.2} />}
    </g>
  );
}

function Animal({ x = 160, y = 370, size = 1, face = 1, color = "#ce9e78" }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + face * size + " " + size + ")"}>
      <Glass d="M-75-44Q-62-67-47-49L-34-47Q-20-57 0-48L9-58 16-76 25-61 38-66 41-51 57-42 49-31 29-33 23-16 27 1H13L5-22-22-19-27 1H-40L-38-24-47-36Q-60-52-70-37Z"
        fill={color} width={4} />
      <Glass d="M-30-43-1-47 17-35 9-22-22-19-36-25Z" fill="#edbb90" width={2.3} />
      <Glass d="M21-57 37-55 42-48 52-43 48-36 30-39Z" fill="#ead0ab" width={2.2} />
      <path d="M32-51 36-51M50-43 53-42" stroke={lead} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Lion({ x = 160, y = 370, size = 1, face = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + face * size + " " + size + ")"}>
      <Glass d="M-49-32Q-64-46-77-39Q-84-35-82-27Q-68-31-56-19L-51-5-43 7H-30L-33-12-11-11-4 7H10L8-12Q22-16 28-31L20-49-5-54Q-34-55-49-32Z"
        fill="#d39a68" width={4.1} />
      <Glass d="M-43-36Q-30-52-7-50L9-30Q-16-17-42-21Z" fill="#edb17a" width={2.7} />
      <Glass d="M7-70 20-81 34-78 48-71 55-58 54-43 57-29 42-21 34-11 19-20 5-30-2-44-3-55Z"
        fill="#a4524d" width={4.1} />
      <Glass d="M7-67 20-77 30-73 21-59 9-48-1-52ZM44-70 53-59 50-46 42-35 36-29 35-13 48-23 57-29 57-40Z"
        fill="#e18a58" width={2.7} />
      <Glass d="M12-52Q12-61 22-61L27-55Q40-61 43-50L48-38Q42-29 30-29Q17-32 13-42Z"
        fill="#eeb27e" width={3.2} />
      <Glass d="M23-39Q31-44 38-40L46-37Q42-29 30-29Q23-32 23-39Z" fill="#f6cda2" width={2.5} />
      <path d="M23-47h3m11-1h2m-7 8 5-2 4 2-4 4m-49 13-5 9" stroke={lead} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Heart({ x = 160, y = 225, size = 1, cracked = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M0 50C-10 36-54 9-54-19Q-54-43-32-43Q-11-43 0-23Q11-43 32-43Q54-43 54-19C54 9 10 36 0 50Z" fill="#c83f60" width={4} />
      <Glass d="M0-22Q10-41 31-43Q54-43 54-19C54 7 12 36 0 50L17 10Z" fill="#e58b91" width={2.9} />
      {cracked && <path d="M0-25-13-6 3 8-8 25 0 47" stroke={lead} strokeWidth="4" fill="none" />}
    </g>
  );
}

function Book({ x = 160, y = 242, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-40-25Q-17-30 0-16Q17-30 40-25V21Q17 17 0 29Q-17 17-40 21Z" fill="#ead6ae" width={3.2} />
      <path d="M0-16V27M-31-13Q-18-14-9-7M9-7Q18-14 31-13M-31-3Q-18-4-9 3M9 3Q18-4 31-3" stroke="#846278" strokeWidth="2.2" fill="none" />
    </g>
  );
}

function Scales({ x = 160, y = 245, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-4-41H4V32L16 40H-16L-4 32Z" fill="#e7aa71" width={2.6} />
      <Glass d="M-45-18 0-31 45-18 43-12 0-23-43-12Z" fill="#f7d492" width={2.6} />
      {[-38, 38].map((side) => (
        <g key={side} transform={"translate(" + side + " 0)"}>
          <path d="M0-15-14 15H14Z" stroke="#e7c68d" fill="none" strokeWidth="2.4" />
          <Glass d="M-18 15H18Q14 30 0 31Q-14 30-18 15Z" fill="#eab981" width={2.7} />
        </g>
      ))}
    </g>
  );
}

function Lantern({ x = 160, y = 230, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <circle r="53" fill="#ffd393" opacity=".18" />
      <circle r="43" fill="#ffe0a0" opacity=".21" />
      <Glass d="M-24-19-13-34H13L24-19 20 30H-20Z" fill="#f1bf7c" width={3.6} />
      <Glass d="M-14-15H14L11 23H-11Z" fill="#fff0b6" width={2.4} />
      <path d="M-8-34V-40Q0-53 8-40V-34M0-16V22" stroke={lead} strokeWidth="3.5" fill="none" />
    </g>
  );
}

function Wheel({ x = 160, y = 224, size = 1, ornate = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <circle r="60" fill="#332841" stroke={lead} strokeWidth="4" />
      <circle r="51" fill="none" stroke={ornate ? "#f5d3a2" : "#ba8271"} strokeWidth="8" />
      {Array.from({ length: 8 }, (_, index) => (
        <g key={index} transform={"rotate(" + index * 45 + ")"}>
          <Glass d="M-4-7-6-46 6-46 4-7Z" fill={index % 2 ? "#d0866e" : "#d7ae8c"} width={2.6} />
          {ornate && <path d={starPath} transform="translate(0 -57) scale(.85)" fill="#ffd9a1" stroke={lead} strokeWidth="1.8" />}
        </g>
      ))}
      <circle r="12" fill="#dca484" stroke={lead} strokeWidth="3.2" />
    </g>
  );
}

function Boat({ x = 160, y = 355, size = 1, sail = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      {sail && <>
        <path d="M0-21V-123" stroke={lead} strokeWidth="5" />
        <Glass d="M3-117Q28-92 47-47H3ZM-4-105-41-49H-4Z" fill="#dfb9bf" width={3.4} />
      </>}
      <Glass d="M-95-19Q-45-4 3-11Q52-5 108-34L87-2Q31 32-53 21Q-81 15-95-19Z" fill="#9f686c" width={4.3} />
      <Glass d="M-72 4Q-1 20 83-3L75 7Q8 33-53 21Z" fill="#573c63" width={2.8} />
      <path d="M-86 28Q-49 38-19 30M7 33Q63 34 98 19" stroke="#9dd9d8" strokeWidth="2.6" fill="none" />
    </g>
  );
}

function Bloom({ x = 160, y = 357, size = 1, hue = 3 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <path d="M0 0Q-8-16 0-37" stroke={lead} strokeWidth="5" fill="none" />
      <path d="M0 0Q-8-16 0-37" stroke="#9cc894" strokeWidth="2.1" fill="none" />
      <Glass d="M-3-10Q-20-9-21-20Q-7-20-3-10ZM-5-15Q7-28 16-23Q9-12-5-15Z" fill="#619787" width={1.8} />
      <Flower y={-38} hue={hue} count={7} size={1.35} />
    </g>
  );
}


function Sky({ mood = "sun", x = 160, y = 127, radius = 43, color = "#ffdc9f" }) {
  if (mood === "rainbow") return (
    <g fill="none" strokeLinecap="round">
      <path d="M43 246Q61 111 160 103Q265 111 278 246" stroke={lead} strokeWidth="45" />
      {["#e17c90", "#eebe85", "#d6ce8b", "#83b6b0", "#829ac8"].map((fill, index) => (
        <path key={fill} d={"M" + (43 + index * 8) + " 246Q" + (61 + index * 5) + " " + (111 + index * 10) + " 160 " + (103 + index * 7.5) + "Q" + (265 - index * 5) + " " + (111 + index * 10) + " " + (278 - index * 8) + " 246"} stroke={fill} strokeWidth="6.8" />
      ))}
    </g>
  );
  if (mood === "none") return null;
  if (mood === "storm") return (
    <g>
      {[[86, 155, .88], [212, 116, 1], [257, 176, .64]].map(([cx, cy, scale]) => <Cloud key={cx} x={cx} y={cy} size={scale} dark />)}
      <path d="M42 195l-17 39m40-35-25 56m52-66-17 43m158-45-21 53m55-50-25 59m48-56-13 35M47 276l-13 27m252-37-18 51" stroke="#aaa4c9" strokeWidth="3" opacity=".76" />
    </g>
  );
  if (mood === "stars") return (
    <g>
      {[[160, 116, 4.5], [72, 150, 1.27], [105, 111, 1], [212, 118, 1.12], [251, 158, 1.36], [125, 164, .79], [188, 169, .82]].map(([sx, sy, size]) => (
        <path key={sx} d={starPath} transform={"translate(" + sx + " " + sy + ") scale(" + size + ")"} fill={color} stroke={lead} strokeWidth={size > 2 ? 1.15 : 1.7} />
      ))}
      <circle cx="160" cy="116" r="48" stroke={color} strokeWidth="1.9" fill="none" />
    </g>
  );
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <circle r={radius + 12} fill="none" stroke={color} strokeWidth="2" opacity=".68" />
      {mood === "moon" ? <>
        <circle r={radius} fill="#8f91bc" stroke={lead} strokeWidth="3.2" />
        <Glass d={"M17 " + (-radius + 6) + "A" + radius + " " + radius + " 0 1 0 21 " + (radius - 7) + "Q-13 " + (radius - 34) + "-2-9Q4-29 17 " + (-radius + 6) + "Z"}
          fill={color} width={3.1} />
        <path d={starPath} transform="translate(20 -7) scale(1.24)" fill="#fff0cc" stroke={lead} strokeWidth="1.6" />
      </> : <>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = index * TAU / 12;
          return <Glass key={index} d={"M" + polar(radius - 2, angle - .09) + "L" + polar(radius + 21, angle) + "L" + polar(radius - 2, angle + .09) + "Z"} fill={color} width={2.7} />;
        })}
        <circle r={radius} fill="#f5b67b" stroke={lead} strokeWidth="3.5" />
        <circle r={radius - 6} fill={color} stroke={lead} strokeWidth="2.2" />
        <path d={"M" + (-radius + 8) + " 5Q0 " + (-radius + 13) + " " + (radius - 8) + " 5Q0-5 " + (-radius + 8) + " 5Z"} fill="#fff0c4" opacity=".83" />
      </>}
    </g>
  );
}

function Cloud({ x = 160, y = 160, size = 1, dark = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-60 14Q-60-6-39-9Q-32-25-11-22Q4-42 22-32Q38-27 42-13Q61-16 65 3Q64 19 43 22H-37Q-55 22-60 14Z" fill={dark ? "#50436c" : "#d2bed5"} width={3.4} />
      <Glass d="M-57 14Q-29 2-19 10Q-5-3 12 7Q31-3 40 6L63 5Q64 19 43 22H-37Q-55 22-57 14Z" fill={dark ? "#342b54" : "#a79dc5"} width={2.4} />
    </g>
  );
}

function Landscape({ place = "field", tint = scenery.dawn }) {
  const hall = place === "hall" || place === "room" || place === "forge";
  const water = place === "river" || place === "shore" || place === "harbor";
  if (hall) return (
    <g>
      <Glass d="M33 381V209Q33 135 160 72Q287 135 287 209V381Z" fill="none" width={4.5} />
      <path d="M48 330V214Q48 151 160 91Q272 151 272 214V330M83 309V226Q83 180 160 140Q237 180 237 226V309" fill="none" stroke={tint[1]} strokeWidth="4" />
      <Pillar x={46} y={178} height={157} wide />
      <Pillar x={274} y={178} height={157} wide />
      <Glass d="M0 331Q160 347 320 331V456H0Z" fill={tint[1]} width={3.8} />
      <Glass d="M0 398 119 343 185 345 320 404V456H0Z" fill={tint[2]} width={3.2} />
      <path d="M41 456 126 347M117 456 152 348M202 456 177 348M284 456 198 350M0 424H320M34 387H286" fill="none" stroke={lead} strokeWidth="2.3" />
      {place === "room" && <House x={270} y={326} size={.45} lit={false} />}
      {place === "forge" && <Lantern x={249} y={238} size={.49} />}
    </g>
  );

  return (
    <g>
      <Glass d="M0 291 31 255 62 267 105 211 137 246 167 230 196 265 243 206 280 249 320 266V361H0Z" fill={tint[2]} width={3.7} />
      <Glass d="M61 269 105 211 119 231 109 229 98 243 90 241ZM228 226 243 206 264 229 246 227 238 239Z" fill={tint[4]} width={2.5} />
      <Glass d="M0 301Q64 262 133 293Q210 263 320 285V456H0Z" fill={tint[1]} width={3.6} />
      {water ? <>
        <Glass d="M0 330Q62 309 121 325T241 319Q289 302 320 314V456H0Z" fill="#446f98" width={4.1} />
        <Glass d="M0 384Q92 351 162 377Q232 397 320 361V456H0Z" fill="#31556f" width={3.2} />
        <path d="M15 342Q65 330 104 344T189 345M190 330Q237 322 277 330M10 388Q59 376 110 385M109 411Q177 389 234 405M192 367Q250 350 305 358M237 440Q288 417 320 423" stroke="#a6cbd3" strokeWidth="2.7" fill="none" />
        {place === "harbor" && <Seat x={48} y={349} size={.63} tall={false} />}
        {place === "shore" && <Glass d="M0 356Q80 326 141 369L171 399 93 430 0 431Z" fill={tint[2]} width={3.5} />}
      </> : place === "cliff" ? <>
        <Glass d="M0 327Q54 298 110 316L180 331 196 356 166 398 153 456H0Z" fill="#7f667c" width={4.1} />
        <Glass d="M0 329Q77 291 179 330L195 356Q130 353 77 363L0 374Z" fill="#9aad83" width={3.3} />
        <Glass d="M93 359 87 412 61 456H109L130 411 138 354Z" fill="#ad8190" width={2.7} />
      </> : <>
        <Glass d="M0 351Q66 326 138 351Q205 323 320 346V456H0Z" fill={place === "snow" ? "#a7acc8" : "#628781"} width={3.6} />
        <Glass d="M0 412 78 382 160 396 252 365 320 399V456H0Z" fill={place === "snow" ? "#ccd3e3" : "#3d6d72"} width={3.2} />
        {place === "path" && <Glass d="M134 456Q209 414 181 390Q143 376 163 353L178 338Q158 362 192 384Q239 419 195 456Z" fill="#d3a2a0" width={2.7} />}
        {place === "farm" && <path d="M0 416 138 354M32 454 164 350M111 456 190 350M194 456 214 351M268 454 245 355M320 429 278 360" stroke="#ab9c77" strokeWidth="3.6" fill="none" />}
      </>}
      {place === "garden" && <>
        <Tree x={41} y={367} size={.82} />
        <Tree x={275} y={346} size={.76} autumn />
      </>}
      {place === "woods" && <>
        <Tree x={41} y={342} size={1.02} evergreen />
        <Tree x={274} y={348} size={1.09} evergreen />
      </>}
      {place === "village" && <>
        <House x={66} y={352} size={.8} />
        <House x={255} y={351} size={.9} />
      </>}
    </g>
  );
}

function Pitcher({ x = 160, y = 230, size = 1, tilt = 0 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") rotate(" + tilt + ") scale(" + size + ")"}>
      <path d="M19-12Q45-18 43 1Q43 17 20 14" stroke={lead} strokeWidth="9" fill="none" />
      <path d="M19-12Q45-18 43 1Q43 17 20 14" stroke="#ebba87" strokeWidth="4.3" fill="none" />
      <Glass d="M-23-30H14L10-11Q33 4 24 25Q0 44-23 25Q-36 8-17-12Z" fill="#cc7891" width={3.6} />
      <Glass d="M-26-31-12-35H15L18-26H-22Z" fill="#f3bb8e" width={2.5} />
      <Glass d="M-22-12Q-24 9-7 30L-22 25Q-34 9-22-12Z" fill="#f1a68b" width={2.4} />
      <path d="M-27 15Q0 28 24 14" stroke={lead} strokeWidth="2.4" fill="none" />
    </g>
  );
}

function Ribbon({ d = "", color = "#8cced7", width = 10 }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={lead} strokeWidth={width + 4.1} />
      <path d={d} stroke={color} strokeWidth={width} />
      <path d={d} stroke="#fff1d9" strokeWidth={width * .19} opacity=".73" />
    </g>
  );
}

function Wings({ x = 160, y = 219, size = 1, dark = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      {[-1, 1].map((side) => (
        <g key={side} transform={"scale(" + side + " 1)"}>
          <Glass d="M8 45Q23-56 96-82Q116-88 126-72Q94-56 94-35L115-43 113-21 89-8 107-11 92 9 66 14 76 22Q55 46 8 45Z" fill={dark ? "#6c456b" : "#c7c4e0"} width={3.9} />
          <Glass d="M16 40Q34-36 113-73Q83-50 72-23L99-33 69-4 91-10Q61 19 46 23Z" fill={dark ? "#a35a80" : "#efdbdf"} width={2.5} />
        </g>
      ))}
    </g>
  );
}

function Chain({ x = 160, y = 334, count = 6, open = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      {Array.from({ length: count }, (_, index) => {
        const offset = (index - (count - 1) / 2) * 18;
        return (
          <g key={index} transform={"translate(" + offset + " " + (28 - Math.abs(offset) * .4) + ") rotate(" + (index % 2 ? -17 : 27) + ")"}>
            {open && index === Math.floor(count / 2)
              ? <path d="M7 8H0Q-11 8-11 0Q-11-8 0-8H6" stroke="#efb582" strokeWidth="5" fill="none" />
              : <ellipse rx="12" ry="7.5" fill="none" stroke="#dca184" strokeWidth="4.4" />}
          </g>
        );
      })}
    </g>
  );
}

function GemWindow({ x = 160, y = 216, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-58 92V-25Q-58-68 0-100Q58-68 58-25V92Z" fill="#785388" width={5} />
      <Glass d="M-48 82V-24Q-48-61 0-87Q48-61 48-24V82Z" fill="#dba687" width={3.2} />
      <Glass d="M-39 71V-25Q-39-50 0-74Q39-50 39-25V71Z" fill="#a173a2" width={3} />
      <path d="M0-70V72M-39 0H39M-39 45H39" fill="none" stroke={lead} strokeWidth="2.5" />
    </g>
  );
}

function Bridge({ x = 160, y = 359, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-142-20Q0-67 142-20V20H88Q0-47-88 20H-142Z" fill="#a48ca2" width={4.1} />
      <path d="M-142-14Q0-56 142-14M-105-30-96 13M-64-42-54-5M-21-47-17-12M23-47 16-12M66-42 56-5M109-30 97 13" stroke={lead} strokeWidth="2.5" fill="none" />
    </g>
  );
}

function WindowTracery({ colors = scenery.dawn }) {
  return (
    <g>
      <path d="M8 330V144Q8 69 160 9Q312 69 312 144V330" fill="none" stroke={colors[4]} strokeWidth="1.15" opacity=".79" />
      <path d="M28 173V150Q28 86 160 32Q292 86 292 150V173" fill="none" stroke={colors[4]} strokeWidth="1.25" opacity=".77" />
      {[-1, 1].map((side) => (
        <g key={side} transform={"translate(160 0) scale(" + side + " 1)"}>
          <path d="M138 134Q141 177 140 216Q131 250 141 285Q147 329 136 369Q130 399 112 418" fill="none" stroke={lead} strokeWidth="3.8" />
          <path d="M138 134Q141 177 140 216Q131 250 141 285Q147 329 136 369Q130 399 112 418" fill="none" stroke={colors[3]} strokeWidth="1.5" />
          {[175, 235, 296, 356].map((y, index) => (
            <g key={y} transform={"translate(140 " + y + ")"}>
              <Glass d="M0 0Q-13-7-11-24Q0-18 0 0ZM0 4Q11-5 10-19Q0-14 0 4Z" fill={colors[index % 2 ? 3 : 2]} width={1.5} />
              <path d="M-7-17-2-6M6-12 2-4" stroke={colors[4]} strokeWidth="1.1" opacity=".68" />
              <circle cy="5" r="2.3" fill={colors[4]} stroke={lead} strokeWidth="1.1" />
            </g>
          ))}
          <path d="M124 52l4-6 4 6-4 6Zm19 31 5-8 5 8-5 8Z" fill={colors[4]} stroke={lead} strokeWidth="1.7" />
        </g>
      ))}
    </g>
  );
}

function ChapelArch({ colors = scenery.dawn }) {
  const onArch = (inset = 0, t = 0) => {
    const base = 18 + inset;
    const end = 160;
    return [base + (end - base) * t * t, (149 + inset) * (1 - t) ** 2 + 2 * (74 + inset) * t * (1 - t) + (18 + inset) * t * t];
  };
  const coord = (point = [0, 0]) => point.map((value) => value.toFixed(2)).join(",");
  return (
    <>
      {[-1, 1].map((side) => (
        <g key={side} transform={side < 0 ? "translate(320 0) scale(-1 1)" : undefined}>
          {Array.from({ length: 14 }, (_, index) => {
            const t = index / 14;
            const next = (index + 1) / 14;
            const outline = "M" + coord(onArch(0, t)) + "L" + coord(onArch(0, next)) +
              "L" + coord(onArch(9, next)) + "L" + coord(onArch(9, t)) + "Z";
            return <Glass key={index} d={outline} fill={index % 4 === 0 ? colors[4] : index % 2 ? colors[3] : colors[2]} width={1.65} />;
          })}
          <path d="M17 382V146H27V382M17 148H27M17 185H27M17 236H27M17 290H27M17 340H27" stroke={lead} strokeWidth="2.2" fill={colors[1]} />
          <path d="M20 378V153M24 378V153" fill="none" stroke={colors[3]} strokeWidth="1.1" opacity=".75" />
          <Glass d="M12 150H32L29 157H15ZM14 375H31L34 385H11Z" fill={colors[3]} width={1.7} />
        </g>
      ))}
      <Glass d="M160 19 166 29 160 40 154 29Z" fill={colors[4]} width={1.8} />
    </>
  );
}

function GroundGlass({ land = "field", colors = scenery.dawn }) {
  if (land === "river" || land === "shore" || land === "harbor") return (
    <g fill="none" strokeLinecap="round">
      <path d="M4 417Q55 391 115 398Q92 412 58 421M168 435Q209 403 238 412Q264 417 314 384M18 446Q59 433 104 435M241 438q36-16 65-14" stroke="#223854" strokeWidth="3.2" />
      <path d="M5 416Q59 395 114 400M172 434Q206 411 233 414M245 437q37-15 59-13" stroke="#b2cfd7" strokeWidth="1.45" opacity=".8" />
    </g>
  );
  if (land === "hall" || land === "room" || land === "forge") return (
    <g>
      {Array.from({ length: 7 }, (_, index) => {
        const x = 23 + index * 45.5;
        return <Glass key={index} d={"M" + x + " 403l19 11-19 12-19-12Z"} fill={colors[index % 2 ? 1 : 3]} width={1.8} />;
      })}
      <path d="M0 402H320M0 427H320" stroke={lead} strokeWidth="1.9" />
    </g>
  );
  return (
    <g>
      <Glass d="M0 428Q42 403 78 410L116 397 164 418 197 408 251 412 270 402 320 412V456H0Z" fill="#3e6273" width={2.6} />
      <Glass d="M0 428 78 410 69 443 12 451ZM78 410 116 397 164 418 117 445 69 443ZM164 418 197 408 251 412 225 442 176 447ZM251 412 270 402 320 412 299 444 225 442Z"
        fill={colors[1]} width={2.15} />
      <path d="M39 432 69 422M103 419l20-9m71 19 32-8m43 12 20-13" stroke={colors[3]} strokeWidth="1.3" opacity=".8" strokeLinecap="round" />
    </g>
  );
}

function BorderFoliage() {
  return (
    <g>
      {[-1, 1].map((side, index) => (
        <g key={side} transform={side < 0 ? "translate(320 0) scale(-1 1)" : undefined}>
          <path d="M24 439Q42 409 49 397Q55 386 63 381M38 429Q49 426 68 422M35 418Q30 408 30 401" fill="none" stroke={lead} strokeWidth="4.5" />
          <path d="M24 439Q42 409 49 397Q55 386 63 381M38 429Q49 426 68 422M35 418Q30 408 30 401" fill="none" stroke="#91ad9b" strokeWidth="1.6" />
          <Glass d="M39 416Q34 403 18 404Q24 415 39 416ZM45 414Q58 404 67 406Q63 417 45 414ZM56 391Q42 388 44 376Q54 378 56 391Z" fill="#668d87" width={1.6} />
          <Flower x={29} y={399} hue={index ? 2 : 4} size={.65} count={6} />
          <Flower x={64} y={381} hue={index ? 3 : 1} size={.57} count={7} />
          <Flower x={69} y={422} hue={index ? 4 : 0} size={.67} count={5} />
          <Flower x={44} y={433} hue={index ? 1 : 3} size={.52} count={6} />
        </g>
      ))}
    </g>
  );
}

const frameMetals = [
  ["#8d6876", "#e2b68c", "#ffe0a9"],
  ["#985961", "#e9a17b", "#ffd69f"],
  ["#5a828e", "#b0cbbe", "#f4dfa8"],
  ["#746f98", "#b9b8d3", "#e7dfeb"],
  ["#7f815b", "#c9b782", "#f2da9b"],
];

function FramingStone({ suit = 0 }) {
  const [shadow, inlay, glint] = frameMetals[suit];
  return (
    <g>
      {[-1, 1].map((side) => (
        <g key={side} transform={side < 0 ? "translate(320 0) scale(-1 1)" : undefined}>
          <Glass d="M5 142Q7 126 24 126L37 143 31 157 28 382 38 407 34 424H5Z" fill="#2e2947" width={2.4} />
          <Glass d="M8 143 18 132 26 147 21 367 28 397 17 411 9 401Z" fill={shadow} width={1.7} />
          <Glass d="M15 159 20 156 17 371 22 393 17 398 12 381Z" fill={inlay} width={1.3} />
          <Glass d="M5 151H34L29 161H5ZM6 374H30L34 390H5Z" fill={shadow} width={1.65} />
          <path d="M7 155H29M7 380H28M12 176 10 353" fill="none" stroke={glint} strokeWidth="1.15" opacity=".8" />
          {[179, 243, 311].map((y, index) => (
            <g key={y} transform={"translate(22 " + y + ")"}>
              <Glass d="M0-12 9 0 0 12-8 0Z" fill={index === 1 ? glint : inlay} width={1.6} />
              <path d="M0-8 4 0 0 8-3 0Z" fill={shadow} stroke={lead} strokeWidth="1" />
            </g>
          ))}
        </g>
      ))}
      <path d="M29 100Q64 47 160 11Q256 47 291 100M42 113Q70 64 160 28Q250 64 278 113"
        stroke={lead} strokeWidth="4.1" fill="none" opacity=".95" />
      <path d="M29 100Q64 47 160 11Q256 47 291 100M42 113Q70 64 160 28Q250 64 278 113"
        stroke={inlay} strokeWidth="1.35" fill="none" />
      <Glass d="M154 29 160 19 166 29 160 42Z" fill={glint} width={1.8} />
    </g>
  );
}

function HorizonInlay({ land = "field", colors = scenery.dawn }) {
  const sea = ["shore", "river", "harbor"].includes(land);
  const indoors = ["hall", "room", "forge"].includes(land);
  if (sea) return (
    <g>
      <Glass d="M3 342Q63 319 129 345Q196 361 316 329L317 339Q202 374 130 353Q82 335 3 355Z" fill="#7498ac" width={1.75} />
      <Glass d="M9 377Q54 369 91 373L131 382 96 384Q53 374 9 391ZM181 399Q247 359 305 362L307 375Q258 371 217 395L181 405Z" fill="#557d98" width={1.65} />
      <path d="M14 357q47-17 82-12m54 27q34 6 73-4m12 35q39-17 72-16M102 410q34-5 63 2" fill="none" stroke="#c6d6d6" strokeWidth="1.4" opacity=".86" />
    </g>
  );
  if (indoors) return (
    <g opacity=".85">
      <path d="M73 318v-85q0-67 87-111 86 44 86 111v85" stroke={lead} strokeWidth="4" fill="none" />
      <path d="M73 318v-85q0-67 87-111 86 44 86 111v85" stroke={colors[3]} strokeWidth="1.25" fill="none" />
      <path d="M26 345 90 351 160 345 229 351 294 345M30 366l16-8m32 13 20-12m110 8 17 9m38-12 17 9" stroke={colors[4]} strokeWidth="1.2" fill="none" opacity=".55" />
    </g>
  );
  return (
    <g>
      <Glass d="M4 297Q54 269 87 279Q117 286 145 301L118 307Q82 291 56 298L4 321Z" fill={colors[2]} width={1.85} />
      <Glass d="M177 300Q213 278 241 286Q269 286 318 264V284Q270 305 241 302Q212 304 185 324Z" fill={colors[2]} width={1.7} />
      <path d="M23 309q28-11 52-10m120 16q33-15 61-12m18-9q22-6 36-13" fill="none" stroke={colors[3]} strokeWidth="1.45" opacity=".8" />
    </g>
  );
}

function WindowLight({ mood = "sun", land = "field", cardId = 0, colors = scenery.dawn }) {
  if (mood !== "sun") return <Sky mood={mood} color={colors[4]} />;
  const indoor = ["hall", "room", "forge"].includes(land);
  const coast = ["shore", "river", "harbor", "cliff"].includes(land);
  const side = cardId % 2 ? 1 : -1;
  const x = indoor ? 160 : 160 + side * (coast ? 45 : 24 + (cardId % 3) * 9);
  const y = indoor ? 111 : coast ? 148 : 117 + (cardId % 4) * 8;
  const radius = indoor ? 34 : 31 + (cardId % 4) * 3;
  return (
    <g>
      <path d={"M160 38Q" + (x - 65) + " " + (y - 12) + " " + x + " " + y +
        "Q" + (x + 53) + " " + (y - 22) + " 160 38Z"} fill={colors[4]} opacity=".12" />
      <Sky x={x} y={y} radius={radius} color={coast ? "#f5d6ae" : "#f4cb94"} />
      {[[-1, 23], [1, 39]].map(([direction, distance]) => (
        <Glass key={direction} d={"M" + (x + direction * (radius + distance)) + " " + (y - 19) +
          "l3-6 3 6-3 6Z"} fill={colors[4]} width={1.3} />
      ))}
    </g>
  );
}

function Story({ colors = scenery.dawn, land = "field", sky = "sun", drawing = <g />, framing = [1, 160, 370, 0, 0], suit = 0, cardId = 0 }) {
  const accent = colors[3];
  const [zoom, pivotX, pivotY, shiftX, shiftY] = framing;
  const frame = "translate(" + (pivotX + shiftX) + " " + (pivotY + shiftY) + ") scale(" + zoom + ") translate(" + (-pivotX) + " " + (-pivotY) + ")";
  return (
    <svg className="tarot-art block h-full w-full" viewBox="0 0 320 456" aria-hidden="true">
      <rect width="320" height="456" fill={lead} />
      <g className="window-panes" stroke={lead} strokeWidth="1.65" strokeLinejoin="round">
        {glassBands.map((outline, band) => <path key={band} d={outline} fill={colors[band]} />)}
      </g>
      <path d={facetHighlights} stroke={colors[4]} fill="none" strokeWidth="1.15" opacity=".23" strokeLinecap="round" />
      {sky !== "rainbow" && <WindowLight mood={sky} land={land} colors={colors} cardId={cardId} />}
      <Landscape place={land} tint={colors} />
      <HorizonInlay land={land} colors={colors} />
      <GroundGlass land={land} colors={colors} />
      <ChapelArch colors={colors} />
      <path d="M11 103V15H70M250 15H309V103M11 386V444H67M253 444H309V386" fill="none" stroke={colors[4]} strokeWidth="1.4" opacity=".86" />
      <WindowTracery colors={colors} />
      <FramingStone suit={suit} />
      <Flower x={32} y={47} size={.96} hue={1} count={8} ring />
      <Flower x={288} y={47} size={.96} hue={3} count={8} ring />
      <g className="scene-art" transform={frame}>
        {sky === "rainbow" && <Sky mood="rainbow" />}
        {drawing}
      </g>
      <BorderFoliage />
      <path d="M15 434Q84 407 160 434Q238 407 305 434" fill="none" stroke={lead} strokeWidth="3.9" />
      <path d="M15 434Q84 407 160 434Q238 407 305 434" fill="none" stroke={accent} strokeWidth="1.35" />
    </svg>
  );
}


function Bird({ x = 160, y = 170, size = 1, flight = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      {flight ? <Glass d="M-42-12Q-17-16 0-1Q18-17 42-12Q29-3 20 10L4 8-3 17-10 10-23 6Z" fill="#eddee5" width={3} />
        : <Glass d="M-31 25-14 4Q-23-13-3-23Q4-31 15-23L19-14 28-11 18-6 12 10-3 17-16 33Z" fill="#ebc48f" width={3.1} />}
      <path d={flight ? "M-13 4 0 0 13 4" : "M-11 3Q-2-8 9-12M13-18h2"} stroke={lead} strokeWidth="2.1" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Flag({ x = 160, y = 358, size = 1, color = "#c35d75" }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-5 0V-128L0-135 5-128V0Z" fill="#d8b58a" width={3} />
      <Glass d="M5-122Q27-140 53-120L76-118 62-102 76-87Q50-77 22-98L5-87Z" fill={color} width={3.5} />
      <path d="M35-118 38-108 48-106 39-102 37-92 33-101 23-104 33-108Z" fill="#f9d89c" stroke={lead} strokeWidth="1.8" />
    </g>
  );
}

function Bed({ x = 160, y = 360, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-94 16V-54H-80V-24H84V-38H98V16H84V4H-80V16Z" fill="#915d75" width={3.6} />
      <Glass d="M-80-24Q-59-44-33-30L-23-14-80-8Z" fill="#d7d4e9" width={3} />
      <Glass d="M-44-15Q27-36 83-24V0H-59Z" fill="#90639a" width={3} />
      <path d="M-16-20-28-1M27-24 14-3M68-24 62-2" stroke={lead} strokeWidth="2.3" />
    </g>
  );
}

function TeamHorse({ x = 160, y = 353, size = 1, face = 1, dark = false }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + face * size + " " + size + ")"}>
      <Glass d="M-47 31Q-33 12-33-12L-39-41Q-31-62-14-66L-11-87 4-73 19-86 18-64 28-45 44-34Q54-25 43-15L25-16 11-27Q0-17 6-4L22 33Z"
        fill={dark ? "#6c6086" : "#ddd3e0"} width={4.6} />
      <Glass d="M-44 29Q-34 11-34-12L-39-41Q-31-62-14-66L-5-62Q-23-38-17-20L-21 32Z"
        fill={dark ? "#3d325f" : "#a09ab8"} width={3.1} />
      <Glass d="M4-63 16-62 28-45 44-34 48-25 43-15 25-16 11-27 4-40Z"
        fill={dark ? "#a899ba" : "#f3dfde"} width={2.8} />
      <path d="M13-51q5-2 9 2m10 18 8-4M0-61Q-1-39 18-28L34-20" fill="none" stroke={lead} strokeWidth="3.4" strokeLinecap="round" />
      <Glass d="M-24 7Q-5-8 11 10L20 29H-37Z" fill="#a66379" width={3.2} />
    </g>
  );
}

function KnightInScene({ group = 1 }) {
  return (
    <g transform="translate(-43 -71) scale(1.26)">
      <MountedKnight group={group} tint={minorSuits[group - 1].panes} />
    </g>
  );
}

const arcanaScenes = [
  { framing: [1.27, 138, 342, 8, 14], colors: scenery.dawn, land: "cliff", sky: "sun", drawing: <>
    <Bird x={245} y={173} size={.56} flight />
    <path d="M96 295 209 191" stroke={lead} strokeWidth="9" strokeLinecap="round" />
    <path d="M96 295 209 191" stroke="#e7b58b" strokeWidth="4.5" strokeLinecap="round" />
    <Glass d="M196 204Q217 200 222 217Q219 241 201 239Q189 223 196 204Z" fill="#a866a5" width={3.4} />
    <Person x={126} y={343} size={1.25} wear="gold" pose="walk" hat="cap" />
    <Animal x={67} y={350} size={.55} color="#e7d3bc" />
    <Bloom x={180} y={343} size={.54} hue={0} />
  </> },
  { framing: [1.24, 154, 355, 0, 12], colors: scenery.rose, land: "hall", sky: "stars", drawing: <>
    <Ribbon d="M97 129C76 88 126 90 160 123S239 157 228 118 190 91 160 123 87 155 97 129Z" color="#efbc98" width={5} />
    <Person x={148} y={352} size={1.4} wear="coral" pose="point" tone={2} />
    <Prop group={1} x={239} y={147} size={.91} tilt={10} />
    <WorkTable x={159} y={366} size={1.41} cloth />
    <Props group={2} points={[[111, 289, .68]]} />
    <Prop group={3} x={180} y={307} size={.9} tilt={84} />
    <Prop group={4} x={226} y={299} size={.54} />
    <Prop group={1} x={135} y={320} size={.76} tilt={82} />
  </> },
  null,
  { framing: [1.13, 158, 390, 0, 6], colors: scenery.grove, land: "garden", sky: "sun", drawing: <>
    <Seat x={160} y={384} size={1.54} />
    <Person x={160} y={391} size={1.83} wear="plum" pose="seated" hat="flowers" eyes="closed" tone={1} dress />
    <Heart x={161} y={266} size={.25} />
    <Bloom x={78} y={374} size={1.31} hue={0} /><Bloom x={109} y={398} size={1.17} hue={3} />
    <Bloom x={222} y={386} size={1.28} hue={4} /><Bloom x={252} y={368} size={1.07} hue={0} />
    <Glass d="M128 372Q160 358 195 372L184 397Q158 407 138 396Z" fill="#b77564" width={3.1} />
    {[[138, 371], [161, 369], [184, 373]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="8" fill="#f5a178" stroke={lead} strokeWidth="2.4" />)}
  </> },
  { framing: [1.1, 161, 386, 0, 7], colors: scenery.ember, land: "hall", sky: "none", drawing: <>
    <House x={54} y={335} size={.55} tower /><House x={266} y={335} size={.55} tower />
    <Seat x={160} y={380} size={1.57} />
    <Person x={161} y={384} size={1.78} wear="coral" pose="seated" hat="crown" tone={3} beard dress />
    <Prop group={1} x={210} y={271} size={1.16} />
    <Glass d="M111 358 143 360 138 382 126 390 113 378Z" fill="#f2bb84" width={4} />
  </> },
  { framing: [1.16, 160, 357, 0, 9], colors: scenery.chapel, land: "hall", sky: "none", drawing: <>
    <GemWindow x={160} y={198} size={1.04} />
    <Person x={159} y={339} size={1.25} wear="ivory" pose="point" hat="mitre" tone={3} dress />
    <Person x={77} y={381} size={.95} wear="teal" pose="kneel" tone={2} />
    <Person x={244} y={381} size={.95} wear="plum" pose="kneel" face={-1} tone={1} />
    <Book x={153} y={323} size={.79} />
  </> },
  { framing: [1.08, 160, 370, 0, 8], colors: scenery.rose, land: "garden", sky: "sun", drawing: <>
    <Ribbon d="M55 223Q88 157 160 166Q244 158 266 219" color="#d9b483" width={5} />
    <Heart x={160} y={180} size={.74} />
    <Person x={90} y={377} size={1.27} wear="coral" pose="offer" tone={1} dress />
    <Person x={230} y={377} size={1.27} wear="indigo" pose="offer" face={-1} tone={3} />
    <Bloom x={159} y={389} size={1.15} hue={4} /><Bloom x={140} y={404} size={.62} hue={0} />
  </> },
  { framing: [1.11, 157, 352, 0, 14], colors: scenery.frost, land: "path", sky: "stars", drawing: <>
    <Glass d="M74 276H241L218 346H95Z" fill="#874b67" width={4.8} />
    <Glass d="M88 263H225L242 285H73Z" fill="#e6b797" width={3.3} />
    <Wheel x={103} y={351} size={.64} /><Wheel x={225} y={351} size={.64} />
    <Person x={163} y={300} size={1.07} wear="indigo" pose="hold" hat="crown" />
    <TeamHorse x={102} y={363} size={1.04} face={-1} dark />
    <TeamHorse x={207} y={363} size={1.04} />
    <path d="M158 229Q129 280 78 324M166 229Q194 283 244 323" fill="none" stroke="#e7c394" strokeWidth="3" />
  </> },
  { framing: [1.17, 150, 359, 0, 10], colors: scenery.gold, land: "field", sky: "sun", drawing: <>
    <Lion x={207} y={365} size={1.13} face={-1} />
    <Person x={88} y={354} size={1.26} wear="ivory" pose="bend" tone={2} dress />
    <Ribbon d="M99 164C74 150 78 129 101 140S134 168 151 153 151 130 134 140 113 155 99 164Z" color="#fbd49e" width={4.4} />
    <Bloom x={58} y={390} size={.83} hue={0} /><Bloom x={259} y={379} size={1.14} hue={3} />
  </> },
  { framing: [1.28, 143, 340, 10, 16], colors: scenery.moon, land: "cliff", sky: "moon", drawing: <>
    <Tree x={264} y={348} size={.72} evergreen />
    <Person x={108} y={345} size={1.43} wear="dusk" pose="offer" hat="hood" tone={3} beard dress />
    <Lantern x={199} y={244} size={.92} />
    <Prop group={1} x={61} y={304} size={1.28} tilt={-8} />
    <Glass d="M42 368 78 360 101 377 35 382Z" fill="#c0b9cf" width={2.6} />
  </> },
  { framing: [1.19, 160, 245, 0, 13], colors: scenery.chapel, land: "field", sky: "stars", drawing: <>
    <Tree x={56} y={319} size={.88} />
    <Tree x={260} y={315} size={.91} autumn />
    <Wheel x={160} y={239} size={1.63} ornate />
    <path d="M53 213Q61 152 126 130L117 145M266 267Q249 329 191 346L201 331" stroke={lead} strokeWidth="7" fill="none" strokeLinejoin="round" />
    <path d="M53 213Q61 152 126 130L117 145M266 267Q249 329 191 346L201 331" stroke="#efd2a2" strokeWidth="3.6" fill="none" strokeLinejoin="round" />
    <Bloom x={89} y={377} size={1.11} hue={2} /><Bloom x={228} y={379} size={1.1} hue={0} />
  </> },
  { framing: [1.17, 154, 367, 1, 11], colors: scenery.chapel, land: "hall", sky: "none", drawing: <>
    <GemWindow x={160} y={192} size={.94} />
    <Seat x={160} y={379} size={1.1} />
    <Person x={147} y={370} size={1.41} wear="coral" pose="offer" tone={1} hat="crown" dress />
    <Scales x={235} y={249} size={.96} />
    <Prop group={3} x={96} y={286} size={1.4} />
  </> },
  { framing: [1.12, 156, 237, 0, 13], colors: scenery.grove, land: "woods", sky: "none", drawing: <>
    <Glass d="M68 322 68 152 48 120 58 106 83 133Q154 116 223 128L253 115 263 129 235 148 88 156 82 322Z" fill="#936665" width={4.3} />
    <path d="M153 145V204" stroke={lead} strokeWidth="7.6" />
    <path d="M153 145V204" stroke="#e9c08e" strokeWidth="3.4" />
    <circle cx="153" cy="356" r="31" fill="#f4ce8f" stroke={lead} strokeWidth="3" />
    <Person x={153} y={189} size={1.11} angle={180} wear="coral" pose="pray" eyes="closed" />
    <Bloom x={102} y={388} size={.88} hue={0} /><Bloom x={229} y={383} size={.97} hue={2} />
  </> },
  { framing: [1.21, 157, 354, 1, 17], colors: scenery.moon, land: "path", sky: "sun", drawing: <>
    <Glass d="M121 338V233Q123 201 163 169Q210 193 216 233V338Z" fill="#e7a481" width={3.3} />
    <Glass d="M150 337Q174 313 171 284L178 248 206 228Q215 271 211 337Z" fill="#ffe0ad" width={3.1} />
    <Glass d="M108 341V240Q108 184 163 161Q216 183 220 240V341H203V241Q201 199 163 181Q126 198 125 241V341Z" fill="#b5a0bc" width={4.1} />
    <Glass d="M126 333V239Q128 214 155 195V324Z" fill="#745674" width={3.1} />
    <path d="M162 321Q193 300 201 269M165 304Q178 275 178 248" fill="none" stroke="#fff2c4" strokeWidth="2.8" strokeLinecap="round" />
    <Person x={118} y={369} size={1.22} wear="dusk" pose="walk" hat="hood" tone={3} dress />
    <Flag x={229} y={371} size={.75} color="#ad6889" />
    <Bloom x={215} y={297} size={.77} hue={3} />
    <Bloom x={87} y={389} size={1.15} hue={4} />
    <Glass d="M233 196Q213 174 224 158Q242 153 239 178Q253 155 269 162Q275 179 243 200L239 209Z" fill="#f2caa3" width={3} />
  </> },
  { framing: [1.1, 158, 357, 0, 13], colors: scenery.sea, land: "shore", sky: "sun", drawing: <>
    <Wings x={156} y={233} size={.94} />
    <Person x={156} y={367} size={1.32} wear="ivory" pose="hold" tone={3} dress />
    <Ribbon d="M130 257Q154 278 187 283" color="#90d4d4" width={7} />
    <Pitcher x={126} y={248} size={.66} tilt={106} />
    <Pitcher x={193} y={283} size={.66} tilt={-22} />
    <Bloom x={68} y={377} size={.91} hue={1} />
  </> },
  { framing: [1.08, 159, 343, 0, 18], colors: scenery.ember, land: "hall", sky: "none", drawing: <>
    <Wings x={161} y={211} size={1.02} dark />
    <Person x={160} y={320} size={1.31} wear="dusk" pose="guard" tone={2} />
    <Glass d="M140 129Q115 117 120 93Q124 114 150 118L159 128ZM179 129Q205 117 200 93Q194 111 170 118L161 128Z" fill="#e3a098" width={3.3} />
    <Person x={78} y={376} size={.81} wear="indigo" pose="offer" tone={1} />
    <Person x={240} y={377} size={.81} wear="coral" pose="offer" face={-1} />
    <Chain y={324} count={7} open />
  </> },
  { framing: [1.17, 162, 345, 0, 9], colors: scenery.storm, land: "cliff", sky: "storm", drawing: <>
    <House x={150} y={357} size={1.55} tower lit={false} />
    <Glass d="M254 90 191 181 218 174 169 248 184 193 151 204 210 102Z" fill="#ffe2a2" width={4.4} />
    <Glass d="M149 181 137 154 152 146 164 155 176 136 189 146 181 178 166 187Z" fill="#eeb477" width={3.3} />
    <Glass d="M105 219 88 203 79 214 95 236ZM204 257 221 241 235 250 223 274ZM84 276 103 267 109 282 98 296Z" fill="#f29d8d" width={3.4} />
    <path d="M125 209 136 232 123 253 138 269 130 294M171 231 151 253 163 283 146 299" stroke={lead} strokeWidth="4.3" fill="none" />
  </> },
  { framing: [1.21, 149, 355, 6, 11], colors: scenery.sea, land: "shore", sky: "stars", drawing: <>
    <Person x={117} y={370} size={1.37} wear="teal" pose="kneel" tone={1} dress />
    <Ribbon d="M198 288Q229 303 219 330T223 370" width={8.2} />
    <Ribbon d="M158 320Q165 338 155 360T173 397" width={6.2} />
    <Pitcher x={187} y={286} size={.66} tilt={103} />
    <Pitcher x={153} y={318} size={.56} tilt={110} />
    <Bird x={73} y={234} size={.63} flight />
  </> },
  { framing: [1.09, 160, 312, 0, 9], colors: scenery.moon, land: "path", sky: "moon", drawing: <>
    <House x={56} y={333} size={.95} tower lit={false} />
    <House x={265} y={332} size={.9} tower lit={false} />
    <Animal x={103} y={365} size={.72} color="#b8adc9" />
    <Animal x={213} y={364} size={.7} face={-1} color="#ae7a83" />
    <Glass d="M128 400Q163 389 199 399L177 433 149 432Z" fill="#5b82a4" width={3.5} />
    <path d="M137 407Q163 400 184 405M151 420Q164 415 177 419" fill="none" stroke="#d1cad9" strokeWidth="2.6" />
  </> },
  { framing: [1.11, 155, 314, 0, 5], colors: scenery.gold, land: "garden", sky: "none", drawing: <>
    <Sky y={139} radius={63} />
    <Person x={158} y={366} size={1.2} wear="gold" pose="raise" tone={2} />
    <Person x={100} y={380} size={.7} wear="coral" pose="dance" />
    <Animal x={219} y={379} size={.63} color="#ede1d3" />
    {[65, 106, 208, 257].map((x, index) => <Bloom key={x} x={x} y={397 - (index % 2) * 5} size={1.11} hue={3} />)}
  </> },
  { framing: [1.08, 159, 319, 0, 9], colors: scenery.dawn, land: "river", sky: "sun", drawing: <>
    <Wings x={153} y={217} size={.91} />
    <Person x={148} y={269} size={.84} wear="ivory" pose="play" tone={1} />
    <g transform="translate(201 180) rotate(-13)">
      <Glass d="M-24-5H4L37-20V20L4 6H-24Z" fill="#f9c779" width={3.4} />
      <Glass d="M32-15 42-21V21L32 16Z" fill="#fce1b6" width={2.5} />
    </g>
    <path d="M249 169l28-10m-25 19 28 7m-32 2 24 15" stroke="#ffdaa0" strokeWidth="3.2" strokeLinecap="round" />
    <Person x={83} y={380} size={.69} wear="indigo" pose="raise" tone={3} />
    <Person x={159} y={389} size={.74} wear="teal" pose="raise" tone={2} />
    <Person x={242} y={372} size={.7} wear="plum" pose="raise" />
  </> },
  { framing: [1.16, 160, 263, 0, 10], colors: scenery.grove, land: "field", sky: "stars", drawing: <>
    <ellipse cx="160" cy="237" rx="93" ry="126" fill="#376467" stroke={lead} strokeWidth="6" />
    <ellipse cx="160" cy="237" rx="83" ry="114" fill="none" stroke="#dbbd87" strokeWidth="3.4" />
    {Array.from({ length: 16 }, (_, index) => {
      const angle = index * TAU / 16;
      return <Flower key={index} x={160 + 91 * Math.sin(angle)} y={237 - 125 * Math.cos(angle)} size={.8} hue={index % 5} count={6} />;
    })}
    <Person x={158} y={347} size={1.26} wear="plum" pose="dance" tone={2} />
    <Ribbon d="M102 240Q58 264 108 288T222 298Q259 286 249 252" width={7} color="#e5ad9f" />
    <Bird x={65} y={125} size={.46} flight /><Bird x={257} y={123} size={.46} flight />
  </> },
];


function across(y = 230, count = 3, start = 70, end = 250, size = .65) {
  return Array.from({ length: count }, (_, index) => [count === 1 ? (start + end) / 2 : start + index * (end - start) / (count - 1), y, size]);
}

function Curtain({ x = 160, y = 224, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <Glass d="M-105 53-67-26 0-77 67-26 105 53Z" fill="#9f5073" width={4.1} />
      <Glass d="M-67-26 0-77 67-26 50 30-49 30Z" fill="#d98688" width={3} />
      <Glass d="M-41-44 0-77 42-45 38-24 24-19 0-57-23-19-38-24Z" fill="#eac28e" width={2.7} />
      <Glass d="M-34 52-25 1 0-23 24 1 34 52Z" fill="#49365e" width={3.1} />
    </g>
  );
}

function Sprout({ x = 160, y = 347, size = 1 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + size + ")"}>
      <path d="M0 4Q-4-20 5-47" stroke={lead} strokeWidth="6" fill="none" />
      <path d="M0 4Q-4-20 5-47" stroke="#9fc78c" strokeWidth="2.4" fill="none" />
      <Glass d="M1-15Q-21-13-30-38Q-4-38 1-15ZM3-28Q6-49 29-47Q23-31 3-28Z" fill="#95b686" width={3} />
    </g>
  );
}

function Hand({ x = 160, y = 261, size = 1, turn = 0 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") rotate(" + turn + ") scale(" + size + ")"}>
      <Glass d="M-95 25-57-4-26-14-8-31 13-35 36-28 36-19 24-16 13-18 10-13 40-11 49-2 37 9 4 20-33 21-78 45Z" fill="#e8b99c" width={4.3} />
      <Glass d="M-86 33-48 8-19 7 8-2 37-7 48-3 39 7 8 20-33 21-78 45Z" fill="#bf858a" width={3} />
      <Glass d="M-100 29-68 8-53 25-80 47-101 47Z" fill="#c5738f" width={3.1} />
      <path d="M3-14Q-6-14-18-4M19 2 36-4" fill="none" stroke="#794d67" strokeWidth="2.2" />
    </g>
  );
}

function GardenCoins({ points = [[160, 226]] }) {
  return (
    <g>
      <path d="M101 381Q78 288 119 220Q152 169 178 221Q194 246 170 284Q150 321 184 363Q210 384 224 366" fill="none" stroke={lead} strokeWidth="9" />
      <path d="M101 381Q78 288 119 220Q152 169 178 221Q194 246 170 284Q150 321 184 363Q210 384 224 366" fill="none" stroke="#99ba86" strokeWidth="4.2" />
      {points.map(([x, y, size], index) => (
        <g key={index}>
          <Glass d={"M" + x + " " + (y + 11) + "q-28-5-27-24 21 1 27 24q2-23 24-23-2 17-24 23Z"} fill={index % 2 ? "#719b82" : "#a3bd8b"} width={2.4} />
          <Prop group={4} x={x} y={y} size={size ?? .66} />
        </g>
      ))}
    </g>
  );
}

const lookoutPalette = ["#211d40", "#363d67", "#586b99", "#b47b9b", "#f2d5b2"];

function LookoutWand({ x = 48, y = 108, height = 295, lean = 0 }) {
  return (
    <g transform={"translate(" + x + " " + y + ") rotate(" + lean + ")"}>
      <Glass d={"M-6 " + height + " -5 25-9 14 0 0 9 14 5 27 7 " + height + "Z"} fill="#a96851" width={3.1} />
      <Glass d={"M0 14 4 23 3 " + (height - 6) + " 0 " + (height - 2) + " -1 30Z"} fill="#f0c994" width={1.35} />
      <Glass d="M-1 39Q-19 31-20 18Q-4 23-1 39ZM2 52Q20 39 21 26Q5 32 2 52Z" fill="#759a7f" width={1.55} />
      <Glass d="M-4 67H5V77H-4ZM-4 91H5V97H-4Z" fill="#e6ac7c" width={1.3} />
      <path d={"M-3 14-1 6M2 100V" + (height - 14)} fill="none" stroke="#ffdbab" strokeWidth=".9" opacity=".8" />
    </g>
  );
}

function TwoWandsLookout() {
  return (
    <g className="two-wands-lookout">
      <Sky x={229} y={145} radius={31} color="#f4cd91" />
      <Glass d="M169 247 210 219 235 197 250 204 274 183 297 214 320 210V270L265 274Z" fill="#765f8d" width={2.4} />
      <Glass d="M217 216 235 197 247 206 242 215 232 211ZM258 203 274 183 290 205 278 200 271 208Z" fill="#b7a4ba" width={1.65} />
      <Glass d="M181 271Q222 252 258 253Q286 247 320 256V307Q302 327 250 313Z" fill="#40678f" width={2.5} />
      <Glass d="M205 275Q244 264 277 271Q257 277 240 285Q222 283 205 275Z" fill="#9dbac7" width={1.6} />
      <path d="M258 291Q282 284 316 285M250 305Q283 299 307 303M218 268q17-4 31-2" fill="none" stroke="#bdc8d6" strokeWidth="2" opacity=".9" />
      <House x={281} y={251} size={.37} /><House x={308} y={254} size={.28} />
      <Bird x={282} y={163} size={.37} flight />
      <Glass d="M207 299H222V284L243 281V297L262 294V280L282 277V294L300 291V276L320 271V410L269 428 211 400Z" fill="#615477" width={3.1} />
      <Glass d="M208 322Q256 321 320 302V323Q261 345 210 345Z" fill="#9e84a0" width={2.45} />
      <Glass d="M208 348 320 326V349L212 370ZM266 372 319 355V376L274 391Z" fill="#756688" width={2.15} />
      <path d="M245 321v17m48-28v20m-61 24 4 12m47-24v16m20 12v15m-74 2 68-15" stroke="#30243f" strokeWidth="2.2" fill="none" />

      <LookoutWand x={53} y={112} height={299} lean={-2} />
      <LookoutWand x={268} y={172} height={229} lean={6} />
      <Glass d="M246 325l19-8 6 11-21 9ZM244 355l22-8 4 10-22 9Z" fill="#e3ab79" width={1.9} />

      {/* The adult traveler is drawn at the scale of the window, with the horizon off to one side. */}
      <Glass d="M126 151Q111 151 99 174C86 201 89 233 78 268C68 307 71 350 48 397Q72 421 113 418Q142 436 166 424Q201 436 233 414Q252 422 265 405C240 369 236 329 233 291C230 235 213 182 177 160L165 154Z" fill="#43283e" width={4.7} />
      <Glass d="M127 157Q104 167 97 201C89 236 93 269 82 308Q76 370 50 397L73 410Q111 365 109 321Q113 277 123 235Z" fill="#96334d" width={3.4} />
      <Glass d="M121 165Q110 200 111 240Q101 266 103 306Q92 373 73 410L96 420Q126 379 130 329L139 240 147 173Z" fill="#c64c55" width={3.1} />
      <Glass d="M132 183Q125 215 126 249Q115 292 116 336L97 420Q114 416 124 426Q148 381 145 337Q161 278 154 228Z" fill="#ed7c66" width={3.1} />
      <Glass d="M170 156Q197 169 211 204Q229 246 233 290Q231 362 264 405L247 416Q213 363 211 317L183 233Z" fill="#8c324e" width={3.2} />
      <Glass d="M178 175Q197 194 202 225Q217 261 217 310Q214 364 245 416L226 416 205 428Q182 389 180 353Q180 311 167 283L153 208Z" fill="#d55a5c" width={3.05} />
      <Glass d="M154 184 176 189Q179 220 197 247Q189 279 179 298Q167 343 191 425Q159 438 123 425L136 350Q140 319 129 299Q147 258 144 237Z" fill="#42456d" width={3.25} />
      <Glass d="M155 193 167 194 168 235 155 266 165 309 153 345 161 429 144 430 137 426 146 359 144 317 137 299 151 260 145 228Z" fill="#7082ab" width={2.9} />
      <Glass d="M171 279 176 300 168 335 177 367 174 405 181 427 162 431 154 346 164 302Z" fill="#555985" width={2.65} />
      <path d="M109 248Q102 271 99 286M103 327Q96 377 78 402M193 311Q197 363 212 393M123 386l-8 26m54-69 5 25" fill="none" stroke="#ecaa86" strokeWidth="1.65" opacity=".86" strokeLinecap="round" />
      <path d="M82 404Q110 365 116 327M223 401Q212 374 208 338" fill="none" stroke="#ffc499" strokeWidth="1.1" opacity=".82" />

      <Glass d="M108 137Q102 107 118 86Q138 65 165 79Q182 87 186 111Q192 133 205 157L181 157 163 170 133 158 104 164Z" fill="#31304d" width={3.75} />
      <Glass d="M115 98Q133 72 154 81Q143 101 122 114L121 139 104 158 109 133Z" fill="#8b809d" width={2.7} />
      <Glass d="M160 85Q180 90 185 109Q189 142 202 154L184 151 172 137 167 116Z" fill="#5e6184" width={2.45} />
      <Glass d="M132 126Q135 143 125 153Q141 168 161 177Q168 162 175 153Q163 148 166 130Z" fill="#bd7e83" width={2.65} />
      <Glass d="M122 103Q129 89 146 89Q167 92 173 111L175 117 184 126 173 132Q168 147 156 151Q142 146 134 136L125 123Z" fill="#edbfa9" width={2.65} />
      <Glass d="M123 107Q136 104 141 114L139 131Q143 143 156 150Q142 147 134 136L125 123Z" fill="#cf9290" width={1.7} />
      <Glass d="M111 104Q116 79 138 80Q151 76 165 90L171 104Q159 96 153 98Q143 113 133 118L127 128 119 123 121 108Z" fill="#494565" width={2.8} />
      <path d="M117 103Q128 85 146 86M120 113Q132 107 139 100M165 100Q171 106 172 113" fill="none" stroke="#bcb0c5" strokeWidth="1.2" opacity=".92" />
      <path d="M148 112Q154 109 160 112M163 113Q166 111 170 113M148 117Q153 120 159 117M163 118Q167 120 171 117" fill="none" stroke="#553447" strokeWidth="1.55" strokeLinecap="round" />
      <path d="M161 116 163 125 168 125M156 136Q162 138 168 134" fill="none" stroke="#a56870" strokeWidth="1.55" strokeLinecap="round" />
      <Glass d="M127 131 129 135 126 141 123 136Z" fill="#edc689" width={1.25} />
      <Glass d="M123 148Q141 164 153 167Q168 158 175 151L186 161Q170 184 153 191Q134 181 112 160Z" fill="#f1bd84" width={2.8} />
      <Glass d="M119 155Q136 173 153 178Q168 170 179 156L182 162Q167 183 153 188Q133 180 116 162Z" fill="#aa5d6a" width={1.55} />
      <Glass d="M149 174 156 170 162 179 155 189 148 183Z" fill="#f4ca86" width={1.6} />

      <Glass d="M109 176Q101 175 94 185L79 220 64 211 58 222Q65 244 81 250Q97 248 111 222L124 203Z" fill="#bd4f59" width={3.05} />
      <Glass d="M106 182Q96 182 92 200L81 230Q72 231 66 219L62 224Q69 243 79 243Q91 237 106 209Z" fill="#e98668" width={2.15} />
      <Glass d="M65 209 70 217 65 228 58 226 54 218Z" fill="#eab483" width={1.9} />
      <Glass d="M56 207Q47 201 46 206L48 211Q41 213 46 216L50 221 57 224 62 217Z" fill="#efbca1" width={1.9} />
      <path d="M49 207l6 4m-7 3 7 4" stroke="#9f636a" fill="none" strokeWidth="1.1" strokeLinecap="round" />

      <Glass d="M176 171Q191 166 203 182Q218 202 212 222L226 241 214 257Q194 254 181 231Q173 217 171 190Z" fill="#c64c57" width={3.25} />
      <Glass d="M183 176Q197 177 203 194Q211 211 202 225L214 242 209 248Q188 236 185 216L174 190Z" fill="#ee876e" width={2.15} />
      <Glass d="M214 238 226 240 224 254 214 260 207 252Z" fill="#e9b57d" width={1.9} />

      {/* Parchment laid across the stone ledge, with two hand-traced routes. */}
      <Glass d="M119 246 138 231 175 238 192 229 230 239 247 231 242 268 250 306 214 298 192 313 166 303 137 314 113 302Z" fill="#f0cfa0" width={3.1} />
      <Glass d="M120 246 138 232 145 261 137 312 113 302ZM175 239 192 230 201 266 192 313 167 303Z" fill="#ddaf88" width={1.75} />
      <Glass d="M224 240 244 233 241 270 248 304 229 302 218 271Z" fill="#e8bd89" width={1.6} />
      <path d="M130 274Q154 258 164 268Q170 280 187 274Q198 266 220 269M156 291q14-24 19-39m12 28q16 2 32 13" fill="none" stroke="#89617a" strokeWidth="1.9" strokeDasharray="3 3" strokeLinecap="round" />
      <path d="M143 253l5-7 5 7Zm58 36 5-7 5 7Z" fill="#b07b70" stroke="#805d72" strokeWidth="1" />
      <g transform="translate(221 257)">
        <circle r="8" fill="#f8dfa8" stroke="#976976" strokeWidth="1.25" />
        <path d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="#9e6c78" stroke="#805971" strokeWidth=".65" />
      </g>
      <Glass d="M218 243Q225 240 230 245L236 249 232 253 227 250 225 256 219 258 213 253Z" fill="#efbca1" width={1.75} />
      <path d="M222 248l4 5m1-7 4 5M133 307l-5-8m111-4 5 7" stroke="#9b6266" fill="none" strokeWidth="1.1" strokeLinecap="round" />

      <Flower x={39} y={389} hue={1} size={.83} count={7} />
      <Flower x={284} y={391} hue={3} size={.68} count={7} />
    </g>
  );
}

const wandsScenes = [
  { framing: [1.21, 160, 257, 0, 9], colors: scenery.ember, land: "field", sky: "stars", drawing: <>
    <Cloud x={78} y={296} size={.87} /><Hand x={143} y={278} size={1.02} />
    <Prop group={1} x={175} y={234} size={2.64} tilt={13} />
    <Sprout x={191} y={199} size={.83} />
    <Glass d="M168 159Q154 136 181 118Q174 142 193 147Q214 162 199 179Q183 189 171 172Z" fill="#f49b6a" width={4} />
    <Glass d="M180 169Q177 155 190 145Q188 160 199 166Q197 179 185 178Z" fill="#ffdeb0" width={2.8} />
  </> },
  { framing: [1, 160, 370, 0, 0], colors: lookoutPalette, land: "shore", sky: "none", drawing: <TwoWandsLookout /> },
  { framing: [1.23, 143, 332, 3, 15], colors: scenery.gold, land: "shore", sky: "sun", drawing: <>
    <Boat x={225} y={321} size={.62} sail />
    <Person x={96} y={365} size={1.25} wear="plum" pose="point" face={1} tone={1} />
    <Props group={1} points={[[44, 308, 1.26, -7], [148, 325, 1.13, 7], [66, 276, 1.15, -3]]} />
    <Bird x={229} y={183} size={.56} flight />
  </> },
  { framing: [1.1, 160, 340, 0, 10], colors: scenery.rose, land: "garden", sky: "sun", drawing: <>
    <Props group={1} points={[[57, 277, 1.94, -5], [111, 279, 1.86, 4], [208, 279, 1.86, -4], [263, 277, 1.94, 5]]} />
    <path d="M45 209Q103 262 160 222Q220 259 275 208" stroke={lead} strokeWidth="8" fill="none" />
    <path d="M45 209Q103 262 160 222Q220 259 275 208" stroke="#aed29d" strokeWidth="3.6" fill="none" />
    {[[62, 221], [91, 235], [125, 237], [160, 223], [196, 237], [229, 233], [258, 220]].map(([x,y],index) => <Flower key={x} x={x} y={y} hue={index % 5} size={.72} />)}
    <Person x={122} y={384} size={.86} wear="coral" pose="dance" />
    <Person x={204} y={381} size={.89} wear="teal" pose="dance" face={-1} tone={2} />
  </> },
  { framing: [1.12, 157, 350, 0, 8], colors: scenery.ember, land: "field", sky: "none", drawing: <>
    <Person x={70} y={360} size={.92} wear="gold" pose="point" />
    <Person x={120} y={329} size={.76} wear="plum" pose="guard" face={-1} tone={1} />
    <Person x={165} y={355} size={.98} wear="teal" pose="lift" tone={2} />
    <Person x={247} y={368} size={.88} wear="coral" pose="point" face={-1} />
    <Person x={210} y={398} size={1} wear="indigo" pose="guard" face={-1} tone={3} />
    <Props group={1} points={[[116, 237, 1.26, 75], [127, 252, 1.33, -55], [175, 230, 1.48, -13], [202, 253, 1.36, 59], [244, 278, 1.32, 39]]} />
  </> },
  { framing: [1.16, 159, 358, 0, 16], colors: scenery.gold, land: "path", sky: "sun", drawing: <>
    <Person x={71} y={375} size={.79} wear="teal" pose="raise" tone={1} />
    <Person x={230} y={367} size={.75} wear="plum" pose="raise" />
    <Person x={153} y={371} size={1.36} wear="coral" pose="offer" hat="crown" tone={2} />
    <ellipse cx="222" cy="223" rx="24" ry="30" fill="none" stroke={lead} strokeWidth="10" />
    <ellipse cx="222" cy="223" rx="24" ry="30" fill="none" stroke="#bad69e" strokeWidth="5" />
    <Props group={1} points={[[62, 273, .95, -9], [92, 246, .86, 9], [139, 321, .68, -16], [242, 268, .87, 11], [258, 312, .96, 7], [202, 334, .83, 13]]} />
  </> },
  { framing: [1.17, 145, 337, 4, 12], colors: scenery.ember, land: "cliff", sky: "storm", drawing: <>
    <Glass d="M25 345 75 318 155 314 203 348 169 388 38 384Z" fill="#ad8a85" width={4} />
    <Person x={114} y={336} size={1.29} wear="teal" pose="guard" face={-1} tone={2} />
    <Prop group={1} x={161} y={232} size={1.67} tilt={47} />
    <Props group={1} points={[[116, 366, .86, -44], [144, 377, .94, -31], [171, 378, .99, -18], [199, 369, 1.02, 5], [229, 371, .98, 21], [256, 371, .95, 42]]} />
  </> },
  { framing: [1.14, 160, 236, 1, 12], colors: scenery.dawn, land: "river", sky: "none", drawing: <>
    <Bird x={216} y={128} size={.77} flight /><Bird x={258} y={174} size={.51} flight />
    <path d="M30 140 136 230M60 197 148 272M125 130 239 225M108 302 215 388M197 257 281 331" stroke="#f0cba9" strokeWidth="3.8" strokeLinecap="round" opacity=".78" />
    <Props group={1} points={[[89, 160, 1.28, -51], [136, 172, 1.29, -51], [194, 190, 1.23, -51], [104, 222, 1.21, -51], [165, 230, 1.28, -51], [227, 244, 1.24, -51], [137, 283, 1.23, -51], [212, 310, 1.24, -51]]} />
  </> },
  { framing: [1.1, 163, 359, 0, 12], colors: scenery.rose, land: "field", sky: "sun", drawing: <>
    <Props group={1} points={across(277, 8, 45, 272, 1.3).map(([x,y,size],index) => [x,y + index % 2 * 17,size,(index % 3 - 1) * 4])} />
    <Person x={166} y={377} size={1.42} wear="coral" pose="guard" hat="wrap" tone={1} />
    <Prop group={1} x={106} y={291} size={1.61} tilt={-8} />
  </> },
  { framing: [1.26, 164, 364, 0, 12], colors: scenery.ember, land: "village", sky: "sun", drawing: <>
    <Person x={137} y={382} size={1.3} wear="coral" pose="bend" />
    <Props group={1} points={Array.from({length:10}, (_, index) => [135 + index * 8, 259 + index * 4.5, 1.19, 31 + index * 2.3])} />
    <Ribbon d="M139 262Q180 262 210 294" width={5} color="#d9b687" />
  </> },
  { framing: [1.24, 151, 355, 0, 13], colors: scenery.gold, land: "field", sky: "sun", drawing: <>
    <Person x={126} y={373} size={1.42} wear="coral" pose="offer" tone={1} hat="cap" />
    <Prop group={1} x={209} y={259} size={1.98} tilt={7} />
    <Sprout x={222} y={214} size={.67} />
    <Bloom x={72} y={382} hue={0} /><Glass d="M190 388 221 361 258 372 276 403 220 411Z" fill="#9a7890" width={3.7} />
  </> },
  { framing: [1.04, 159, 325, 0, 18], colors: scenery.ember, land: "path", sky: "sun", drawing: <>
    <Flag x={60} y={344} size={.8} />
    <path d="M31 256Q86 236 122 241M27 273Q72 252 98 253M222 388l52-11m-42 24 48-9" stroke="#f4bd9b" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    <KnightInScene group={1} />
  </> },
  { framing: [1.13, 158, 376, 0, 12], colors: scenery.gold, land: "garden", sky: "sun", drawing: <>
    <Seat x={159} y={378} size={1.2} /><Person x={155} y={379} size={1.66} wear="gold" pose="seated" tone={2} hat="crown" dress />
    <Prop group={1} x={220} y={301} size={1.68} /><Bloom x={101} y={332} size={1.23} hue={3} />
    <Animal x={110} y={382} size={.44} color="#5b4667" />
  </> },
  { framing: [1.11, 158, 356, 0, 13], colors: scenery.ember, land: "hall", sky: "sun", drawing: <>
    <Seat x={158} y={355} size={1.29} /><Person x={155} y={352} size={1.44} wear="coral" pose="point" tone={3} hat="crown" beard dress />
    <Prop group={1} x={245} y={188} size={1.15} tilt={13} />
    <Person x={65} y={377} size={.73} wear="teal" pose="offer" tone={2} />
    <Person x={251} y={380} size={.71} wear="ivory" pose="kneel" face={-1} />
    <Flag x={262} y={345} size={.5} />
  </> },
];

const cupsScenes = [
  { framing: [1.22, 156, 259, 3, 5], colors: scenery.sea, land: "river", sky: "sun", drawing: <>
    <Cloud x={77} y={317} size={.84} /><Hand x={137} y={301} size={.94} />
    <Ribbon d="M109 217Q84 256 117 289T119 373M201 218Q232 268 199 299T205 371M160 230Q146 262 163 282T159 374" width={7.1} />
    <Prop group={2} x={160} y={242} size={2.47} />
    <Bird x={162} y={169} size={.67} flight />
  </> },
  { framing: [1.1, 160, 365, 0, 13], colors: scenery.rose, land: "garden", sky: "sun", drawing: <>
    <Heart x={160} y={169} size={.53} />
    <Person x={90} y={375} size={1.22} wear="coral" pose="offer" tone={2} />
    <Person x={229} y={375} size={1.22} wear="teal" pose="offer" face={-1} tone={1} />
    <Props group={2} points={[[143, 245, .77, -13], [178, 244, .77, 13]]} />
    <Bloom x={160} y={394} size={.89} hue={4} />
  </> },
  { framing: [1.05, 160, 350, 0, 9], colors: scenery.dawn, land: "garden", sky: "sun", drawing: <>
    <Person x={72} y={367} size={.99} wear="coral" pose="dance" tone={1} dress />
    <Person x={159} y={358} size={1.13} wear="teal" pose="toast" tone={2} dress />
    <Person x={245} y={366} size={.98} wear="plum" pose="dance" face={-1} dress />
    <Props group={2} points={[[111, 207, .86, -9], [165, 177, .93], [207, 207, .85, 10]]} />
    <Bloom x={110} y={389} hue={4} /><Bloom x={207} y={387} hue={3} />
  </> },
  { framing: [1.17, 148, 356, 0, 8], colors: scenery.grove, land: "field", sky: "none", drawing: <>
    <Tree x={105} y={335} size={1.5} />
    <Seat x={103} y={366} size={.8} tall={false} />
    <Person x={103} y={367} size={1.12} wear="dusk" pose="seated" eyes="closed" />
    <Props group={2} points={across(362,3,110,200,.67)} />
    <Cloud x={252} y={249} size={.58} /><Hand x={227} y={246} size={.63} turn={180} />
    <Prop group={2} x={205} y={211} size={.88} />
  </> },
  { framing: [1.17, 148, 347, 5, 12], colors: scenery.moon, land: "shore", sky: "storm", drawing: <>
    <Bridge x={227} y={330} size={.52} />
    <Person x={130} y={352} size={1.43} wear="dusk" pose="rest" hat="hood" tone={1} eyes="closed" />
    <Props group={2} points={[[58, 372, .81, -109], [102, 403, .7, 96], [155, 396, .77, -110], [217, 360, .73], [255, 346, .74]]} />
    <Ribbon d="M52 369Q54 385 69 390M104 395L91 417" width={3.2} />
  </> },
  { framing: [1.13, 158, 359, 0, 12], colors: scenery.rose, land: "village", sky: "sun", drawing: <>
    <Person x={103} y={363} size={1.14} wear="indigo" pose="offer" tone={2} />
    <Person x={224} y={365} size={.83} wear="coral" pose="offer" face={-1} />
    <Props group={2} points={[[147, 253, .97], ...across(373,5,73,244,.65)]} />
    <Flower x={147} y={226} hue={0} size={.85} />
    {[73,116,158,201,244].map((x,index) => <Flower key={x} x={x} y={355} size={.61} hue={index} />)}
  </> },
  { framing: [1.14, 160, 229, 0, 17], colors: scenery.chapel, land: "cliff", sky: "none", drawing: <>
    <Cloud x={83} y={169} size={.68} /><Cloud x={207} y={148} size={.84} /><Cloud x={228} y={244} size={.8} />
    <Person x={118} y={344} size={1.18} wear="indigo" pose="point" />
    <Props group={2} points={[[80, 152, .66], [131, 122, .67], [188, 149, .68], [244, 132, .71], [123, 211, .67], [190, 209, .68], [251, 213, .69]]} />
    <Flower x={80} y={126} size={.61} hue={4} /><Heart x={186} y={118} size={.24} />
    <path d={starPath} transform="translate(243 103) scale(1.19)" fill="#ffdbab" />
  </> },
  { framing: [1.1, 161, 345, -1, 12], colors: scenery.moon, land: "path", sky: "moon", drawing: <>
    <Person x={222} y={352} size={1.37} wear="coral" pose="walk" hat="hood" tone={2} />
    <Props group={2} points={[...across(328,3,59,142,.62),...across(373,5,44,169,.58)]} />
    <Prop group={1} x={271} y={301} size={1.18} tilt={6} />
  </> },
  { framing: [1.16, 158, 317, 0, 9], colors: scenery.sea, land: "hall", sky: "none", drawing: <>
    <Glass d="M58 227H262V240H58ZM58 281H262V293H58Z" fill="#ae7d83" width={3.2} />
    <Props group={2} points={[...across(204,5,81,238,.64),...across(261,4,92,228,.62)]} />
    <Seat x={158} y={393} size={1.07} tall={false} />
    <Person x={158} y={385} size={1.04} wear="plum" pose="seated" hat="cap" tone={2} />
  </> },
  { framing: [1.08, 160, 301, 0, 13], colors: scenery.sea, land: "shore", sky: "rainbow", drawing: <>
    <House x={250} y={347} size={.57} />
    <Props group={2} points={Array.from({length:10},(_,index) => [53 + index * 23.5, 235 - 95 * Math.sin(index * Math.PI / 9), .52, index * 2.8 - 12])} />
    <Person x={102} y={363} size={1.01} wear="coral" pose="raise" tone={1} />
    <Person x={197} y={363} size={1.01} wear="teal" pose="raise" tone={2} />
    <Person x={152} y={379} size={.65} wear="gold" pose="dance" />
    <Person x={240} y={386} size={.6} wear="plum" pose="dance" face={-1} />
  </> },
  { framing: [1.22, 152, 355, 0, 11], colors: scenery.sea, land: "shore", sky: "sun", drawing: <>
    <Person x={127} y={369} size={1.38} wear="teal" pose="offer" hat="cap" />
    <Prop group={2} x={211} y={224} size={1.34} />
    <Glass d="M183 184Q207 162 229 177L245 164 245 189 229 185Q208 202 183 184Z" fill="#e3a691" width={3.8} />
    <path d="M193 184h3M213 177l-5 12" stroke={lead} strokeWidth="2.3" strokeLinecap="round" />
  </> },
  { framing: [1.04, 160, 322, 0, 18], colors: scenery.sea, land: "river", sky: "sun", drawing: <>
    <Bridge y={378} size={1.02} />
    <KnightInScene group={2} />
    <Flower x={56} y={392} hue={2} size={.76} />
  </> },
  { framing: [1.15, 151, 367, 1, 13], colors: scenery.sea, land: "shore", sky: "moon", drawing: <>
    <Seat x={133} y={372} size={1.24} />
    <Person x={132} y={371} size={1.61} wear="teal" pose="seated" tone={2} hat="crown" dress />
    <Prop group={2} x={186} y={281} size={1.44} />
    <Glass d="M157 247 186 233 214 247 201 255H172Z" fill="#f5cc8d" width={3.4} />
    <path d={starPath} transform="translate(186 224) scale(.88)" fill="#ebcfad" />
    <Bloom x={238} y={399} size={.97} hue={2} />
  </> },
  { framing: [1.12, 156, 358, 0, 13], colors: scenery.sea, land: "river", sky: "sun", drawing: <>
    <Glass d="M68 358 96 330 211 332 255 358 232 387 89 387Z" fill="#a38ca4" width={4} />
    <Seat x={156} y={367} size={1.29} />
    <Person x={152} y={359} size={1.47} wear="indigo" pose="seated" tone={1} hat="crown" beard dress />
    <Prop group={2} x={200} y={277} size={1.38} />
    <Bird x={253} y={192} size={.54} flight /><Boat x={247} y={323} size={.33} sail />
  </> },
];


const swordsScenes = [
  { framing: [1.24, 163, 230, 0, 11], colors: scenery.frost, land: "cliff", sky: "stars", drawing: <>
    <Cloud x={81} y={337} size={.86} /><Hand x={142} y={304} size={1.05} />
    <Prop group={3} x={172} y={236} size={2.47} />
    <Glass d="M135 163 130 133 151 145 172 122 192 144 213 133 208 163 197 174H145Z" fill="#edc082" width={4} />
    <Glass d="M171 144 181 154 171 166 161 154Z" fill="#ec9fa8" width={2.4} />
    <Bird x={240} y={190} size={.62} flight />
  </> },
  { framing: [1.15, 159, 350, 0, 9], colors: scenery.moon, land: "shore", sky: "moon", drawing: <>
    <Seat x={160} y={363} size={1.11} tall={false} />
    <Person x={160} y={361} size={1.34} wear="ivory" pose="seated" eyes="blind" face={-1} tone={1} />
    <Props group={3} points={[[132, 286, 1.56, -59], [185, 287, 1.59, 57]]} />
    <path d="M137 292q22-7 41-19" stroke="#e4b5a0" strokeWidth="8" fill="none" strokeLinecap="round" />
  </> },
  { framing: [1.25, 160, 245, 0, 12], colors: scenery.storm, land: "field", sky: "storm", drawing: <>
    <Heart x={160} y={252} size={1.35} cracked />
    <Props group={3} points={[[115, 235, 1.46, 148], [160, 225, 1.62, 180], [205, 235, 1.46, -148]]} />
    <path d="M132 318l-9 16M173 322l-8 21m32-21-8 15" stroke="#ecadde" strokeWidth="2.2" opacity=".7" fill="none" />
  </> },
  { framing: [1.12, 158, 285, 0, 9], colors: scenery.chapel, land: "hall", sky: "none", drawing: <>
    <GemWindow x={160} y={197} size={.87} />
    <Props group={3} points={across(198,3,111,209,1.09)} />
    <Bed x={160} y={360} size={1.13} />
    <Person x={246} y={330} size={1.03} angle={-88} wear="ivory" pose="pray" tone={3} eyes="closed" />
    <Prop group={3} x={160} y={383} size={1.52} tilt={90} />
  </> },
  { framing: [1.17, 142, 350, 0, 10], colors: scenery.frost, land: "shore", sky: "storm", drawing: <>
    <Person x={221} y={334} size={.57} wear="indigo" pose="walk" tone={2} />
    <Person x={260} y={325} size={.47} wear="ivory" pose="walk" tone={1} />
    <Props group={3} points={[[174, 365, .94, 71], [229, 373, .91, -73]]} />
    <Person x={103} y={367} size={1.37} wear="plum" pose="offer" face={-1} />
    <Props group={3} points={[[82, 258, 1.32, -24], [116, 255, 1.14, -11], [145, 277, 1.16, 18]]} />
  </> },
  { framing: [1.1, 158, 340, 0, 13], colors: scenery.sea, land: "river", sky: "sun", drawing: <>
    <Person x={113} y={341} size={.91} wear="dusk" pose="seated" face={-1} hat="hood" tone={1} />
    <Person x={182} y={346} size={.68} wear="coral" pose="seated" eyes="closed" />
    <Person x={223} y={337} size={.95} wear="teal" pose="hold" tone={2} />
    <path d="M240 247 269 375" stroke={lead} strokeWidth="8" strokeLinecap="round" />
    <path d="M240 247 269 375" stroke="#e9bd93" strokeWidth="4.2" strokeLinecap="round" />
    <Props group={3} points={[[55, 312, .89, -14], [80, 319, .87, -11], [106, 324, .78, -7], [133, 323, .77, -2], [154, 327, .7, 7], [178, 329, .72, 11]]} />
    <Boat x={149} y={353} size={1.14} />
    <Bird x={252} y={174} size={.67} flight />
  </> },
  { framing: [1.15, 158, 355, 0, 10], colors: scenery.dawn, land: "field", sky: "sun", drawing: <>
    <Curtain x={229} y={267} size={.78} />
    <Props group={3} points={[[249, 329, .9, -9], [272, 334, .87, 9]]} />
    <Person x={143} y={376} size={1.29} wear="gold" pose="walk" face={-1} hat="cap" tone={1} />
    <Props group={3} points={Array.from({length:5},(_,index) => [75 + index * 15, 263 + index * 5, 1.16, -39 + index * 7])} />
  </> },
  { framing: [1.08, 160, 335, 0, 13], colors: scenery.storm, land: "path", sky: "storm", drawing: <>
    <Props group={3} points={[[55, 242, 1.09], [87, 223, 1.12, -6], [122, 219, 1.03, -4], [195, 218, 1.1], [229, 223, 1.11, 4], [268, 239, 1.09]]} />
    <Person x={156} y={359} size={1.35} wear="coral" pose="hold" tone={2} eyes="blind" />
    <Ribbon d="M130 262Q154 281 185 272M129 276Q156 290 185 284" width={4.6} color="#eadce5" />
    <Props group={3} points={[[52, 330, 1.23, -8], [268, 335, 1.19, 8]]} />
  </> },
  { framing: [1.15, 156, 348, 0, 12], colors: scenery.moon, land: "room", sky: "none", drawing: <>
    <Props group={3} points={Array.from({length:9},(_,index)=>[109+(index>>1)%2*65,140+17.5*index,.82,index%2 ? -90 : 90])} />
    <Bed x={179} y={369} size={1.04} />
    <Person x={120} y={370} size={1.06} wear="ivory" pose="rest" eyes="closed" tone={1} />
    <Book x={219} y={345} size={.57} />
  </> },
  { framing: [1.11, 155, 337, 0, 10], colors: scenery.dawn, land: "field", sky: "sun", drawing: <>
    <path d="M28 298 290 298" stroke="#f8ba98" strokeWidth="3.7" />
    <Props group={3} points={across(279,10,48,274,.82).map(([x,y,size],index)=>[x,y + (index%3)*9,size,188-(index%3)*8])} />
    <Person x={90} y={367} size={1.14} angle={76} wear="dusk" pose="still" eyes="closed" tone={2} />
    <Bird x={240} y={147} size={.7} flight />
  </> },
  { framing: [1.16, 148, 339, 3, 15], colors: scenery.frost, land: "cliff", sky: "storm", drawing: <>
    <Person x={133} y={341} size={1.38} wear="indigo" pose="offer" hat="cap" tone={1} />
    <Prop group={3} x={209} y={188} size={1.61} tilt={13} />
    <Bird x={86} y={155} size={.58} flight /><Bird x={253} y={159} size={.55} flight />
    <path d="M56 265q50-30 77-29m119 33 37-15m-40 36 36-13" stroke="#c4cbe7" strokeWidth="3.2" fill="none" />
  </> },
  { framing: [1.04, 160, 322, 0, 18], colors: scenery.frost, land: "cliff", sky: "storm", drawing: <>
    <Prop group={3} x={111} y={174} size={1.23} tilt={-37} />
    <path d="M23 278Q74 248 112 251M26 301Q60 280 99 275M228 338l66-24m-58 52 45-16" stroke="#d7daf0" strokeWidth="3.5" fill="none" />
    <KnightInScene group={3} />
  </> },
  { framing: [1.13, 151, 360, 1, 12], colors: scenery.chapel, land: "cliff", sky: "sun", drawing: <>
    <Seat x={145} y={363} size={1.22} />
    <Person x={141} y={363} size={1.51} wear="indigo" pose="offer" tone={2} hat="crown" dress />
    <Prop group={3} x={104} y={248} size={1.72} />
    <Bird x={253} y={160} size={.57} flight />
    <Glass d="M108 371 140 357 204 361 217 393 87 402Z" fill="#a0a4c1" width={3.3} />
  </> },
  { framing: [1.12, 160, 362, 0, 13], colors: scenery.frost, land: "hall", sky: "none", drawing: <>
    <GemWindow x={160} y={175} size={.82} />
    <Seat x={160} y={370} size={1.27} />
    <Person x={161} y={359} size={1.47} wear="dusk" pose="seated" tone={3} hat="crown" beard dress />
    <Prop group={3} x={95} y={259} size={1.66} />
    <WorkTable x={225} y={364} size={.61} /><Scales x={232} y={299} size={.64} />
    <Book x={187} y={333} size={.48} />
  </> },
];

const pentaclesScenes = [
  { framing: [1.25, 162, 265, 0, 7], colors: scenery.grove, land: "garden", sky: "sun", drawing: <>
    <Cloud x={71} y={315} size={.83} /><Hand x={148} y={296} size={1.05} />
    <Prop group={4} x={173} y={224} size={2.31} />
    <Sprout x={128} y={393} size={.83} /><Sprout x={193} y={384} size={.98} />
    <Bloom x={239} y={385} hue={3} size={1.03} />
  </> },
  { framing: [1.17, 157, 345, 0, 14], colors: scenery.dawn, land: "harbor", sky: "sun", drawing: <>
    <Boat x={75} y={330} size={.38} sail /><Boat x={244} y={332} size={.45} sail />
    <Person x={161} y={369} size={1.42} wear="teal" pose="dance" hat="cap" tone={1} />
    <Ribbon d="M96 258C52 223 97 202 158 234S268 248 224 216 170 225 158 234 126 277 96 258Z" color="#abd3a8" width={5.2} />
    <Props group={4} points={[[104, 236, .98], [217, 233, .99]]} />
  </> },
  { framing: [1.12, 158, 350, 0, 11], colors: scenery.chapel, land: "hall", sky: "none", drawing: <>
    <GemWindow x={161} y={214} size={1.2} />
    <Props group={4} points={[[161,143,.66],[132,179,.63],[190,179,.63]]} />
    <Person x={71} y={366} size={.9} wear="gold" pose="point" tone={2} />
    <Person x={234} y={366} size={.87} wear="indigo" pose="offer" face={-1} />
    <Person x={155} y={385} size={.95} wear="ivory" pose="hold" tone={1} />
    <Book x={156} y={304} size={.58} /><Glass d="M48 332 81 324 108 337 94 348H45Z" fill="#b7a2aa" width={3.1} />
  </> },
  { framing: [1.19, 160, 361, 0, 13], colors: scenery.gold, land: "village", sky: "sun", drawing: <>
    <Seat x={160} y={374} size={1.04} tall={false} />
    <Person x={158} y={369} size={1.42} wear="gold" pose="hold" tone={1} />
    <Props group={4} points={[[158,146,.81],[162,259,1.19],[126,372,.85],[193,372,.85]]} />
  </> },
  { framing: [1.12, 164, 344, 0, 13], colors: scenery.moon, land: "snow", sky: "storm", drawing: <>
    <GemWindow x={167} y={211} size={1.35} />
    <Glass d="M106 299 232 299 264 372 75 372Z" fill="#d7b3a2" width={3.1} />
    <Props group={4} points={[[167,133,.59],[136,180,.6],[197,180,.6],[136,230,.6],[197,230,.6]]} />
    <Person x={117} y={381} size={.94} wear="dusk" pose="walk" hat="hood" tone={2} />
    <Person x={200} y={378} size={.87} wear="plum" pose="walk" hat="wrap" tone={1} />
    <Prop group={1} x={235} y={334} size={.88} tilt={7} />
    <path d="M51 288l0 13m-7-6h14m214-24v14m-7-7h14m-39 44v14m-7-7h14" stroke="#e6e1ed" strokeWidth="2.8" />
  </> },
  { framing: [1.15, 158, 354, 0, 14], colors: scenery.grove, land: "hall", sky: "sun", drawing: <>
    <Person x={160} y={349} size={1.24} wear="gold" pose="offer" tone={2} />
    <Scales x={226} y={243} size={.82} />
    <Person x={78} y={389} size={.88} wear="dusk" pose="kneel" tone={1} />
    <Person x={241} y={389} size={.85} wear="ivory" pose="kneel" face={-1} />
    <Props group={4} points={[[66,192,.53],[106,170,.55],[207,158,.56],[248,192,.52],[119,279,.44],[130,306,.44]]} />
  </> },
  { framing: [1.12, 159, 356, 0, 12], colors: scenery.grove, land: "farm", sky: "sun", drawing: <>
    <GardenCoins points={[[92,211,.64],[140,202,.65],[171,231,.62],[108,263,.66],[155,283,.64],[106,321,.63],[170,343,.66]]} />
    <Person x={231} y={374} size={1.22} wear="gold" pose="rest" tone={2} face={-1} hat="cap" />
    <Glass d="M263 254 270 256 250 369 243 368ZM229 370Q243 361 251 370L258 383 233 384Z" fill="#bca4ad" width={3.1} />
    <Sprout x={69} y={390} size={.68} />
  </> },
  { framing: [1.16, 157, 351, 0, 14], colors: scenery.gold, land: "forge", sky: "none", drawing: <>
    <Glass d="M53 144H86V337H53ZM39 154H100V168H39ZM40 325H101V342H40Z" fill="#877086" width={3.2} />
    <Props group={4} points={Array.from({length:7},(_,index)=>[69,153+index*28,.48])} />
    <Person x={168} y={368} size={1.17} wear="gold" pose="bend" tone={1} />
    <WorkTable x={223} y={367} size={.83} />
    <Prop group={4} x={232} y={321} size={.75} />
    <Glass d="M220 272 226 279 210 311 202 308ZM213 258 235 270 227 282 205 271Z" fill="#dcba9d" width={3} />
  </> },
  { framing: [1.1, 162, 353, 0, 12], colors: scenery.grove, land: "garden", sky: "sun", drawing: <>
    <GardenCoins points={[[67,213,.58],[98,185,.64],[141,191,.61],[85,247,.63],[123,238,.65],[88,285,.65],[120,312,.6],[76,326,.61],[114,357,.64]]} />
    <Person x={218} y={377} size={1.35} wear="gold" pose="offer" face={-1} tone={2} />
    <Bird x={150} y={233} size={.65} />
    <Bloom x={239} y={391} size={.94} hue={4} /><Bloom x={270} y={372} size={1.28} hue={3} />
  </> },
  { framing: [1.08, 160, 338, 0, 9], colors: scenery.gold, land: "village", sky: "sun", drawing: <>
    <Glass d="M53 358V245Q53 177 160 132Q267 177 267 245V358H247V245Q247 188 160 152Q73 188 73 245V358Z" fill="#b9897c" width={4.7} />
    <Props group={4} points={[[68,255,.56],[77,219,.55],[99,184,.55],[130,160,.57],[160,148,.58],[190,160,.57],[221,184,.55],[243,219,.55],[252,255,.56],[160,372,.68]]} />
    <Person x={97} y={366} size={.97} wear="dusk" pose="seated" tone={3} />
    <Person x={176} y={368} size={1.02} wear="gold" pose="offer" tone={1} />
    <Person x={225} y={385} size={.66} wear="coral" pose="dance" face={-1} tone={2} />
    <Animal x={83} y={395} size={.4} color="#e7ba93" />
  </> },
  { framing: [1.24, 150, 353, 2, 12], colors: scenery.grove, land: "farm", sky: "sun", drawing: <>
    <Person x={130} y={372} size={1.44} wear="moss" pose="offer" tone={2} hat="cap" />
    <Prop group={4} x={212} y={217} size={1.39} />
    <Sprout x={76} y={379} size={.86} /><Sprout x={234} y={385} size={.89} />
    <Book x={192} y={373} size={.59} />
  </> },
  { framing: [1.04, 159, 325, 0, 18], colors: scenery.grove, land: "farm", sky: "sun", drawing: <>
    <House x={254} y={324} size={.6} />
    <KnightInScene group={4} />
    <Sprout x={61} y={382} size={.77} /><Sprout x={256} y={392} size={.75} />
  </> },
  { framing: [1.13, 150, 370, 2, 10], colors: scenery.grove, land: "garden", sky: "sun", drawing: <>
    <Seat x={158} y={370} size={1.31} />
    <Person x={148} y={373} size={1.67} wear="moss" pose="seated" tone={2} hat="crown" dress />
    <Prop group={4} x={160} y={285} size={1.21} />
    <Glass d="M204 355Q225 348 250 356L246 377 228 386 210 378Z" fill="#bd8470" width={3.1} />
    <Sprout x={229} y={363} size={.84} />
    <Animal x={88} y={386} size={.43} color="#c98e75" />
  </> },
  { framing: [1.13, 160, 365, 0, 13], colors: scenery.gold, land: "garden", sky: "sun", drawing: <>
    <House x={237} y={338} size={.61} tower />
    <Seat x={157} y={370} size={1.31} />
    <Person x={160} y={362} size={1.5} wear="gold" pose="seated" tone={1} hat="crown" beard dress />
    <Prop group={4} x={161} y={284} size={1.2} />
    <Prop group={1} x={218} y={281} size={1.21} />
    <Bloom x={96} y={393} size={1} hue={3} /><Sprout x={235} y={393} size={.69} />
  </> },
];


const suitScenes = [wandsScenes, cupsScenes, swordsScenes, pentaclesScenes];

function CardArtwork({ card = deck[2] }) {
  const scene = card.group ? suitScenes[card.group - 1][card.rank] : arcanaScenes[card.rank];
  return scene ? <Story {...scene} suit={card.group} cardId={card.id} /> : <CardArt />;
}

function useDeviceTilt() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const device = useRef({ x: 0, y: 0, until: 0 });

  useEffect(() => {
    if (!enabled) return;
    const position = device.current;
    const timeout = window.setTimeout(() => {
      setEnabled(false);
      setMessage("ยังรับสัญญาณการเอียงไม่ได้ ลองขยับเมาส์หรือนิ้วบนไพ่");
    }, 2400);

    function followTilt(event = new DeviceOrientationEvent("deviceorientation")) {
      if (event.beta == null || event.gamma == null) return;
      const angle = (screen.orientation?.angle ?? Reflect.get(window, "orientation") ?? 0) * Math.PI / 180;
      const x = event.gamma / 26;
      const y = (event.beta - 34) / 38;
      position.x = clamp(x * Math.cos(angle) + y * Math.sin(angle));
      position.y = clamp(y * Math.cos(angle) - x * Math.sin(angle));
      position.until = performance.now() + 1300;
      window.clearTimeout(timeout);
    }

    window.addEventListener("deviceorientation", followTilt, { passive: true });
    return () => {
      window.removeEventListener("deviceorientation", followTilt);
      window.clearTimeout(timeout);
      position.until = 0;
    };
  }, [enabled]);

  async function toggle() {
    setMessage("");
    if (enabled) {
      setEnabled(false);
      return;
    }
    const orientation = window.DeviceOrientationEvent;
    if (!orientation || !window.isSecureContext) {
      setMessage("อุปกรณ์นี้ยังอ่านการเอียงไม่ได้ ลองขยับเมาส์หรือนิ้วบนไพ่");
      return;
    }
    try {
      const request = Reflect.get(orientation, "requestPermission");
      if (typeof request === "function" && await request.call(orientation) !== "granted") {
        setMessage("ยังไม่ได้รับอนุญาตให้ใช้เซนเซอร์ ลองขยับนิ้วบนไพ่");
        return;
      }
      setEnabled(true);
    } catch {
      setMessage("เปิดเซนเซอร์ไม่ได้ ลองขยับเมาส์หรือนิ้วบนไพ่");
    }
  }

  return { enabled, message, device: device.current, toggle };
}

function HolographicCard({
  card = deck[2], line = "", turns = 0, dim = false, turning = false, flash = false,
  action = () => {}, actionLabel = "", device = { x: 0, y: 0, until: 0 },
}) {
  const node = useRef(new Map());
  const motion = useRef({ x: 0, y: 0, pointerX: 0, pointerY: 0, pointerUntil: 0 });
  const Surface = actionLabel ? "button" : "div";
  const surfaceProps = actionLabel
    ? { onClick: action, "aria-label": actionLabel, "aria-disabled": turning }
    : { role: "img", "aria-label": card.name + " · " + card.thai };

  useEffect(() => {
    const stage = node.current.get("stage");
    const state = motion.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastTime = 0;

    function render(time = 0) {
      const dt = Math.min(64, time - (lastTime || time));
      lastTime = time;
      const idle = !reduce.matches && !dim ? .32 : 0;
      const pointer = time < state.pointerUntil;
      const orientation = time < device.until;
      const x = pointer ? state.pointerX : orientation ? device.x : Math.sin(time / 1750) * idle;
      const y = pointer ? state.pointerY : orientation ? device.y : Math.cos(time / 1750) * idle * .72;
      const settle = reduce.matches ? 1 : 1 - Math.exp(-dt / 85);
      state.x += ((turning ? 0 : x) - state.x) * settle;
      state.y += ((turning ? 0 : y) - state.y) * settle;
      stage.style.setProperty("--rx", reduce.matches ? "0deg" : (-state.y * 12).toFixed(2) + "deg");
      stage.style.setProperty("--ry", reduce.matches ? "0deg" : (state.x * 15).toFixed(2) + "deg");
      stage.style.setProperty("--px", (50 + state.x * 39).toFixed(2) + "%");
      stage.style.setProperty("--py", (50 + state.y * 37).toFixed(2) + "%");
      const sweep = reduce.matches ? 47 : dim ? 42 : time % 7300 / 7300 * 138 - 19;
      stage.style.setProperty("--sweep", (sweep + state.x * 16 - state.y * 11).toFixed(2) + "%");
      frame = window.requestAnimationFrame(render);
    }

    frame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frame);
  }, [device, dim, turning]);

  function trackPointer(clientX = 0, clientY = 0, touch = false) {
    const bounds = node.current.get("stage").getBoundingClientRect();
    const state = motion.current;
    state.pointerX = clamp(2 * (clientX - bounds.left) / bounds.width - 1);
    state.pointerY = clamp(2 * (clientY - bounds.top) / bounds.height - 1);
    state.pointerUntil = performance.now() + (touch ? 1350 : 1650);
  }

  function releasePointer() {
    motion.current.pointerUntil = 0;
  }

  return (
    <div className="card-stage relative" ref={(element) => { node.current.set("stage", element); }}
      data-open={!dim} data-turning={turning} data-flash={flash} data-card-id={card.id}>
      <span className="reveal-beam" aria-hidden="true" />
      <Surface
        className="card-button relative block h-full w-full" {...surfaceProps}
        onPointerDown={(event) => trackPointer(event.clientX, event.clientY, event.pointerType !== "mouse")}
        onPointerMove={(event) => trackPointer(event.clientX, event.clientY, event.pointerType !== "mouse")}
        onPointerUp={(event) => { if (event.pointerType !== "mouse") releasePointer(); }}
        onPointerLeave={releasePointer} onPointerCancel={releasePointer}
      >
        <span className="card-float">
          <span className="card-tilt">
            <span className="card-rotor" style={{ transform: "rotateY(" + turns * 360 + "deg)" }}>
              {Array.from({ length: 7 }, (_, index) => (
                <span className="card-edge" key={index} style={{ transform: "translateZ(" + (-index - 1) + "px)" }} aria-hidden="true" />
              ))}
              <span className="card-back" aria-hidden="true"><CardBack /></span>
              <span className="card-face" aria-hidden="true">
                <span className="glass-window"><CardArtwork card={card} /></span>
                <span className="title-panel">
                  <span className="title-ornament"><i /><b /><i /></span>
                  <span className="card-name" lang="en">{card.name}{card.number && <><b> · </b>{card.number}</>}</span>
                  <span className="prediction" key={turns}>{line && !turning ? line : <span className="prediction-placeholder">✦</span>}</span>
                </span>
                <Foil />
                <span className="reveal-scan" />
              </span>
            </span>
          </span>
        </span>
      </Surface>
    </div>
  );
}

function Orbits() {
  return (
    <svg className="orbits" viewBox="0 0 570 650" fill="none" aria-hidden="true">
      <ellipse cx="285" cy="325" rx="256" ry="268" stroke="#736494" />
      <ellipse cx="285" cy="325" rx="243" ry="255" stroke="#756593" strokeDasharray="1 6" />
      <ellipse cx="285" cy="325" rx="265" ry="182" transform="rotate(-27 285 325)" stroke="#78638d" opacity=".45" />
      <path d="M285 9V641M8 325H562" stroke="#6f5b86" opacity=".42" />
      <path d={starPath} transform="translate(55 207) scale(1.15)" fill="#dfc1f1" />
      <path d={starPath} transform="translate(510 444) scale(.85)" fill="#d9b6e8" />
      <path d={starPath} transform="translate(465 115) scale(.67)" fill="#bdbae8" />
      <path d={starPath} transform="translate(110 535) scale(.5)" fill="#bdbae8" />
      <circle cx="55" cy="207" r="16" stroke="#b09bc3" opacity=".45" />
      <circle cx="510" cy="444" r="12" stroke="#b09bc3" opacity=".4" />
    </svg>
  );
}

function LayoutMark({ index = 0 }) {
  const positions = [
    [[9, 6]],
    [[2, 6], [9, 6], [16, 6]],
    [[9, 1], [4, 8], [14, 8], [4, 15], [14, 15]],
    [[2, 9], [7, 4], [7, 9], [10, 9], [12, 9], [7, 14], [18, 2], [18, 7], [18, 12], [18, 17]],
  ];
  return (
    <svg viewBox="0 0 23 24" fill="none" aria-hidden="true">
      {positions[index].map(([x, y], position) => (
        <rect key={position} x={x} y={y} width={index === 3 ? 3.3 : 5} height={index === 3 ? 4.6 : 7} rx=".7" stroke="currentColor" strokeWidth="1.05" />
      ))}
    </svg>
  );
}

function ArchiveMark() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="10.6" height="14.5" rx="1.7" transform="rotate(-13 10 11)" stroke="currentColor" strokeWidth="1.15" />
      <rect x="8.3" y="4.3" width="10.3" height="14.6" rx="1.7" fill="#1c1327" stroke="currentColor" strokeWidth="1.15" />
      <path d={starPath} transform="translate(13.45 11.6) scale(.38)" fill="currentColor" />
    </svg>
  );
}

function PreviewFace({ card = deck[2] }) {
  return (
    <span className="mini-face" aria-hidden="true">
      <span className="mini-picture"><CardArtwork card={card} /></span>
      <span className="mini-foil" />
      <span className="mini-title" lang="en">{card.name}</span>
    </span>
  );
}

function SpreadTile({
  card = deck[2], index = 0, name = "", opened = false, selected = false,
  reveal = (position = 0) => { void position; }, delay = 0,
}) {
  return (
    <button
      type="button" className={"spread-tile position-" + index} data-revealed={opened} data-chosen={selected}
      aria-pressed={selected}
      aria-label={name + (opened ? " · " + card.thai : " · แตะเพื่อเปิด")}
      onClick={() => reveal(index)}
    >
      <span className="mini-card">
        <span className="mini-turn" style={{ transitionDelay: delay + "ms" }}>
          <span className="mini-back" aria-hidden="true">
            <svg viewBox="0 0 64 100" fill="none">
              <rect x="5" y="5" width="54" height="90" rx="4" stroke="#ada3c9" strokeWidth=".8" />
              <path d="M32 9 54 50 32 91 10 50Z" stroke="#a596c6" opacity=".7" />
              <circle cx="32" cy="50" r="15" stroke="#978bb6" strokeWidth=".8" />
              <path d={starPath} transform="translate(32 50) scale(1.25)" fill="#e7d8ef" opacity=".85" />
              <path d={starPath} transform="translate(32 21) scale(.38)" fill="#e7d8ef" />
              <path d={starPath} transform="translate(32 79) scale(.38)" fill="#e7d8ef" />
            </svg>
          </span>
          {opened && <PreviewFace card={card} />}
        </span>
      </span>
      <span className="slot-label">{name}</span>
    </button>
  );
}

function SpreadBoard({
  spread = spreads[1], cards = deck.slice(0, 0), open = new Set(), focus = -1, batch = false,
  reveal = (position = 0) => { void position; },
}) {
  function tile(index = 0) {
    return (
      <SpreadTile key={index} index={index} name={spread.slots[index][0]} card={cards[index]}
        opened={open.has(index)} selected={focus === index} reveal={reveal}
        delay={batch && open.has(index) ? index * 45 : 0} />
    );
  }

  return (
    <section className="spread-surface" aria-label={spread.name}>
      <div className="spread-caption">
        <span>{spread.name}</span>
        <span className="spread-progress" role="status">{open.size} / {cards.length} ใบเปิดแล้ว</span>
        {focus >= 0 && (
          <button className="reading-jump" type="button" onClick={() => document.getElementById("current-reading")?.focus()}>
            อ่านคำทำนาย
          </button>
        )}
      </div>
      {spread.key === "celtic" ? (
        <div className="celtic-board">
          <div className="celtic-cross">{cards.slice(0, 6).map((_, index) => tile(index))}</div>
          <div className="celtic-staff">{cards.slice(6).map((_, index) => tile(index + 6))}</div>
        </div>
      ) : (
        <div className={"spread-board " + spread.key + "-board"}>{cards.map((_, index) => tile(index))}</div>
      )}
    </section>
  );
}

const collectionNames = ["ไพ่ชุดใหญ่", ...minorSuits.map((suit) => suit.thai)];

function CardInfo({
  card = deck[2], line = "", position = "", prompt = "", inspect = () => {},
}) {
  return (
    <article className="card-info" id="current-reading" tabIndex={-1} aria-live="polite">
      <p className="reading-position">{position || collectionNames[card.group]}</p>
      <h2 lang="en">{card.name}{card.number && " · " + card.number}</h2>
      <p className="card-thai-name">{card.thai}</p>
      {prompt && <p className="position-prompt">{prompt}</p>}
      <p className="reading-line">{line || card.line}</p>
      <p className="reading-meaning">{card.meaning}</p>
      <button className="quiet-button card-inspect" type="button" onClick={inspect}><ArchiveMark /> ดูภาพไพ่เต็มใบ</button>
    </article>
  );
}

function DeckLibrary({ inspect = (id = 2) => { void id; } }) {
  const [filter, setFilter] = useState(0);
  const cards = deck.filter((entry) => entry.group === filter);
  return (
    <main className="deck-library relative mx-auto">
      <header className="collection-heading">
        <p className="arcana-index" lang="en"><span>78</span> The complete deck</p>
        <h1>สำรับไพ่กระจกสี</h1>
      </header>
      <div className="collection-filters" role="group" aria-label="ชุดไพ่">
        {collectionNames.map((name, index) => (
          <button type="button" key={name} onClick={() => setFilter(index)} aria-pressed={filter === index}>
            {name} <span>{index === 0 ? 22 : 14}</span>
          </button>
        ))}
      </div>
      <div className="collection-grid">
        {cards.map((card) => (
          <button key={card.id} className="collection-card" type="button" onClick={() => inspect(card.id)} data-card-id={card.id}>
            <span className="mini-card"><PreviewFace card={card} /></span>
            <span className="collection-label">{card.thai}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default function Page() {
  const [archive, setArchive] = useState(false);
  const [inspection, setInspection] = useState({ id: -1, line: "" });
  const [table, setTable] = useState({ layout: 0, cards: deck.slice(0, 0), open: new Set(), focus: -1, batch: false, revision: 0 });
  const [single, setSingle] = useState({ card: deck[2], line: "", turns: 0, turning: false, flash: false });
  const tilt = useDeviceTilt();
  const dialog = useRef(new Map());
  const draw = useRef({ busy: false, swap: 0, finish: 0, flash: 0 });
  const spread = spreads[table.layout];
  const isSingle = table.layout === 0;
  const allOpened = table.cards.length > 0 && table.open.size === table.cards.length;

  useEffect(() => {
    const pending = draw.current;
    return () => {
      window.clearTimeout(pending.swap);
      window.clearTimeout(pending.finish);
      window.clearTimeout(pending.flash);
    };
  }, []);

  function chooseLayout(layout = 0) {
    if (table.layout === layout) return;
    const cards = layout === 0 ? [] : dealCards(spreads[layout].slots.length);
    setTable((previous) => {
      return { layout, cards, open: new Set(), focus: -1, batch: false, revision: previous.revision + 1 };
    });
  }

  function reshuffle() {
    const cards = dealCards(spread.slots.length);
    setTable((previous) => ({
      ...previous, cards,
      open: new Set(), focus: -1, batch: false, revision: previous.revision + 1,
    }));
  }

  function revealPosition(index = 0) {
    setTable((previous) => ({
      ...previous, open: new Set([...previous.open, index]), focus: index, batch: false,
    }));
  }

  function revealAll() {
    setTable((previous) => ({
      ...previous, open: new Set(previous.cards.map((_, index) => index)),
      focus: previous.focus < 0 ? 0 : previous.focus, batch: true,
    }));
  }

  function drawSingle() {
    const pending = draw.current;
    if (pending.busy) return;
    pending.busy = true;
    window.clearTimeout(pending.flash);
    const [card] = dealCards(1, single.line ? single.card.id : -1);
    const line = card.id === 2 ? readings[Math.floor(Math.random() * readings.length)] : card.line;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setSingle((previous) => ({ ...previous, turns: previous.turns + 1, turning: true, flash: false }));
    pending.swap = window.setTimeout(() => {
      setSingle((previous) => ({ ...previous, card, line }));
    }, reduce ? 0 : 525);
    pending.finish = window.setTimeout(() => {
      pending.busy = false;
      setSingle((previous) => ({ ...previous, turning: false, flash: !reduce }));
      if (!reduce) pending.flash = window.setTimeout(() => setSingle((previous) => ({ ...previous, flash: false })), 1650);
    }, reduce ? 30 : 1080);
  }

  useEffect(() => {
    const element = dialog.current.get("element");
    if (inspection.id >= 0 && !element.open) element.showModal();
  }, [inspection.id]);

  function showCard(id = 2, line = "") {
    setInspection({ id, line });
  }

  function switchView() {
    setArchive((open) => !open);
    window.scrollTo(0, 0);
  }

  const activeCard = isSingle
    ? (single.line && !single.turning ? single.card : null)
    : (table.cards[table.focus] ?? null);
  const activePosition = spread.slots[isSingle ? 0 : table.focus];
  const singleButton = single.turning ? "กำลังเปิดไพ่…" : single.line ? "สุ่มไพ่ใบใหม่" : "เปิดไพ่ 1 ใบ";
  const inspected = deck[inspection.id];
  const inspectionLine = inspection.line || inspected?.line || "";

  return (
    <div className="nocturne relative min-h-svh isolate overflow-hidden" lang="th">
      <style>{styles + studioStyles}</style>
      <div className="night-dust pointer-events-none absolute inset-0" aria-hidden="true">
        {nightDots.map(({ x, y, size, delay, time }, index) => (
          <i key={index} style={{ left: x, top: y, width: size, height: size, animationDelay: delay, animationDuration: time }} />
        ))}
      </div>
      <header className="masthead relative mx-auto flex items-center justify-between">
        <div className="wordmark flex items-center" lang="en"><MoonMark /><span>Arcana Nocturna</span></div>
        <button type="button" className="archive-toggle" onClick={switchView}>
          <ArchiveMark />{archive ? "กลับไปเปิดไพ่" : "ดูสำรับ 78 ใบ"}
        </button>
      </header>

      {archive ? <DeckLibrary inspect={showCard} /> : (
        <main className="reading-room studio relative mx-auto grid" data-mode={spread.key}>
          <section className="introduction studio-intro" aria-labelledby="tarot-title">
            <p className="arcana-index" lang="en"><span>78</span> Holographic Tarot</p>
            <h1 id="tarot-title" lang="en">Stained Glass <span>Tarot</span></h1>
            <fieldset className="spread-picker">
              <legend>เลือกรูปแบบการเปิดไพ่</legend>
              <div className="spread-options">
                {spreads.map((option, index) => (
                  <button type="button" key={option.key} onClick={() => chooseLayout(index)} aria-pressed={table.layout === index}>
                    <LayoutMark index={index} />
                    <span><strong>{option.name}</strong><small>{option.slots.length} ใบ</small></span>
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="spread-description">{spread.description}</p>
          </section>

          <section className="studio-cards relative" aria-label="โต๊ะเปิดไพ่">
            {isSingle ? (
              <div className="card-chamber relative grid place-items-center">
                <div className="card-aura" aria-hidden="true" />
                <Orbits />
                <HolographicCard {...single} device={tilt.device} dim={!single.line || single.turning}
                  action={drawSingle} actionLabel={singleButton} />
              </div>
            ) : (
              <SpreadBoard key={table.revision} spread={spread} cards={table.cards} open={table.open}
                focus={table.focus} batch={table.batch} reveal={revealPosition} />
            )}
          </section>

          <div className="reading-controls studio-controls">
            <div className="draw-actions">
              <button type="button" className="reveal-button inline-flex items-center justify-center"
                aria-disabled={isSingle && single.turning}
                onClick={isSingle ? drawSingle : allOpened ? reshuffle : revealAll}>
                <svg viewBox="-10 -10 20 20" aria-hidden="true"><path d={starPath} fill="currentColor" /></svg>
                {isSingle ? singleButton : allOpened ? "สับไพ่ใหม่" : "เปิดไพ่ทั้งหมด"}
              </button>
              {!isSingle && !allOpened && (
                <button className="quiet-button" type="button" onClick={reshuffle}>สับไพ่ใหม่</button>
              )}
            </div>
            {(isSingle || activeCard) && (
              <button className="sensor-button inline-flex items-center" type="button" onClick={tilt.toggle} aria-pressed={tilt.enabled}>
                <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="7.1" y="4.4" width="8" height="13" rx="1.8" transform="rotate(-24 11 11)" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M3 12.5a8.8 8.8 0 0 0 4 5.2M18.8 9.4A8.6 8.6 0 0 0 15 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {tilt.enabled ? "ปิดการเอียงมือถือ" : "เอียงมือถือให้แสงขยับ"}
              </button>
            )}
            <p className="sensor-message" role="status">{tilt.message}</p>
          </div>

          {activeCard && (
            <div className="studio-result">
              <CardInfo card={activeCard} position={activePosition[0]} prompt={activePosition[1]}
                line={isSingle ? single.line : activeCard.line} inspect={() => showCard(activeCard.id, isSingle ? single.line : activeCard.line)} />
            </div>
          )}
        </main>
      )}

      <dialog className="card-dialog" aria-labelledby="card-dialog-title"
        ref={(element) => { dialog.current.set("element", element); }}
        onClose={() => setInspection({ id: -1, line: "" })}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        {inspected && (
          <div className="dialog-content">
            <button className="dialog-close" type="button" aria-label="ปิดรายละเอียดไพ่"
              onClick={() => dialog.current.get("element").close()}>×</button>
            <div className="dialog-card">
              <HolographicCard card={inspected} line={inspectionLine} device={tilt.device} />
            </div>
            <section className="dialog-reading">
              <p className="reading-position">{collectionNames[inspected.group]}{inspected.group > 0 && " · ธาตุ" + minorSuits[inspected.group - 1].element}</p>
              <h2 id="card-dialog-title" lang="en">{inspected.name}{inspected.number && " · " + inspected.number}</h2>
              <p className="card-thai-name">{inspected.thai}</p>
              <p className="reading-line">{inspectionLine}</p>
              <p className="reading-meaning">{inspected.meaning}</p>
            </section>
          </div>
        )}
      </dialog>
    </div>
  );
}

const studioStyles = `
.nocturne .archive-toggle {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 6px 12px;
  border: 1px solid #b58bce60;
  border-radius: 7px;
  background: #23182dba;
  color: #ead6f1;
  font-size: .87rem;
  cursor: pointer;
}
.archive-toggle svg, .quiet-button svg { width: 19px; height: 19px; flex: none; }
.archive-toggle:hover { border-color: #d5b3e2; background: #382449; }

.studio {
  grid-template-columns: minmax(300px, .87fr) minmax(0, 1.13fr);
  grid-template-rows: auto auto 1fr;
  grid-template-areas: 'intro cards' 'controls cards' 'result cards';
  column-gap: clamp(17px, 4vw, 52px);
  padding-block: clamp(34px, 5vw, 65px) 14px;
}
.studio-intro { align-self: start; padding: 0; }
.studio-intro h1 { font-size: clamp(2.65rem, 4.9vw, 4.62rem); }
.studio-intro .arcana-index { margin-bottom: 12px; }
.spread-picker {
  min-width: 0;
  margin: 25px 0 0;
  padding: 0;
  border: 0;
}
.spread-picker legend {
  margin-bottom: 9px;
  color: #efdff2;
  font-size: .89rem;
  padding: 0;
  text-align: left;
}
.spread-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.nocturne .spread-options button {
  min-height: 64px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  padding: 8px 9px;
  border: 1px solid #b18bc940;
  border-radius: 8px;
  background: #20172cbb;
  color: #e1d0e8;
  font-size: .86rem;
  line-height: 1.3;
  cursor: pointer;
}
.spread-options button:hover { border-color: #be97d595; }
.nocturne .spread-options button[aria-pressed='true'] {
  border-color: #caa1dbea;
  background: linear-gradient(120deg, #583764, #392746);
  color: #fff0fa;
  box-shadow: inset 0 1px 0 #f1ceff29, 0 4px 23px #b460ce1c;
}
.spread-options svg { width: 23px; height: 24px; flex: 0 0 23px; color: #dfbceb; }
.spread-options strong { display: block; font-weight: 650; }
.spread-options small { display: block; margin-top: 4px; font-size: .72rem; color: #d7bede; }
.spread-description { min-height: 2.9em; margin: 11px 0 0; color: #cfbcd7; font-size: .89rem; line-height: 1.52; }
.studio-cards { grid-area: cards; min-width: 0; align-self: start; }
.studio-cards .card-chamber { padding-top: 10px; }
.studio-cards .card-stage { width: min(322px, max(209px, calc((100svh - 198px) * .6178)), 92%); }
.card-button { text-align: center; }
.card-button[role='img'] { cursor: default; }
.studio-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 0;
}
.draw-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.nocturne .quiet-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 11px;
  border: 1px solid #b88ed16e;
  border-radius: 7px;
  background: #291d36;
  color: #ead5f2;
  font-size: .86rem;
  cursor: pointer;
}
.quiet-button:hover { border-color: #e1b8ee; background: #3b284a; }
.studio-result { grid-area: result; align-self: start; padding-top: 12px; min-width: 0; }
.card-info {
  border-top: 1px solid #b693cc66;
  padding: 17px 0 3px;
  text-align: left;
}
.reading-position {
  margin: 0 0 5px;
  color: #e4afe9;
  font-size: .87rem;
  font-weight: 650;
}
.card-info h2, .dialog-reading h2 {
  margin: 0;
  color: #fff0f4;
  font: 600 clamp(1.25rem, 2.6vw, 1.75rem)/1.19 var(--roman);
}
.card-thai-name, .position-prompt {
  margin: 3px 0 0;
  color: #d7bfdc;
  font-size: .85rem;
  line-height: 1.55;
}
.position-prompt { color: #baabca; }
.reading-line {
  margin: 9px 0 3px;
  color: #ffdbfa;
  font: 400 1.19rem/1.55 Sriracha, var(--thai);
  text-shadow: 0 0 18px #d798ff60;
}
.reading-meaning {
  margin: 0;
  color: #e0d3e6;
  font-size: .92rem;
  line-height: 1.7;
}
.nocturne .card-inspect { margin-top: 11px; }

.spread-surface {
  padding: clamp(12px, 2.4vw, 22px);
  background: radial-gradient(ellipse at 50% 38%, #37234ebf, #1e152bdc 68%);
  border: 1px solid #a680bf76;
  border-radius: 13px;
  box-shadow: inset 0 0 0 3px #24192c, 0 14px 46px #0c08196b;
  position: relative;
}
.spread-caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 9px;
  min-height: 36px;
  padding: 1px 0 8px;
  border-bottom: 1px solid #ab87c74f;
  margin: 0 0 16px;
  color: #eedbf5;
  text-align: left;
  font-size: .9rem;
}
.spread-caption { flex-wrap: wrap; }
.spread-progress { margin-left: auto; color: #d5bde1; white-space: nowrap; font-size: .77rem; }
.nocturne .reading-jump {
  min-height: 34px;
  padding: 3px 8px;
  border: 1px solid #a982b775;
  border-radius: 5px;
  background: #352342;
  color: #f2d6f8;
  font-size: .8rem;
  cursor: pointer;
}
.reading-jump:hover { background: #50315b; }
#current-reading { scroll-margin-block: 18px; }
.spread-board { display: grid; align-items: start; gap: clamp(7px, 1.4vw, 14px); }
.timeline-board { grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 6px 0 4px; }
.choices-board { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.choices-board .position-0 { grid-column: 2 / 4; }
.nocturne .spread-tile {
  min-width: 0;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #decce8;
  cursor: pointer;
}
.mini-card {
  position: relative;
  display: block;
  width: 100%;
  max-width: 124px;
  aspect-ratio: 320 / 518;
  perspective: 540px;
  border-radius: 6% / 3.7%;
}
.choices-board .mini-card { max-width: 100px; }
.mini-turn {
  position: absolute;
  display: block;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform .63s cubic-bezier(.42, .06, .23, 1);
}
[data-revealed='true'] .mini-turn { transform: rotateY(180deg); }
.mini-back, .mini-face {
  position: absolute;
  inset: 0;
  display: block;
  backface-visibility: hidden;
  border-radius: 6% / 3.7%;
  border: 1px solid #a49abb;
  box-shadow: 0 5px 13px #09060f96, inset 0 0 0 1px #eae0ee5c;
  overflow: hidden;
}
.mini-back { background: radial-gradient(ellipse, #4a3967, #241d37 65%, #191524); }
.mini-back svg { display: block; width: 100%; height: 100%; }
.mini-face {
  container-type: inline-size;
  transform: rotateY(180deg);
  background: linear-gradient(120deg, #f1e8f3, #7e708d 42%, #e7ddeb);
  padding: 2px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
}
.mini-picture { display: block; min-width: 0; overflow: hidden; background: #1a112e; }
.mini-title {
  display: block;
  position: relative;
  padding: 2px 1px;
  background: #2e203e;
  color: #fff0fa;
  text-align: center;
  font: 600 clamp(5px, 7.5cqi, 11px)/1.16 var(--roman);
  overflow-wrap: anywhere;
}
.mini-foil {
  position: absolute;
  inset: 0;
  background: linear-gradient(128deg, #b087fa24, #94ccf80f 29%, #ffb5ed4d 47%, #9cddeb18 63%, #b687fd2a);
  mix-blend-mode: screen;
  pointer-events: none;
}
.spread-tile:hover .mini-back, .spread-tile:hover .mini-face, .spread-tile[data-chosen='true'] .mini-face {
  border-color: #f2d9ff;
  box-shadow: 0 0 0 1px #b98fe1bb, 0 0 18px #be87f174;
}
.slot-label {
  display: block;
  min-height: 1.45em;
  text-align: center;
  font-size: clamp(.69rem, 1.42vw, .85rem);
  line-height: 1.4;
}
[data-chosen='true'] .slot-label { color: #f6d6ff; font-weight: 700; }

.celtic-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(43px, 19%);
  gap: clamp(6px, 1.3vw, 14px);
  align-items: center;
}
.celtic-cross {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: clamp(5px, 1vw, 11px);
}
.celtic-cross .position-0 { grid-area: 2 / 2; }
.celtic-cross .position-1 { grid-area: 2 / 3; }
.celtic-cross .position-2 { grid-area: 1 / 2 / 2 / 4; max-width: 100px; justify-self: center; }
.celtic-cross .position-3 { grid-area: 3 / 2 / 4 / 4; max-width: 100px; justify-self: center; }
.celtic-cross .position-4 { grid-area: 2 / 1; }
.celtic-cross .position-5 { grid-area: 2 / 4; }
.celtic-cross .mini-card { max-width: 88px; }
.celtic-cross .position-1 .mini-card { transform: rotate(90deg) scale(.62); }
.celtic-staff {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  gap: 8px;
  border-left: 1px solid #9e78b35c;
  padding-left: 6px;
}
.celtic-staff .mini-card { max-width: 64px; }
.celtic-cross .slot-label, .celtic-staff .slot-label { font-size: clamp(.66rem, 1.2vw, .77rem); }
.celtic-board .mini-title { font-size: clamp(4.6px, 8cqi, 9px); }

.deck-library {
  width: min(100%, 1064px);
  padding: clamp(24px, 5vw, 52px) 0 18px;
}
.collection-heading h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.45rem);
  line-height: 1.19;
  font-weight: 650;
}
.collection-heading .arcana-index { margin-bottom: 6px; }
.collection-filters {
  display: flex;
  flex-wrap: wrap;
  column-gap: 6px;
  row-gap: 7px;
  margin: 18px 0 24px;
}
.nocturne .collection-filters button {
  min-height: 40px;
  padding: 5px 12px;
  border: 1px solid #b689ca74;
  border-radius: 999px;
  color: #e6d3ee;
  background: #23172f;
  font-size: .84rem;
  cursor: pointer;
}
.collection-filters button span { opacity: .77; margin-left: 2px; }
.nocturne .collection-filters button[aria-pressed='true'] {
  color: #261437;
  background: #e1b9f0;
  border-color: #e5c5f1;
  font-weight: 700;
}
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(116px, 100%), 1fr));
  gap: clamp(10px, 2vw, 19px) clamp(9px, 1.75vw, 16px);
  align-items: start;
}
.nocturne .collection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  width: 100%;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: #ebdaee;
  cursor: pointer;
}
.collection-card .mini-card { max-width: none; }
.collection-card .mini-face { transform: none; }
.collection-card:hover .mini-face, .collection-card:focus-visible .mini-face {
  border-color: #efd9fa;
  box-shadow: 0 0 16px #d397ee73;
}
.collection-label { text-align: center; font-size: .84rem; line-height: 1.35; }

.card-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  padding: 0;
  width: min(720px, calc(100% - 26px));
  max-height: calc(100svh - 24px);
  color: #ece1f3;
  background: #21182c;
  border: 1px solid #a882c4;
  border-radius: 13px;
  box-shadow: 0 20px 100px #050309d9;
  overflow: hidden auto;
  overscroll-behavior: contain;
}
.card-dialog::backdrop { background: #0c0816c9; backdrop-filter: blur(5px); }
.dialog-content {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, .93fr) minmax(0, 1.07fr);
  align-items: center;
  gap: clamp(11px, 3vw, 27px);
  padding: clamp(18px, 3vw, 32px);
  background: radial-gradient(ellipse at 18% 38%, #4a2c5d, #22182e 70%);
}
.card-dialog .dialog-close {
  position: absolute;
  right: 9px;
  top: 9px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid #a785ab91;
  border-radius: 50%;
  background: #241732;
  color: #fff1fc;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}
.dialog-close:hover { background: #593b67; }
.dialog-card { min-width: 0; display: grid; place-items: center; }
.dialog-card .card-stage { width: min(248px, max(128px, calc((100svh - 80px) * .6178)), 100%); }
.dialog-reading { min-width: 0; padding: 20px 0 6px; }

@media (max-width: 740px) {
  .studio {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto auto;
    grid-template-areas: 'intro' 'cards' 'controls' 'result';
    padding-top: 16px;
    text-align: center;
  }
  .studio:not([data-mode='single']) { grid-template-areas: 'intro' 'controls' 'cards' 'result'; }
  .studio-intro .arcana-index { display: none; }
  .studio-intro h1 { font-size: clamp(1.55rem, 7.1vw, 3.25rem); }
  .studio-intro h1 span { display: inline; }
  .spread-picker { margin-top: 15px; text-align: left; }
  .spread-picker legend { margin-bottom: 6px; font-size: .8rem; }
  .nocturne .spread-options button { min-height: 53px; font-size: .81rem; padding: 5px 6px; gap: 5px; }
  .spread-options svg { width: 19px; height: 21px; flex-basis: 19px; }
  .spread-options small { margin-top: 2px; }
  .spread-description { margin-top: 7px; min-height: 0; font-size: .83rem; }
  .studio-cards .card-chamber { padding: 13px 0 10px; }
  .studio-cards .card-stage { width: min(76vw, 292px, max(148px, calc((100svh - 300px) * .6178))); }
  .studio-controls { align-items: center; }
  .studio:not([data-mode='single']) .studio-controls { margin: 10px 0; }
  .draw-actions { justify-content: center; }
  .studio-result { padding-top: 9px; }
  .spread-caption { margin-bottom: 10px; }
  .spread-caption .reading-jump { width: 100%; min-height: 38px; }
  .collection-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 740px) and (max-height: 675px) and (orientation: portrait) {
  .studio { padding-top: 11px; }
  .studio-cards .card-stage { width: min(72vw, 221px, max(144px, calc((100svh - 283px) * .6178))); }
}
@media (max-width: 391px) {
  .nocturne .archive-toggle { font-size: .75rem; padding-inline: 8px; gap: 4px; }
  .archive-toggle svg { width: 15px; height: 15px; }
  .spread-surface { padding: 9px; }
}
@media (max-width: 560px) and (orientation: portrait) {
  .dialog-content { grid-template-columns: minmax(0, 1fr); gap: 7px; }
  .dialog-card .card-stage { width: min(190px, calc((100svh - 230px) * .6178), 69%); min-width: min(108px, 69%); }
  .dialog-reading { padding-top: 4px; }
}
@media (min-width: 580px) and (max-height: 520px) and (orientation: landscape) {
  .studio { grid-template-columns: minmax(225px, .9fr) minmax(0, 1.1fr); grid-template-areas: 'intro cards' 'controls cards' 'result cards'; padding-top: 12px; }
  .studio:not([data-mode='single']) { grid-template-areas: 'intro cards' 'controls cards' 'result cards'; }
  .studio-intro h1 { font-size: clamp(1.7rem, 4.7vw, 2.7rem); }
  .studio-intro h1 span { display: inline; }
  .studio-cards .card-stage { width: min(260px, max(130px, calc((100svh - 74px) * .6178)), 92%); }
  .studio-controls { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .mini-turn { transition: none !important; }
}
`;

const styles = `
@font-face {
  font-family: Cinzel;
  src: url('data:font/woff2;base64,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') format('woff2');
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
}
@font-face {
  font-family: Sriracha;
  src: url('data:font/woff2;base64,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') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

body { margin: 0; }
.nocturne, .nocturne * { box-sizing: border-box; }
.nocturne {
  --roman: Cinzel, 'Times New Roman', serif;
  --thai: 'Leelawadee UI', 'Noto Sans Thai', Tahoma, sans-serif;
  color-scheme: dark;
  background:
    radial-gradient(ellipse at 70% 59%, #241737 0%, transparent 53%),
    radial-gradient(ellipse at 19% 38%, #1b152a 0%, transparent 44%),
    #0d0a16;
  color: #ece3ef;
  font-family: var(--thai);
  padding: 0 max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
}
.nocturne button { font: inherit; }
.nocturne button:focus-visible { outline: 2px solid #efc8ff; outline-offset: 5px; }
.night-dust i {
  position: absolute;
  border-radius: 50%;
  background: #ddc3f5;
  box-shadow: 0 0 7px #e9b5ff;
  opacity: .28;
  animation: drift linear infinite;
}
@keyframes drift {
  0%, 100% { transform: translate(0, 0); opacity: .19; }
  50% { transform: translate(12px, -18px); opacity: .61; }
}
.masthead {
  max-width: 1234px;
  min-height: 76px;
  border-bottom: 1px solid #d4a9f026;
  z-index: 2;
}
.wordmark { gap: 12px; font: 600 .83rem/1 var(--roman); letter-spacing: .19em; color: #e5cced; }
.wordmark svg { width: 34px; height: 34px; color: #d9a8eb; }
.masthead-series { font-size: .83rem; letter-spacing: .024em; color: #bdabc9; }

.reading-room {
  width: min(100%, 1064px);
  min-height: calc(100svh - 100px);
  grid-template-columns: minmax(0, .87fr) minmax(0, 1.13fr);
  grid-template-rows: 1fr 1fr;
  grid-template-areas: 'intro card' 'controls card';
}
.introduction { grid-area: intro; align-self: end; position: relative; z-index: 1; padding: 18px 0 0 8px; }
.arcana-index {
  margin: 0 0 18px;
  color: #d1a4e6;
  font: 600 .73rem/1.4 var(--roman);
  letter-spacing: .23em;
}
.arcana-index span { color: #ffe7ce; margin-right: 12px; }
.introduction h1 {
  margin: 0;
  font: 500 clamp(3rem, 5.35vw, 5.1rem)/1.01 var(--roman);
  letter-spacing: -.047em;
  color: #f2e7ef;
  text-shadow: 0 0 36px #ad74ce30;
}
.introduction h1 span { display: block; }
.intro-rule { margin: 22px 0 14px; gap: 7px; color: #c990df; }
.intro-rule i:first-child { width: 92px; height: 1px; background: linear-gradient(90deg, #b67bcd28, #b67bcd99); }
.intro-rule i:last-child { width: 24px; height: 1px; background: linear-gradient(90deg, #b67bcd99, #b67bcd00); }
.intro-rule b, .title-ornament b { width: 5px; height: 5px; background: currentColor; transform: rotate(45deg); }
.invitation { color: #cbb8d4; font-size: 1.03rem; line-height: 1.65; margin: 0; }
.reading-controls { grid-area: controls; z-index: 2; align-self: start; padding: 24px 0 0 8px; gap: 7px; }
.reveal-button {
  min-height: 47px;
  min-width: 166px;
  gap: 9px;
  padding: 9px 19px;
  border: 1px solid #e5b9f1;
  border-radius: 6px;
  background: linear-gradient(128deg, #eac8f4, #cea4e7);
  color: #2b1640;
  box-shadow: 0 6px 27px #9863c42e, inset 0 1px 0 #fff7;
  cursor: pointer;
  transition: background .2s, box-shadow .2s;
}
.nocturne .reveal-button { font-weight: 700; }
.reveal-button:hover { background: #f4d9fc; box-shadow: 0 6px 27px #bd84f06b; }
.reveal-button svg { width: 17px; height: 17px; flex: none; }
.sensor-button {
  min-height: 44px;
  gap: 7px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: #d7bde7;
  cursor: pointer;
}
.nocturne .sensor-button { font-size: .87rem; }
.sensor-button:hover, .sensor-button[aria-pressed='true'] { color: #f7e5ff; }
.sensor-button svg { width: 21px; height: 21px; }
.sensor-message { max-width: 31ch; margin: 0; color: #e3c8ee; line-height: 1.5; font-size: .86rem; }
.sensor-message:empty { margin-top: -7px; }
.nocturne [aria-disabled='true'] { cursor: wait; }

.card-chamber { grid-area: card; align-self: center; min-width: 0; padding: 26px 0; }
.card-aura, .orbits { position: absolute; top: 50%; left: 50%; pointer-events: none; transform: translate(-50%, -50%); }
.card-aura {
  width: min(114%, 620px);
  height: 117%;
  background:
    radial-gradient(ellipse at 47% 45%, #8551aa49 0%, #5d398941 28%, transparent 64%),
    radial-gradient(ellipse at 55% 80%, #87489249, transparent 53%);
}
.orbits { width: min(108%, 560px); height: auto; opacity: .53; }
.card-stage {
  --px: 50%;
  --py: 50%;
  --rx: 0deg;
  --ry: 0deg;
  --sweep: 42%;
  width: min(354px, max(228px, calc((100svh - 141px) * .6178)), 92%);
  aspect-ratio: 320 / 518;
  perspective: 1120px;
}
.card-button {
  appearance: none;
  padding: 0;
  border: 0;
  border-radius: 4.2% / 2.6%;
  background: transparent;
  cursor: pointer;
  touch-action: pinch-zoom;
  -webkit-tap-highlight-color: transparent;
  transform-style: preserve-3d;
}
.card-float, .card-tilt, .card-rotor {
  position: absolute;
  inset: 0;
  display: block;
  transform-style: preserve-3d;
}
.card-float { animation: float 5.7s ease-in-out infinite; }
.card-tilt { transform: rotateX(var(--rx)) rotateY(var(--ry)); }
.card-rotor { transition: transform 1050ms cubic-bezier(.64, .04, .27, 1); }
@keyframes float {
  0%, 100% { transform: translateY(3px); }
  50% { transform: translateY(-6px); }
}
.card-face, .card-back, .card-edge {
  position: absolute;
  inset: 0;
  display: block;
  border-radius: 4.2% / 2.6%;
}
.card-edge {
  background: linear-gradient(148deg, #c4bed9, #5b4b70 23%, #b4adc5 45%, #62576f 68%, #352e48 88%, #a097b9);
  border: 1px solid #beb1d4;
}
.card-back, .card-face { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
.card-back {
  transform: translateZ(-7.5px) rotateY(180deg);
  overflow: hidden;
  border: 1px solid #dad7eb;
  background: radial-gradient(ellipse, #3e2e59 0%, #282440 48%, #121120 91%);
  box-shadow: 0 0 22px #ab8be75a, inset 0 0 22px #b6a2ca49;
}
.back-art { display: block; width: 100%; height: 100%; }
.card-face {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 2px;
  padding: 2.35%;
  overflow: hidden;
  transform: translateZ(.5px);
  border: 1px solid #e0d8ee;
  background: linear-gradient(141deg, #d7d1df 0%, #9994ab 8%, #e6dfef 19%, #8a839e 36%, #8c849d 53%, #eee4ef 70%, #68617a 87%, #c6bfda 100%);
  box-shadow: 0 16px 49px #070511a8, 0 0 32px #c790fd4d, inset 0 0 0 1px #fff6, inset 0 0 0 3px #443750;
  isolation: isolate;
}
.glass-window {
  display: block;
  overflow: hidden;
  border: 1px solid #251a38;
  border-radius: 3.3% / 2.4% 3.3% 0 0;
  background: #100e22;
}
.tarot-art { display: block; width: 100%; height: 100%; }
.title-panel {
  container-type: inline-size;
  display: block;
  position: relative;
  padding: 4px 3px 3px;
  overflow: visible;
  border: 1px solid #74627e;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(110deg, #201a32, #302241 50%, #1b172e);
  box-shadow: inset 0 0 0 2px #150f26, inset 0 0 0 3px #bfa4d52c;
}
.title-ornament { display: flex; align-items: center; justify-content: center; color: #c9aad7; gap: 6px; height: 7px; }
.title-ornament i { width: 14%; height: 1px; background: linear-gradient(90deg, transparent, #8f72a1); }
.title-ornament i:last-child { transform: rotate(180deg); }
.title-ornament b { width: 3px; height: 3px; }
.card-name {
  position: relative;
  display: block;
  text-transform: uppercase;
  white-space: nowrap;
  color: #fcf1e6;
  text-shadow: 0 0 10px #e3a7f471;
  font: 600 clamp(7.2px, 5.25cqi, 18px)/1.34 var(--roman);
  letter-spacing: .058em;
}
.card-name b { color: #dfb8ea; }
.prediction {
  position: relative;
  z-index: 2;
  display: block;
  min-height: 1.68em;
  line-height: 1.68;
  font: 400 clamp(9px, 5.8cqi, 17px)/1.68 Sriracha, var(--thai);
  white-space: nowrap;
  color: #ffdefe;
  text-shadow: 0 0 7px #d480ff, 0 0 15px #bc59ff;
}
.prediction-placeholder { color: #caa9d1; font-size: .67em; vertical-align: 1px; }
[data-open='true'][data-turning='false'] .prediction { animation: reading-rise 850ms 210ms both ease-out; }
@keyframes reading-rise {
  0% { opacity: 0; transform: translateY(7px); }
  100% { opacity: 1; transform: translateY(0); }
}

.foil, .foil span, .foil-sparks, .reveal-scan {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
}
.foil { --foil-strength: .24; }
[data-open='true'] .foil { --foil-strength: .9; }
.foil span, .foil-sparks { transition: opacity .55s ease-out; }
.foil-rainbow {
  background: repeating-linear-gradient(116deg, #7b52d459 1%, #4c72c381 12%, #83e9de81 24%, #edc77460 35%, #f390ba74 47%, #7b52d459 58%);
  background-size: 240% 180%;
  background-position: var(--px) var(--py);
  mix-blend-mode: color-dodge;
  opacity: .63;
}
.foil-iridescence {
  background:
    radial-gradient(ellipse at var(--px) var(--py), #f991dfbd, #b698ff78 29%, transparent 61%),
    radial-gradient(ellipse at calc(100% - var(--px)) calc(100% - var(--py)), #9cfaaa90, #77d7cc25 43%, transparent 73%);
  mix-blend-mode: overlay;
  opacity: .81;
}
.foil-grain {
  background-image: radial-gradient(circle, #f3dfffad .55px, transparent 1px), radial-gradient(circle, #bfffff88 .45px, transparent 1px);
  background-size: 13px 19px, 17px 11px;
  background-position: var(--px) var(--py), calc(var(--px) + 5px) calc(var(--py) + 7px);
  mix-blend-mode: screen;
  opacity: .38;
}
.foil-lines {
  background: repeating-linear-gradient(0deg, transparent 0 3px, #dab9f843 3px 4px, #20174238 4px 5px);
  background-size: 120% 112%;
  background-position: var(--px) var(--py);
  opacity: .36;
  mix-blend-mode: soft-light;
}
.foil-sheen {
  background: linear-gradient(123deg, transparent calc(var(--sweep) - 15%), #c1a1fa04 calc(var(--sweep) - 7%), #f4d3ff3d calc(var(--sweep) - 1%), #e3f4ff91 var(--sweep), #a5ffe452 calc(var(--sweep) + 1.1%), transparent calc(var(--sweep) + 7%));
  mix-blend-mode: screen;
  opacity: .76;
}
.foil-glare {
  background: radial-gradient(circle at var(--px) var(--py), #f4e3ff92 0%, #ebe9fe35 18%, #cceeff0a 34%, transparent 57%);
  mix-blend-mode: screen;
  opacity: .64;
}
.foil-sparks {
  width: 100%;
  height: 100%;
  opacity: .89;
  filter: drop-shadow(0 0 2px #d8acff);
  mask-image: linear-gradient(123deg, transparent calc(var(--sweep) - 5%), #000 calc(var(--sweep) - 1%), #000 calc(var(--sweep) + 1%), transparent calc(var(--sweep) + 6%));
}
.reveal-scan {
  z-index: 1;
  opacity: 0;
  background-image: linear-gradient(0deg, transparent 2%, #faa6ef55 34%, #a8faffcc 72%, #fff 75%, #e0acffbb 79%, #ce8dfc33 85%, transparent 99%);
  background-size: 100% 13%;
  background-repeat: no-repeat;
  mix-blend-mode: screen;
}
[data-flash='true'] .reveal-scan { animation: scan-up 1130ms ease-out both; }
@keyframes scan-up {
  0% { opacity: 0; background-position: 0 115%; }
  12% { opacity: .9; }
  76% { opacity: .79; }
  100% { opacity: 0; background-position: 0 -16%; }
}
.reveal-beam {
  position: absolute;
  display: block;
  z-index: -1;
  pointer-events: none;
  inset: -20% -42% -11%;
  opacity: 0;
  transform-origin: 50% 91%;
  background:
    radial-gradient(ellipse at 50% 91%, #fff 0%, #ecd2ffa8 5%, #c384ff55 13%, transparent 48%),
    conic-gradient(from 330deg at 50% 90%, transparent, #bc8aff46, #eee5ffb3, #bc8aff46, transparent 60deg);
  clip-path: polygon(5% 0, 95% 0, 65% 88%, 93% 94%, 50% 100%, 7% 94%, 35% 88%);
  filter: blur(4px);
}
[data-flash='true'] .reveal-beam { animation: beam-up 1300ms ease-out both; }
@keyframes beam-up {
  0% { opacity: 0; transform: scaleY(.16) scaleX(.67); }
  27% { opacity: .96; transform: scaleY(1) scaleX(1); }
  100% { opacity: 0; transform: scaleY(1.14) scaleX(1.22); }
}

@media (max-width: 740px) {
  .nocturne { padding-left: max(17px, env(safe-area-inset-left)); padding-right: max(17px, env(safe-area-inset-right)); }
  .masthead { min-height: 57px; }
  .wordmark { gap: 8px; font-size: .68rem; letter-spacing: .13em; }
  .wordmark svg { width: 28px; height: 28px; }
  .masthead-series { font-size: .74rem; }
  .reading-room {
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    grid-template-areas: 'intro' 'card' 'controls';
    text-align: center;
  }
  .introduction { padding: 19px 0 0; }
  .arcana-index { margin-bottom: 6px; font-size: .64rem; }
  .arcana-index span { margin-right: 7px; }
  .introduction h1 { font-size: clamp(1.66rem, 7.45vw, 3.7rem); line-height: 1.07; }
  .introduction h1 span { display: inline; }
  .intro-rule { display: none; }
  .invitation { margin: 6px 0 0; font-size: .91rem; }
  .card-chamber { padding: 19px 0 14px; }
  .card-stage { width: min(78vw, 305px, max(193px, calc((100svh - 229px) * .6178))); }
  .orbits { width: min(120%, 470px); max-height: 112%; }
  .card-aura { width: min(120%, 500px); }
  .reading-controls { align-items: center; padding: 0; gap: 3px; }
  .reveal-button { min-height: 43px; }
  .sensor-message:empty { margin-top: -3px; }
}
@media (max-width: 740px) and (max-height: 670px) {
  .nocturne { padding-bottom: 7px; }
  .masthead { min-height: 48px; }
  .introduction { padding-top: 11px; }
  .card-chamber { padding: 12px 0 11px; }
  .card-stage { width: min(74vw, 270px, max(185px, calc((100svh - 240px) * .6178))); }
}
@media (min-width: 560px) and (max-height: 520px) and (orientation: landscape) {
  .nocturne { padding-bottom: 8px; }
  .masthead { min-height: 45px; }
  .reading-room {
    min-height: calc(100svh - 53px);
    grid-template-columns: minmax(0, .96fr) minmax(0, 1.04fr);
    grid-template-rows: 1fr 1fr;
    grid-template-areas: 'intro card' 'controls card';
    text-align: left;
  }
  .introduction { padding: 0 0 0 6px; }
  .arcana-index { margin-bottom: 8px; }
  .introduction h1 { font-size: clamp(1.8rem, 4.9vw, 3.4rem); }
  .introduction h1 span { display: block; }
  .intro-rule { display: none; }
  .invitation { margin: 8px 0 0; }
  .card-chamber { padding: 8px 0; }
  .card-stage { width: min(260px, max(132px, calc((100svh - 72px) * .6178)), 92%); }
  .reading-controls { align-items: flex-start; padding: 10px 0 0 6px; gap: 3px; }
  .reveal-button { min-height: 42px; }
}
@media (prefers-reduced-motion: reduce) {
  .night-dust i, .card-float, .prediction, .reveal-scan, .reveal-beam { animation: none !important; }
  .card-rotor, .foil span, .foil-sparks, .reveal-button { transition: none !important; }
}
`;

/*
Embedded typefaces
Copyright (c) 2015, Cadson Demak (info@cadsondemak.com), Copyright (c) 2014, Pablo Impallari (www.impallari.com|impallari@gmail.com)
Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

*/
