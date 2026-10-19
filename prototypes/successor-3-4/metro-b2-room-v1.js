(() => {
  'use strict';

  const state = { inside: false, u: .68, v: .72, clueFound: false, moving: false };
  const exit = { u: .50, v: .92 };
  const consolePoint = { u: .76, v: .64 };
  const distance = point => Math.hypot(state.u - point.u, state.v - point.v);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const point = (u, v, width, height) => ({ x: Math.round(width * (.18 + .64 * u)), y: Math.round(height * (.50 + .34 * v)) });

  function enter() {
    state.inside = true;
    state.u = .68;
    state.v = .72;
    state.moving = false;
  }

  function step(x, y, elapsed) {
    if (!state.inside) return;
    const length = Math.hypot(x, y) || 1;
    const scale = Math.min(.24 * Math.max(0, elapsed), .012) / length;
    state.u = clamp(state.u + x * scale, .19, .81);
    state.v = clamp(state.v + y * scale, .59, .92);
    state.moving = Math.hypot(x, y) > .08;
  }

  function interact() {
    if (!state.inside) return 'outside';
    if (distance(exit) < .115 || state.clueFound) {
      state.inside = false;
      state.moving = false;
      return 'exit';
    }
    state.clueFound = true;
    return 'clue';
  }

  function draw(ctx, width, height, { now = 0, player, drawPlayer }) {
    const W = Math.max(1, Math.round(width)), H = Math.max(1, Math.round(height));
    const poly = (vertices, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(Math.round(vertices[0][0] * W), Math.round(vertices[0][1] * H));
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(Math.round(vertices[i][0] * W), Math.round(vertices[i][1] * H));
      ctx.closePath();
      ctx.fill();
    };
    const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x * W), Math.round(y * H), Math.max(1, Math.round(w * W)), Math.max(1, Math.round(h * H))); };

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#35423b';
    ctx.fillRect(0, 0, W, H);
    rect(0,.07,1,.018,'#25312d');
    rect(.04,.10,.92,.006,'#5b6656');
    rect(.06,.42,.88,.012,'#4a574d');

    // Open 3/4 cutaway: a legible rear wall meets a continuous perspective floor, never an empty black void.
    rect(.08,.13,.84,.37,'#435047');
    poly([[.08,.13],[.19,.24],[.19,.51],[.08,.48]], '#35433b');
    poly([[.81,.24],[.92,.13],[.92,.48],[.81,.51]], '#39473e');
    rect(.08,.47,.84,.018,'#9a987c');
    poly([[0,.49],[1,.49],[1,1],[0,1]], '#6e796c');
    poly([[.08,.49],[.92,.49],[1,.59],[0,.59]], '#788272');

    // Service conduit, wall anchors and damp streaks give the room a lived-in
    // municipal utility feel without drawing a visible square tile grid.
    rect(.135,.264,.006,.166,'#68766a');
    rect(.139,.264,.21,.006,'#7a806b');
    rect(.346,.264,.006,.037,'#68766a');
    rect(.128,.281,.021,.009,'#9b916c');
    rect(.338,.281,.021,.009,'#9b916c');
    rect(.805,.264,.006,.128,'#617166');
    rect(.791,.384,.02,.009,'#94896a');
    for (const [x,y,w,h,color] of [
      [.235,.371,.009,.052,'#3b4942'],[.244,.406,.013,.031,'#505e50'],
      [.774,.327,.008,.069,'#3a4942'],[.764,.379,.012,.034,'#566050'],
      [.552,.438,.011,.018,'#4f5c4e'],[.293,.448,.016,.009,'#52604f']
    ]) rect(x,y,w,h,color);

    // Warm emergency strips, conduit, and irregular damp marks establish the city utility room.
    rect(.34,.207,.32,.012,'#d5bb76');
    rect(.37,.218,.26,.006,'#f1d99a');
    rect(.15,.29,.31,.012,'#52625b');
    rect(.15,.29,.22,.005,'#8b927a');
    for (let i = 0; i < 6; i++) rect(.19 + i*.088,.276,.014,.016,'#596962');
    rect(.17,.34,.09,.04,'#1d2928');
    rect(.18,.345,.07,.027,'#7d9181');
    rect(.20,.352,.026,.008,'#c8a05d');
    rect(.234,.352,.012,.008,'#b74e48');
    rect(.252,.352,.009,.008,Math.sin(now/260) > .25 ? '#bde1a0' : '#647367');

    // Recessed steel stair door at the back; the amber indicator points back to the city.
    rect(.421,.244,.158,.238,'#26332d');
    rect(.432,.253,.136,.22,'#817f68');
    rect(.441,.261,.118,.203,'#35433b');
    rect(.451,.272,.096,.181,'#3d4b41');
    rect(.526,.349,.008,.023,'#e6c77a');
    rect(.409,.478,.182,.012,'#1b2925');
    ctx.fillStyle = '#e4d6a6'; ctx.font = 'bold 8px ui-monospace,monospace'; ctx.textAlign = 'center';
    ctx.fillText('B2 · SERVICE', Math.round(.50*W), Math.round(.235*H));
    // A short worn hazard stripe marks the stair threshold as a real access point.
    for (let i = 0; i < 7; i++) rect(.421+i*.023,.472,.014,.005,i%2 ? '#303b33' : '#b89b5d');

    // Electrical cabinet and puddle reflection create a focal point that invites inspection.
    poly([[.655,.478],[.756,.437],[.842,.476],[.738,.521]], '#465650');
    poly([[.655,.478],[.738,.521],[.738,.646],[.655,.603]], '#293936');
    poly([[.738,.521],[.842,.476],[.842,.601],[.738,.646]], '#35443f');
    poly([[.672,.486],[.756,.452],[.824,.482],[.739,.516]], '#a39b79');
    poly([[.672,.486],[.739,.516],[.739,.608],[.672,.578]], '#596a60');
    poly([[.739,.516],[.824,.482],[.824,.574],[.739,.608]], '#3c4d47');
    rect(.69,.51,.034,.016,'#26312c');
    rect(.696,.514,.011,.006,'#df6960');
    rect(.710,.514,.009,.006,state.clueFound ? '#c6dea0' : '#d7b86a');
    rect(.725,.514,.012,.006,'#91c6b1');
    for (let i = 0; i < 3; i++) rect(.686,.54+i*.021,.044,.006,'#869181');
    poly([[.63,.742],[.672,.724],[.729,.737],[.704,.752],[.661,.765]], '#89908355');
    poly([[.292,.831],[.342,.812],[.379,.823],[.337,.841]], '#a88b6540');
    // Tiny broken reflections and grit replace the oversized flat floor patches.
    for (const [x,y,w,h,color] of [
      [.604,.758,.012,.003,'#b6b29655'],[.693,.768,.009,.003,'#c4bd9850'],
      [.628,.782,.006,.003,'#394a4355'],[.416,.704,.008,.003,'#c1b88f44'],
      [.472,.851,.006,.003,'#3b4a4255'],[.755,.681,.009,.003,'#b8b69644'],
      [.556,.893,.008,.003,'#414e4555'],[.242,.753,.007,.003,'#bdb48a40']
    ]) rect(x,y,w,h,color);

    // Sealed file box and scattered paper tell a small story without a dialogue dump.
    poly([[.244,.58],[.32,.55],[.381,.577],[.304,.61]], '#665d49');
    poly([[.244,.58],[.304,.61],[.304,.672],[.244,.646]], '#3a453e');
    poly([[.304,.61],[.381,.577],[.381,.641],[.304,.672]], '#4b5146');
    rect(.27,.603,.045,.009,'#d4bd84');
    rect(.31,.614,.017,.005,'#e0d9c2');

    const lamp = .58 + .16 * (.5 + .5 * Math.sin(now / 410));
    ctx.globalAlpha = lamp;
    poly([[.30,.24],[.50,.18],[.69,.24],[.50,.32]], '#e5c47820');
    ctx.globalAlpha = 1;

    const actor = point(state.u, state.v, W, H);
    ctx.fillStyle = '#1d2622';
    ctx.beginPath(); ctx.ellipse(actor.x, actor.y-2, 10, 4, 0, 0, Math.PI*2); ctx.fill();
    drawPlayer?.(actor.x, actor.y, player || {});

    ctx.fillStyle = '#efe4c7'; ctx.font = 'bold 10px ui-monospace,monospace'; ctx.textAlign = 'left';
    ctx.fillText('B2 / 地下检修层', 15, 25);
    ctx.fillStyle = '#a5b0a0'; ctx.font = '8px ui-monospace,monospace';
    ctx.fillText('停电后 · 海雾渗入', 15, 39);
    const atConsole = distance(consolePoint) < .13, atExit = distance(exit) < .115;
    const prompt = atConsole ? (state.clueFound ? 'E 返回街面' : 'E 检查配电柜') : atExit ? 'E 返回街面' : state.clueFound ? 'E 返回街面 · WASD / 摇杆探索' : 'WASD / 摇杆探索 · E 检查配电柜';
    const boxW = Math.min(W-24, Math.ceil(ctx.measureText(prompt).width) + 18), boxX = Math.round((W-boxW)/2), boxY = H-30;
    ctx.fillStyle = '#111816ed'; ctx.fillRect(boxX,boxY,boxW,20);
    ctx.strokeStyle = atConsole ? '#d7bc78' : '#63736c'; ctx.strokeRect(boxX+.5,boxY+.5,boxW-1,19);
    ctx.fillStyle = '#f1ead8'; ctx.textAlign = 'center'; ctx.font = 'bold 8px ui-monospace,monospace';
    ctx.fillText(prompt, W/2, boxY+13);
    ctx.restore();
  }

  window.ABYSSAL_METRO_B2_ROOM_V1 = Object.freeze({
    enter,
    step,
    interact,
    draw,
    isInside: () => state.inside,
    snapshot: () => ({ inside: state.inside, u: state.u, v: state.v, moving: state.moving, clueFound: state.clueFound })
  });
})();
