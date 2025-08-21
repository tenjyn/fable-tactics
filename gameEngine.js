const pieceStats = {
  K:{hp:10, atk:3, def:2},
  Q:{hp:7, atk:5, def:1, move:7},
  R:{hp:6, atk:4, def:2, move:7},
  B:{hp:5, atk:3, def:1, move:7},
  N:{hp:5, atk:3, def:2},
  P:{hp:3, atk:2, def:0}
};

const files = ['a','b','c','d','e','f','g','h'];

function makePiece(color, kind, stats){
  return {
    id: null,
    color, kind,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    move: stats.move || 0
  };
}

function initialSetup(){
  const pos = {};
  const pieces = {};
  const loc = {};
  const ranks = { w:{back:1,pawn:2}, b:{back:8,pawn:7} };
  for (const color of ['w','b']){
    const order = ['R','N','B','Q','K','B','N','R'];
    const counts = {K:0,Q:0,R:0,B:0,N:0,P:0};
    const rank = ranks[color];
    // back rank
    for (let i=0;i<8;i++){
      const kind = order[i];
      counts[kind]++;
      const sq = files[i] + rank.back;
      addPiece(color, kind, counts[kind], sq);
    }
    // pawns
    for (let i=0;i<8;i++){
      counts.P++;
      const sq = files[i] + rank.pawn;
      addPiece(color, 'P', counts.P, sq);
    }
  }
  function addPiece(color, kind, idx, sq){
    const id = `${color}${kind}#${idx}`;
    const piece = makePiece(color, kind, pieceStats[kind]);
    piece.id = id;
    pos[sq] = id;
    pieces[id] = piece;
    loc[id] = sq;
  }
  return {pos, pieces, loc, turn:'w', selected:null, flipped:false, over:false, log:[]};
}

function sqToRC(sq){ return [8 - parseInt(sq[1]), files.indexOf(sq[0])]; }
function rcToSq(r,c){ return files[c] + (8 - r); }
function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

function movesPawn(state, p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  const dir = p.color==='w' ? 1 : -1;
  const fr = r - dir;
  if (inBounds(fr,c) && !state.pos[rcToSq(fr,c)]) moves.push({from, to: rcToSq(fr,c)});
  for (const dc of [-1,1]){
    const tr = r - dir, tc = c + dc;
    if (!inBounds(tr,tc)) continue;
    const sq = rcToSq(tr,tc);
    if (state.pos[sq] && state.pieces[state.pos[sq]].color !== p.color) moves.push({from, to: sq});
  }
  return moves;
}

function movesKnight(state, p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr,dc] of deltas){
    const tr=r+dr, tc=c+dc;
    if (!inBounds(tr,tc)) continue;
    const sq = rcToSq(tr,tc);
    const occ = state.pos[sq];
    if (!occ || state.pieces[occ].color !== p.color) moves.push({from, to:sq});
  }
  return moves;
}

function movesRay(state, p, from, dirs){
  const [r,c] = sqToRC(from);
  const moves = [];
  for (const [dr,dc] of dirs){
    let steps=0, tr=r, tc=c;
    while (true){
      tr+=dr; tc+=dc; steps++;
      if (steps > (p.move||7)) break;
      if (!inBounds(tr,tc)) break;
      const toSq = rcToSq(tr,tc);
      const occ = state.pos[toSq];
      if (!occ){ moves.push({from, to:toSq}); }
      else {
        if (state.pieces[occ].color !== p.color) moves.push({from, to:toSq});
        break;
      }
    }
  }
  return moves;
}

function movesKing(state, p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  for (let dr=-1; dr<=1; dr++){
    for (let dc=-1; dc<=1; dc++){
      if (dr===0 && dc===0) continue;
      const tr=r+dr, tc=c+dc;
      if (!inBounds(tr,tc)) continue;
      const sq=rcToSq(tr,tc);
      const occ=state.pos[sq];
      if (!occ || state.pieces[occ].color !== p.color) moves.push({from, to:sq});
    }
  }
  return moves;
}

const moveGenerators = {
  P: (state, p, from) => movesPawn(state, p, from),
  N: (state, p, from) => movesKnight(state, p, from),
  B: (state, p, from) => movesRay(state, p, from, [[1,1],[1,-1],[-1,1],[-1,-1]]),
  R: (state, p, from) => movesRay(state, p, from, [[1,0],[-1,0],[0,1],[0,-1]]),
  Q: (state, p, from) => movesRay(state, p, from, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]),
  K: (state, p, from) => movesKing(state, p, from)
};

function legalMoves(state, pid){
  const from = state.loc[pid];
  if (!from) return [];
  const p = state.pieces[pid];
  return moveGenerators[p.kind](state, p, from);
}

function movePiece(state, pid, to){
  const from = state.loc[pid];
  if (from) delete state.pos[from];
  state.pos[to] = pid;
  state.loc[pid] = to;
}

function resolveCombat(state, attackerId, targetSq){
  const attacker = state.pieces[attackerId];
  const defenderId = state.pos[targetSq];
  if (!defenderId){
    movePiece(state, attackerId, targetSq);
    return {type:'move', dmg:0};
  }
  const defender = state.pieces[defenderId];
  const dmg = Math.max(1, attacker.atk - defender.def);
  defender.hp -= dmg;
  if (defender.hp <= 0){
    delete state.pos[targetSq];
    delete state.loc[defenderId];
    movePiece(state, attackerId, targetSq);
    return {type:'defeat', dmg};
  } else {
    return {type:'hit', dmg, hp: defender.hp};
  }
}

module.exports = {
  initialSetup,
  legalMoves,
  movesPawn,
  resolveCombat,
  movePiece,
  pieceStats
};
