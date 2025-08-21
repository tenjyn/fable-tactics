const { initialSetup, legalMoves, movesPawn, resolveCombat, movePiece, pieceStats } = require('../gameEngine');

describe('initialSetup', () => {
  test('places all pieces correctly', () => {
    const S = initialSetup();
    expect(Object.keys(S.pos)).toHaveLength(32);
    expect(S.pos.e1).toBe('wK#1');
    expect(S.pos.d8).toBe('bQ#1');
  });
});

describe('legalMoves and movesPawn', () => {
  test('white pawn forward move from start', () => {
    const S = initialSetup();
    const pid = S.pos['a2'];
    const moves = legalMoves(S, pid);
    expect(moves).toEqual([{ from: 'a2', to: 'a3' }]);
  });

  test('pawn captures diagonally', () => {
    const S = initialSetup();
    const wPawn = S.pos['d2'];
    movePiece(S, wPawn, 'd4');
    const bPawn = S.pos['e7'];
    movePiece(S, bPawn, 'e5');
    const moves = movesPawn(S, S.pieces[wPawn], 'd4');
    expect(moves).toEqual([
      { from: 'd4', to: 'd5' },
      { from: 'd4', to: 'e5' }
    ]);
  });
});

describe('combat resolution', () => {
  test('damages but does not defeat defender', () => {
    const S = initialSetup();
    const wPawn = S.pos['d2'];
    movePiece(S, wPawn, 'd4');
    const bPawn = S.pos['e7'];
    movePiece(S, bPawn, 'e5');
    const result = resolveCombat(S, wPawn, 'e5');
    expect(result.type).toBe('hit');
    expect(S.pieces[bPawn].hp).toBe(pieceStats.P.hp - Math.max(1, S.pieces[wPawn].atk - S.pieces[bPawn].def));
    expect(S.loc[wPawn]).toBe('d4');
    expect(S.pos['e5']).toBe(bPawn);
  });

  test('defeats defender and moves attacker', () => {
    const S = initialSetup();
    const wQueen = S.pos['d1'];
    movePiece(S, wQueen, 'd4');
    const bPawn = S.pos['e7'];
    movePiece(S, bPawn, 'e5');
    const result = resolveCombat(S, wQueen, 'e5');
    expect(result.type).toBe('defeat');
    expect(S.pos['e5']).toBe(wQueen);
    expect(S.loc[wQueen]).toBe('e5');
    expect(S.loc[bPawn]).toBeUndefined();
  });
});
