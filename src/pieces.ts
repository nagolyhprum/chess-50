import type {
  BoardState,
  ChessColor,
  Move,
  MoveFunction,
  Piece,
  PieceType,
} from "./types";

const loadImage = (() => {
  const cache: Record<string, HTMLImageElement> = {};
  return (src: string) => {
    if (!cache[src]) {
      const image = new Image();
      image.src = src;
      cache[src] = image;
    }
    return cache[src];
  };
})();

const removeIllegalMoves = (board: BoardState, movements: Move[]) => {
  return movements.filter((movement) => {
    // REMOVE OUT OF BOUNDS
    if (
      movement.column < 0 ||
      movement.column >= 8 ||
      movement.row < 0 ||
      movement.row >= 8
    ) {
      return false;
    }
    // REMOVE SELF CAPTURES
    if (board.tiles[movement.row]?.[movement.column]?.color === board.turn) {
      return false;
    }

    // TODO REMOVE SELF CHECKS
    return true;
  });
};

const piece = ({
  color,
  type,
  move,
}: {
  color: ChessColor;
  type: PieceType;
  move: MoveFunction;
}): Piece => {
  return {
    id: crypto.randomUUID(),
    color,
    image: loadImage(`${color}_${type}.png`),
    move(board, config) {
      return removeIllegalMoves(board, move.call(this, board, config));
    },
    type,
    column: 0,
    row: 0,
  };
};

export const pawn = (color: ChessColor) =>
  piece({
    color,
    type: "pawn",
    move(board, config) {
      const movement: Move[] = [];
      const direction = this.color === "dark" ? 1 : -1;
      const forward = board.tiles[this.row + direction][this.column];
      const forward2 = board.tiles[this.row + 2 * direction][this.column];
      if (!config?.attacksOnly) {
        // HANDLE FORWARD 2
        const isStarting = this.row === 1 || this.row === 6;
        if (isStarting && !forward && !forward2) {
          movement.push({
            column: this.column,
            row: this.row + direction * 2,
            enPassant: true,
          });
        }
        // HANDLE FORWARD 1
        if (!forward) {
          movement.push({
            column: this.column,
            row: this.row + direction,
          });
        }
      }
      const canEnPassant =
        (this.color === "light" && this.row === 3) ||
        (this.color === "dark" && this.row === 4);
      // HANDLE CAPTURE
      const forwardLeft = board.tiles[this.row + direction][this.column - 1];
      const left = board.tiles[this.row][this.column - 1];
      const leftPawnJustMoved =
        canEnPassant &&
        left?.type === "pawn" &&
        left.id === board.enPassantId &&
        left.color !== this.color;
      if (
        config?.attacksOnly ||
        (forwardLeft && forwardLeft.color !== this.color)
      ) {
        movement.push({
          column: this.column - 1,
          row: this.row + direction,
        });
      }
      if (leftPawnJustMoved) {
        movement.push({
          column: this.column - 1,
          row: this.row + direction,
          captures: [
            {
              column: this.column - 1,
              row: this.row,
            },
          ],
        });
      }
      const forwardRight = board.tiles[this.row + direction][this.column + 1];
      const right = board.tiles[this.row][this.column + 1];
      const rightPawnJustMoved =
        canEnPassant &&
        right?.type === "pawn" &&
        right.id === board.enPassantId &&
        right.color !== this.color;
      if (
        config?.attacksOnly ||
        (forwardRight && forwardRight.color !== this.color)
      ) {
        movement.push({
          column: this.column + 1,
          row: this.row + direction,
        });
      }
      if (rightPawnJustMoved) {
        movement.push({
          column: this.column + 1,
          row: this.row + direction,
          captures: [
            {
              row: this.row,
              column: this.column + 1,
            },
          ],
        });
      }
      return movement;
    },
  });

export const rook = (color: ChessColor) =>
  piece({
    color,
    type: "rook",
    move(board) {
      const breaksQueenSideCastle = this.column === 0 && this.row % 7 === 0;
      const breaksKingSideCastle = this.column === 7 && this.row % 7 === 0;
      return horizontal(board, this, 7).map((movement) => ({
        ...movement,
        breaksQueenSideCastle,
        breaksKingSideCastle,
      }));
    },
  });

const horizontal = (board: BoardState, piece: Piece, max: number) => {
  const movement: Move[] = [];
  movement.push(...longMovement(board, piece.column, piece.row, 1, 0, max));
  movement.push(...longMovement(board, piece.column, piece.row, -1, 0, max));
  movement.push(...longMovement(board, piece.column, piece.row, 0, 1, max));
  movement.push(...longMovement(board, piece.column, piece.row, 0, -1, max));
  return movement;
};

const diagonal = (board: BoardState, piece: Piece, max: number) => {
  const movement: Move[] = [];
  movement.push(...longMovement(board, piece.column, piece.row, 1, 1, max));
  movement.push(...longMovement(board, piece.column, piece.row, -1, -1, max));
  movement.push(...longMovement(board, piece.column, piece.row, 1, -1, max));
  movement.push(...longMovement(board, piece.column, piece.row, -1, 1, max));
  return movement;
};

const longMovement = (
  board: BoardState,
  column: number,
  row: number,
  columnMovement: number,
  rowMovement: number,
  max: number
) => {
  const movement: Move[] = [];
  let blocker: Piece | null = null;
  for (let offset = 1; offset <= max && !blocker; offset++) {
    const offsetRow = row + offset * rowMovement;
    const offsetColumn = column + offset * columnMovement;
    blocker = board.tiles[offsetRow]?.[offsetColumn];
    movement.push({
      row: offsetRow,
      column: offsetColumn,
    });
  }
  return movement;
};

export const knight = (color: ChessColor) =>
  piece({
    color,
    type: "knight",
    move() {
      const movements: Move[] = [];
      for (const column of [1, 2]) {
        const row = column === 1 ? 2 : 1;
        movements.push({
          column: this.column + column,
          row: this.row + row,
        });
        movements.push({
          column: this.column - column,
          row: this.row + row,
        });
        movements.push({
          column: this.column + column,
          row: this.row - row,
        });
        movements.push({
          column: this.column - column,
          row: this.row - row,
        });
      }
      return movements;
    },
  });

export const bishop = (color: ChessColor) =>
  piece({
    color,
    type: "bishop",
    move(board) {
      return diagonal(board, this, 7);
    },
  });

export const getAttacks = (board: BoardState) => {
  return board.tiles
    .flat()
    .filter(
      (piece: Piece | null): piece is Piece =>
        !!piece && piece.color !== board.turn
    )
    .flatMap((piece) =>
      piece.move(board, {
        attacksOnly: true,
      })
    );
};

export const king = (color: ChessColor) =>
  piece({
    color,
    type: "king",
    move(board, config) {
      const movements: Move[] = [];
      if (!config?.attacksOnly) {
        const attacks = getAttacks(board);
        if (board[board.turn].canKingSideCastle) {
          // look for blockers
          const bishop = board.tiles[this.row][this.column + 1];
          const knight = board.tiles[this.row][this.column + 2];
          if (!bishop && !knight) {
            const attack = attacks.find(
              (movement) =>
                (movement.row === this.row &&
                  movement.column === this.column) ||
                (movement.row === this.row &&
                  movement.column === this.column + 1) ||
                (movement.row === this.row &&
                  movement.column === this.column + 2)
            );
            if (!attack) {
              movements.push({
                column: this.column + 2,
                row: this.row,
                movements: [
                  {
                    from: {
                      row: this.row,
                      column: 7,
                    },
                    to: {
                      row: this.row,
                      column: 5,
                    },
                  },
                ],
              });
            }
          }
        }
        if (board[board.turn].canQueenSideCastle) {
          // look for blockers
          const queen = board.tiles[this.row][this.column - 1];
          const bishop = board.tiles[this.row][this.column - 2];
          const knight = board.tiles[this.row][this.column - 3];
          if (!queen && !bishop && !knight) {
            const attack = attacks.find(
              (movement) =>
                (movement.row === this.row &&
                  movement.column === this.column) ||
                (movement.row === this.row &&
                  movement.column === this.column - 1) ||
                (movement.row === this.row &&
                  movement.column === this.column - 2)
            );
            if (!attack) {
              movements.push({
                column: this.column - 2,
                row: this.row,
                movements: [
                  {
                    from: {
                      row: this.row,
                      column: 0,
                    },
                    to: {
                      row: this.row,
                      column: 3,
                    },
                  },
                ],
              });
            }
          }
        }
      }
      return [
        ...movements,
        ...horizontal(board, this, 1),
        ...diagonal(board, this, 1),
      ];
    },
  });

export const queen = (color: ChessColor) =>
  piece({
    color,
    type: "queen",
    move(board) {
      return [...horizontal(board, this, 7), ...diagonal(board, this, 7)];
    },
  });

// TODO
// cant go into check
// detect end game
// PAWN PROMOTION
