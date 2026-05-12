const U = 0,
  D = 1,
  F = 2,
  B = 3,
  L = 4,
  R = 5;
const COLOR = ["U", "D", "F", "B", "L", "R"];

const FACE_POS = {
  [U]: [0, 3],
  [L]: [3, 0],
  [F]: [3, 3],
  [R]: [3, 6],
  [B]: [3, 9],
  [D]: [6, 3],
};

const SQ = 48,
  GAP = 3,
  PAD = 14;
const STEP = 3 * (SQ + GAP); // pixel width of one face = 153
const DUR = 280;

let state = [];
let animating = false;
let moveHistory = [];

function resetState() {
  state = [];
  for (let f = 0; f < 6; f++) {
    const face = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) row.push(COLOR[f]);
      face.push(row);
    }
    state.push(face);
  }
}

function rotateFaceCW(face) {
  const o = state[face].map((r) => r.slice());
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) state[face][r][c] = o[2 - c][r];
}
function rotateFaceCCW(face) {
  const o = state[face].map((r) => r.slice());
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) state[face][r][c] = o[c][2 - r];
}

function rotateY(row, dir) {
  const oF = state[F][row].slice();
  const oL = state[L][row].slice();
  const oR = state[R][row].slice();
  const oB = state[B][row].slice();
  if (dir === 1) {
    state[F][row] = oL;
    state[R][row] = oF;
    state[B][row] = oR;
    state[L][row] = oB;
    if (row === 0) rotateFaceCCW(U);
    if (row === 2) rotateFaceCW(D);
  } else {
    state[L][row] = oF;
    state[F][row] = oR;
    state[R][row] = oB;
    state[B][row] = oL;
    if (row === 0) rotateFaceCW(U);
    if (row === 2) rotateFaceCCW(D);
  }
}

function rotateX(col, dir) {
  const oU = [state[U][0][col], state[U][1][col], state[U][2][col]];
  const oF = [state[F][0][col], state[F][1][col], state[F][2][col]];
  const oD = [state[D][0][col], state[D][1][col], state[D][2][col]];
  const oB = [state[B][0][2 - col], state[B][1][2 - col], state[B][2][2 - col]];
  if (dir === 1) {
    for (let r = 0; r < 3; r++) state[F][r][col] = oU[r];
    for (let r = 0; r < 3; r++) state[D][r][col] = oF[r];
    for (let r = 0; r < 3; r++) state[B][r][2 - col] = oD[2 - r];
    for (let r = 0; r < 3; r++) state[U][r][col] = oB[2 - r];
    if (col === 0) rotateFaceCW(L);
    if (col === 2) rotateFaceCCW(R);
  } else {
    for (let r = 0; r < 3; r++) state[U][r][col] = oF[r];
    for (let r = 0; r < 3; r++) state[F][r][col] = oD[r];
    for (let r = 0; r < 3; r++) state[D][r][col] = oB[2 - r];
    for (let r = 0; r < 3; r++) state[B][r][2 - col] = oU[2 - r];
    if (col === 0) rotateFaceCCW(L);
    if (col === 2) rotateFaceCW(R);
  }
}

function rotateZ(s, dir) {
  const oL = [state[L][0][s], state[L][1][s], state[L][2][s]];
  const oU = [state[U][s][0], state[U][s][1], state[U][s][2]];
  const oR = [state[R][0][2 - s], state[R][1][2 - s], state[R][2][2 - s]];
  const oD = [state[D][2 - s][0], state[D][2 - s][1], state[D][2 - s][2]];
  if (dir === 1) {
    for (let i = 0; i < 3; i++) state[U][s][2 - i] = oL[i];
    for (let i = 0; i < 3; i++) state[R][i][2 - s] = oU[i];
    for (let i = 0; i < 3; i++) state[D][2 - s][2 - i] = oR[i];
    for (let i = 0; i < 3; i++) state[L][i][s] = oD[i];
    if (s === 0) rotateFaceCCW(B);
    if (s === 2) rotateFaceCW(F);
  } else {
    for (let i = 0; i < 3; i++) state[L][i][s] = oU[2 - i];
    for (let i = 0; i < 3; i++) state[U][s][i] = oR[i];
    for (let i = 0; i < 3; i++) state[R][i][2 - s] = oD[2 - i];
    for (let i = 0; i < 3; i++) state[D][2 - s][i] = oL[i];
    if (s === 0) rotateFaceCW(B);
    if (s === 2) rotateFaceCCW(F);
  }
}

function applyRot(rotType, layer, dir) {
  if (rotType === "Y") rotateY(layer, dir);
  else if (rotType === "X") rotateX(layer, dir);
  else if (rotType === "Z") rotateZ(layer, dir);
}

// Build a (from, to) mapping for a rotation, using a tracker state
function getRotationMapping(rotType, layer, dir) {
  const real = state;
  state = [];
  for (let f = 0; f < 6; f++) {
    const face = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) row.push(f * 100 + r * 10 + c);
      face.push(row);
    }
    state.push(face);
  }
  applyRot(rotType, layer, dir);
  const mapping = [];
  for (let f = 0; f < 6; f++) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const id = state[f][r][c];
        const sf = Math.floor(id / 100);
        const sr = Math.floor((id % 100) / 10);
        const sc = id % 10;
        if (sf !== f || sr !== r || sc !== c) {
          mapping.push({ from: [sf, sr, sc], to: [f, r, c] });
        }
      }
    }
  }
  state = real;
  return mapping;
}

function stickerPx(face, row, col) {
  const [or, oc] = FACE_POS[face];
  return {
    x: PAD + (oc + col) * (SQ + GAP),
    y: PAD + (or + row) * (SQ + GAP),
  };
}

function faceCenterPx(face) {
  const [or, oc] = FACE_POS[face];
  const half = (3 * SQ + 2 * GAP) / 2;
  return {
    x: PAD + oc * (SQ + GAP) + half,
    y: PAD + or * (SQ + GAP) + half,
  };
}

function getRotatingFace(rotType, layer) {
  if (rotType === "Y") return layer === 0 ? U : layer === 2 ? D : null;
  if (rotType === "X") return layer === 0 ? L : layer === 2 ? R : null;
  if (rotType === "Z") return layer === 0 ? B : layer === 2 ? F : null;
  return null;
}

function render() {
  const cube = document.getElementById("cube");
  // Remove only real stickers; leave overlays in place so callers can fade
  // them out smoothly (which lets the inset shadow rotate continuously into
  // the new sticker's default position instead of snapping).
  cube.querySelectorAll(".sticker:not(.overlay)").forEach((el) => el.remove());
  for (let f = 0; f < 6; f++) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const { x, y } = stickerPx(f, r, c);
        const d = document.createElement("div");
        d.className = "sticker c-" + state[f][r][c];
        d.style.left = x + "px";
        d.style.top = y + "px";
        d.dataset.face = f;
        d.dataset.row = r;
        d.dataset.col = c;
        cube.appendChild(d);
      }
    }
  }
}

function removeOverlays(overlays, done) {
  for (const o of overlays) o.el.remove();
  done();
}

function rotationForHorizontalDrag(face, row, col) {
  if (face === F || face === L || face === R || face === B) return ["Y", row];
  if (face === U) return ["Z", row];
  if (face === D) return ["Z", 2 - row];
  return null;
}

function rotationForVerticalDrag(face, row, col) {
  if (face === F || face === U || face === D) return ["X", col];
  if (face === L) return ["Z", col];
  if (face === R) return ["Z", 2 - col];
  if (face === B) return ["X", 2 - col];
  return null;
}

function dirForDrag(face, axis, sign) {
  if (axis === "h") {
    if (face === F || face === L || face === R || face === B)
      return sign > 0 ? 1 : -1;
    if (face === U) return sign > 0 ? 1 : -1;
    if (face === D) return sign > 0 ? -1 : 1;
  } else {
    if (face === F || face === U || face === D) return sign > 0 ? 1 : -1;
    if (face === L) return sign > 0 ? -1 : 1;
    if (face === R) return sign > 0 ? 1 : -1;
    if (face === B) return sign > 0 ? -1 : 1;
  }
  return 1;
}

function addLiveOverlay(x, y, color, opacity) {
  const cube = document.getElementById("cube");
  const d = document.createElement("div");
  d.className = "sticker c-" + color + " overlay live";
  d.style.left = x + "px";
  d.style.top = y + "px";
  if (opacity !== undefined) d.style.opacity = opacity;
  cube.appendChild(d);
  return d;
}

let drag = null;
const LOCK_THRESHOLD = 4;

function startDrag(face, row, col, x, y) {
  if (animating || drag) return;
  drag = {
    face,
    row,
    col,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
    locked: false,
  };
}

function lockDrag() {
  const dx = drag.currentX - drag.startX;
  const dy = drag.currentY - drag.startY;
  drag.axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";

  const rot =
    drag.axis === "h"
      ? rotationForHorizontalDrag(drag.face, drag.row, drag.col)
      : rotationForVerticalDrag(drag.face, drag.row, drag.col);
  if (!rot) {
    drag = null;
    return;
  }
  drag.rotType = rot[0];
  drag.layer = rot[1];
  drag.dirPos = dirForDrag(drag.face, drag.axis, +1);
  drag.dirNeg = -drag.dirPos;
  drag.unitAxis =
    drag.rotType === "Y" ? "x" : drag.rotType === "X" ? "y" : null;
  drag.committedDelta = 0;
  drag.locked = true;
  setupOverlays();
}

function setupOverlays() {
  const cube = document.getElementById("cube");
  drag.mapPos = getRotationMapping(drag.rotType, drag.layer, drag.dirPos);
  drag.mapNeg = getRotationMapping(drag.rotType, drag.layer, drag.dirNeg);

  const involved = new Set();
  for (const { from, to } of drag.mapPos) {
    involved.add(from.join(","));
    involved.add(to.join(","));
  }
  for (const key of involved) {
    const [f, r, c] = key.split(",").map(Number);
    const el = cube.querySelector(
      `.sticker[data-face="${f}"][data-row="${r}"][data-col="${c}"]`,
    );
    if (el) el.classList.add("hidden");
  }

  const useUnit = drag.rotType === "Y" || drag.rotType === "X";
  const unitAxis = drag.unitAxis;
  drag.overlays = [];

  // For an X-axis rotation the columns on opposite sides of the cube
  // visually move in opposite directions. Whichever column the user is
  // dragging follows the cursor; the others on the opposite side flip.
  const oppositeFaces = new Set();
  if (drag.rotType === "X") {
    if (drag.face === B) {
      oppositeFaces.add(U);
      oppositeFaces.add(F);
      oppositeFaces.add(D);
    } else {
      oppositeFaces.add(B);
    }
  }

  const destPos = new Map();
  for (const { from, to } of drag.mapPos) destPos.set(from.join(","), to);
  const destNeg = new Map();
  for (const { from, to } of drag.mapNeg) destNeg.set(from.join(","), to);

  const rotFaceMain = getRotatingFace(drag.rotType, drag.layer);
  // For Z rotations, every slice's ring is co-circular around F's center
  // in the flat layout (including the s=0 ring on the cube's back).
  const ringCenter =
    drag.rotType === "Z"
      ? faceCenterPx(F)
      : rotFaceMain !== null
        ? faceCenterPx(rotFaceMain)
        : null;

  function tryArc(start, end) {
    if (!ringCenter) return null;
    const sCx = start.x + SQ / 2;
    const sCy = start.y + SQ / 2;
    const eCx = end.x + SQ / 2;
    const eCy = end.y + SQ / 2;
    const sR = Math.hypot(sCx - ringCenter.x, sCy - ringCenter.y);
    const eR = Math.hypot(eCx - ringCenter.x, eCy - ringCenter.y);
    if (Math.abs(eR - sR) > 5) return null;
    const sAng = Math.atan2(sCy - ringCenter.y, sCx - ringCenter.x);
    let dAng = Math.atan2(eCy - ringCenter.y, eCx - ringCenter.x) - sAng;
    while (dAng > Math.PI) dAng -= 2 * Math.PI;
    while (dAng <= -Math.PI) dAng += 2 * Math.PI;
    return { sAng, dAng, r: sR, sCx, sCy };
  }

  for (const key of destPos.keys()) {
    const from = key.split(",").map(Number);
    const dPos = destPos.get(key);
    const dNeg = destNeg.get(key);
    const start = stickerPx(...from);
    const endP = stickerPx(...dPos);
    const endN = stickerPx(...dNeg);
    const color = state[from[0]][from[1]][from[2]];
    const isFace = from[0] === dPos[0];

    const el = addLiveOverlay(start.x, start.y, color, 1);

    if (isFace) {
      // Face entry: rotate around face center rather than slide
      const fc = faceCenterPx(from[0]);
      const fromCx = start.x + SQ / 2;
      const fromCy = start.y + SQ / 2;
      const toCx = endP.x + SQ / 2;
      const toCy = endP.y + SQ / 2;
      const fromAng = Math.atan2(fromCy - fc.y, fromCx - fc.x);
      const toAng = Math.atan2(toCy - fc.y, toCx - fc.x);
      let deltaPos = ((toAng - fromAng) * 180) / Math.PI;
      while (deltaPos > 180) deltaPos -= 360;
      while (deltaPos <= -180) deltaPos += 360;
      el.style.transformOrigin = `${fc.x - start.x}px ${fc.y - start.y}px`;
      drag.overlays.push({
        el,
        type: "face-rotate",
        anglePos: deltaPos,
        destPos: dPos,
        destNeg: dNeg,
      });
      continue;
    }

    // For ring stickers whose source/destination lie on a common circle
    // around the rotating face center, sweep them along that arc.
    const arcPos = tryArc(start, endP);
    const arcNeg = tryArc(start, endN);
    if (arcPos && arcNeg) {
      drag.overlays.push({
        el,
        type: "arc",
        start,
        arcPos,
        arcNeg,
        destPos: dPos,
        destNeg: dNeg,
      });
      continue;
    }

    if (useUnit) {
      const dxP = endP.x - start.x,
        dyP = endP.y - start.y;
      const dxN = endN.x - start.x,
        dyN = endN.y - start.y;
      const isWrapPos =
        unitAxis === "x"
          ? Math.abs(dxP) > STEP * 1.5 || Math.abs(dyP) > 5
          : Math.abs(dyP) > STEP * 1.5 || Math.abs(dxP) > 5;
      const isWrapNeg =
        unitAxis === "x"
          ? Math.abs(dxN) > STEP * 1.5 || Math.abs(dyN) > 5
          : Math.abs(dyN) > STEP * 1.5 || Math.abs(dxN) > 5;
      // Columns on the opposite side of the cube from the one being
      // dragged should slide in the opposite direction.
      const reverse = oppositeFaces.has(from[0]);
      drag.overlays.push({
        el,
        type: "unit",
        start,
        wrapPos: isWrapPos,
        wrapNeg: isWrapNeg,
        reverse,
      });
    } else {
      drag.overlays.push({
        el,
        type: "direct",
        start,
        endPos: endP,
        endNeg: endN,
      });
    }
  }

  // If a face is rotating (i.e., the slice includes a face), also create
  // an overlay for the center sticker so the whole face rotates as one.
  const rotFace = getRotatingFace(drag.rotType, drag.layer);
  if (rotFace !== null) {
    const fo = drag.overlays.find((o) => o.type === "face-rotate");
    if (fo) {
      const real = cube.querySelector(
        `.sticker[data-face="${rotFace}"][data-row="1"][data-col="1"]`,
      );
      if (real) real.classList.add("hidden");
      const centerStart = stickerPx(rotFace, 1, 1);
      const color = state[rotFace][1][1];
      const el = addLiveOverlay(centerStart.x, centerStart.y, color, 1);
      el.style.transformOrigin = `${SQ / 2}px ${SQ / 2}px`;
      drag.overlays.push({
        el,
        type: "face-rotate",
        anglePos: fo.anglePos,
        destPos: [rotFace, 1, 1],
        destNeg: [rotFace, 1, 1],
      });
    }
  }

  if (useUnit) {
    function addPhantom(from, to, activeFor) {
      if (from[0] === to[0]) return;
      const start = stickerPx(...from);
      const end = stickerPx(...to);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const isWrap =
        unitAxis === "x"
          ? Math.abs(dx) > STEP * 1.5 || Math.abs(dy) > 5
          : Math.abs(dy) > STEP * 1.5 || Math.abs(dx) > 5;
      if (!isWrap) return;
      const color = state[from[0]][from[1]][from[2]];
      const reverse = oppositeFaces.has(to[0]);
      // For reversed destinations the phantom enters from the opposite
      // side and slides the opposite way.
      const offset =
        activeFor === "pos" ? (reverse ? STEP : -STEP) : reverse ? -STEP : STEP;
      const px =
        unitAxis === "x"
          ? { x: end.x + offset, y: end.y }
          : { x: end.x, y: end.y + offset };
      // The cube container clips overflow, so a phantom whose start is
      // outside the visible area would be invisible for most of the
      // animation. In that case, place it directly at the destination
      // and just fade it in — gives a consistent "new content arriving"
      // visual.
      const offScreen =
        px.x + SQ <= 0 || px.x >= 637 || px.y + SQ <= 0 || px.y >= 484;
      const startPos = offScreen ? end : px;
      const el = addLiveOverlay(startPos.x, startPos.y, color, 0);
      drag.overlays.push({
        el,
        type: "phantom",
        start: startPos,
        activeFor,
        reverse,
        fadeOnly: offScreen,
      });
    }
    for (const { from, to } of drag.mapPos) addPhantom(from, to, "pos");
    for (const { from, to } of drag.mapNeg) addPhantom(from, to, "neg");
  }
}

function commitOneRotation(sign) {
  const dir = sign > 0 ? drag.dirPos : drag.dirNeg;
  applyRot(drag.rotType, drag.layer, dir);
  moveHistory.push({ rotType: drag.rotType, layer: drag.layer, dir });
  for (const o of drag.overlays) o.el.remove();
  drag.overlays = [];
  render();
  setupOverlays();
}

function applyOverlayState(progress, withTransition) {
  const fp = Math.max(0, Math.min(1, progress / STEP));
  const fn = Math.max(0, Math.min(1, -progress / STEP));

  for (const o of drag.overlays) {
    if (withTransition) {
      o.el.style.transition =
        "transform 160ms ease-out, opacity 160ms ease-out";
    }
    if (o.type === "unit") {
      const mult = o.reverse ? -1 : 1;
      const tx = drag.unitAxis === "x" ? progress * mult : 0;
      const ty = drag.unitAxis === "y" ? progress * mult : 0;
      o.el.style.transform = `translate(${tx}px, ${ty}px)`;
      let op = 1;
      if (progress > 0 && o.wrapPos) op = 1 - fp;
      else if (progress < 0 && o.wrapNeg) op = 1 - fn;
      o.el.style.opacity = op;
    } else if (o.type === "direct") {
      let tx, ty;
      if (progress >= 0) {
        tx = fp * (o.endPos.x - o.start.x);
        ty = fp * (o.endPos.y - o.start.y);
      } else {
        tx = fn * (o.endNeg.x - o.start.x);
        ty = fn * (o.endNeg.y - o.start.y);
      }
      o.el.style.transform = `translate(${tx}px, ${ty}px)`;
    } else if (o.type === "phantom") {
      const mult = o.reverse ? -1 : 1;
      const tx = o.fadeOnly ? 0 : drag.unitAxis === "x" ? progress * mult : 0;
      const ty = o.fadeOnly ? 0 : drag.unitAxis === "y" ? progress * mult : 0;
      o.el.style.transform = `translate(${tx}px, ${ty}px)`;
      o.el.style.opacity = o.activeFor === "pos" ? fp : fn;
    } else if (o.type === "face-rotate") {
      const angle = (progress / STEP) * o.anglePos;
      o.el.style.transform = `rotate(${angle}deg)`;
    } else if (o.type === "arc") {
      const arc = progress >= 0 ? o.arcPos : o.arcNeg;
      const t = progress >= 0 ? fp : fn;
      const ang = arc.sAng + t * arc.dAng;
      const dx = arc.r * (Math.cos(ang) - Math.cos(arc.sAng));
      const dy = arc.r * (Math.sin(ang) - Math.sin(arc.sAng));
      const rotDeg = (t * arc.dAng * 180) / Math.PI;
      o.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotDeg}deg)`;
    }
  }
}

function effectiveProgress() {
  const raw =
    drag.axis === "h"
      ? drag.currentX - drag.startX
      : drag.currentY - drag.startY;
  return raw - drag.committedDelta;
}

function moveDrag(x, y) {
  if (!drag || animating) return;
  drag.currentX = x;
  drag.currentY = y;
  if (!drag.locked) {
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
    lockDrag();
    if (!drag) return;
  }

  let progress = effectiveProgress();
  while (Math.abs(progress) >= STEP) {
    const sign = progress > 0 ? 1 : -1;
    commitOneRotation(sign);
    drag.committedDelta += sign * STEP;
    progress -= sign * STEP;
  }

  applyOverlayState(progress, false);
}

function endDrag() {
  if (!drag || animating) return;
  if (!drag.locked) {
    drag = null;
    return;
  }
  const progress = effectiveProgress();
  const sign = progress > 0 ? 1 : -1;
  const targetProgress = Math.abs(progress) > STEP / 2 ? sign * STEP : 0;
  const final = drag;
  animating = true;

  for (const o of drag.overlays) o.el.classList.remove("live");
  void document.getElementById("cube").offsetHeight;
  applyOverlayState(targetProgress, true);

  const finalRotType = final.rotType;
  const finalLayer = final.layer;
  const finalDirPos = final.dirPos;
  const finalDirNeg = final.dirNeg;
  drag = null;

  setTimeout(() => {
    if (targetProgress > 0) {
      applyRot(finalRotType, finalLayer, finalDirPos);
      moveHistory.push({
        rotType: finalRotType,
        layer: finalLayer,
        dir: finalDirPos,
      });
    } else if (targetProgress < 0) {
      applyRot(finalRotType, finalLayer, finalDirNeg);
      moveHistory.push({
        rotType: finalRotType,
        layer: finalLayer,
        dir: finalDirNeg,
      });
    }
    render();
    removeOverlays(final.overlays, () => {
      animating = false;
    });
  }, 180);
}

// Animate a single rotation programmatically (used by scramble/solve)
function animateMove(rotType, layer, dir, duration) {
  return new Promise((resolve) => {
    // Pick a (face, axis) for the synthetic drag such that dirForDrag(face,
    // axis, +1) === dir. That way positive progress (which is what we feed
    // applyOverlayState below) corresponds to the requested rotation
    // direction, instead of accidentally inverting it.
    let face, axis;
    if (rotType === "Y") {
      axis = "h";
      face = dir === 1 ? F : D;
    } else if (rotType === "X") {
      axis = "v";
      face = dir === 1 ? F : B;
    } else {
      axis = "h";
      face = dir === 1 ? U : D;
    }
    const unitAxis = rotType === "Y" ? "x" : rotType === "X" ? "y" : "x";
    drag = {
      face,
      row: 0,
      col: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      axis,
      rotType,
      layer,
      dirPos: dir,
      dirNeg: -dir,
      unitAxis,
      committedDelta: 0,
      locked: true,
    };
    setupOverlays();
    applyOverlayState(0, false);
    // Drive the animation frame-by-frame ourselves rather than relying
    // on CSS transitions — that way the wrap-in phantoms fade smoothly
    // exactly like during live drag, where applyOverlayState is also
    // called per frame.
    const startTime = performance.now();
    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      applyOverlayState(eased * STEP, false);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        applyRot(rotType, layer, dir);
        const overlays = drag.overlays;
        drag = null;
        render();
        removeOverlays(overlays, resolve);
      }
    }
    requestAnimationFrame(frame);
  });
}

async function performMoveSequence(moves, duration) {
  if (animating) return;
  animating = true;
  for (const m of moves) {
    await animateMove(m.rotType, m.layer, m.dir, duration);
  }
  animating = false;
}

const cubeEl = document.getElementById("cube");

cubeEl.addEventListener("mousedown", (e) => {
  const t = e.target;
  if (!t.classList.contains("sticker") || t.classList.contains("overlay"))
    return;
  e.preventDefault();
  startDrag(
    +t.dataset.face,
    +t.dataset.row,
    +t.dataset.col,
    e.clientX,
    e.clientY,
  );
});
window.addEventListener("mousemove", (e) => {
  if (drag) moveDrag(e.clientX, e.clientY);
});
window.addEventListener("mouseup", endDrag);

cubeEl.addEventListener(
  "touchstart",
  (e) => {
    const t = e.target;
    if (!t.classList.contains("sticker") || t.classList.contains("overlay"))
      return;
    e.preventDefault();
    const tt = e.touches[0];
    startDrag(
      +t.dataset.face,
      +t.dataset.row,
      +t.dataset.col,
      tt.clientX,
      tt.clientY,
    );
  },
  { passive: false },
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (!drag) return;
    e.preventDefault();
    const tt = e.touches[0];
    moveDrag(tt.clientX, tt.clientY);
  },
  { passive: false },
);
window.addEventListener("touchend", endDrag);

document.getElementById("scramble").addEventListener("click", async () => {
  if (animating) return;
  const types = ["Y", "X", "Z"];
  const moves = [];
  let last = null;
  for (let i = 0; i < 20; i++) {
    let t,
      layer,
      dir,
      tries = 0;
    do {
      t = types[Math.floor(Math.random() * 3)];
      layer = Math.floor(Math.random() * 3);
      dir = Math.random() < 0.5 ? 1 : -1;
      tries++;
    } while (last && last.rotType === t && last.layer === layer && tries < 5);
    const m = { rotType: t, layer, dir };
    moves.push(m);
    last = m;
  }
  await performMoveSequence(moves, 260);
  for (const m of moves) moveHistory.push(m);
});

function simplifyMoves(moves) {
  const result = moves.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length - 1; i++) {
      const a = result[i];
      const b = result[i + 1];
      if (a.rotType !== b.rotType || a.layer !== b.layer) continue;
      if (a.dir === -b.dir) {
        result.splice(i, 2);
        changed = true;
        break;
      }
      if (
        i + 2 < result.length &&
        result[i + 2].rotType === a.rotType &&
        result[i + 2].layer === a.layer &&
        result[i + 2].dir === a.dir &&
        b.dir === a.dir
      ) {
        result.splice(i, 3, {
          rotType: a.rotType,
          layer: a.layer,
          dir: -a.dir,
        });
        changed = true;
        break;
      }
    }
  }
  return result;
}

document.getElementById("solve").addEventListener("click", async () => {
  if (animating) return;
  if (moveHistory.length === 0) return;
  const simplified = simplifyMoves(moveHistory);
  const inverse = simplified
    .slice()
    .reverse()
    .map((m) => ({
      rotType: m.rotType,
      layer: m.layer,
      dir: -m.dir,
    }));
  moveHistory = [];
  await performMoveSequence(inverse, 260);
});

resetState();
render();
