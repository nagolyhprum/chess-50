import type { ChessController } from "./chess/chess-controller";

export type ChessColor = "dark" | "light" | "neutral";

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn"
  | "crazy"
  | "duck"
  | "archbishop"
  | "chancellor";

export interface Cell {
  column: number;
  row: number;
}

export interface CellPiece extends Cell {
  piece: Piece;
}

export interface Movement {
  column: number;
  row: number;
  enPassant?: string;
  castle?: boolean;
  destinations: Array<CellPiece>;
  captures?: Array<Cell>;
  isCrazy?: boolean;
}

export interface MovementConfig {
  attacksOnly?: boolean;
}

export type MovementFunction = (
  this: Piece,
  controller: ChessController,
  config?: MovementConfig | null | undefined
) => Movement[];

export interface Piece {
  id: string;
  image: HTMLImageElement;
  color: ChessColor;
  movement: MovementFunction;
  type: PieceType;
  column: number;
  row: number;
  moves: number;
  withColor(color: ChessColor): Piece;
  withType(type: PieceType): Piece;
  isPromoted: boolean;
}

export interface BoardState {
  tiles: Array<Array<Piece | null>>;
  enPassantId: string;
  turn: ChessColor;
  turns: number;
  checks: {
    light: number;
    dark: number;
  };
  halfmoves: number;
  wholemoves: number;
  movesSinceCaptureOrPawn: number;
  capturedPieces: {
    light: ChessCaptures;
    dark: ChessCaptures;
    neutral: ChessCaptures;
  };
  lastMovement: LastMovement;
}

export type ChessCaptures = Partial<Record<PieceType, number>>;

export type GameState = "active" | "light_wins" | "dark_wins" | "stalemate";

export interface ChessControllerConfig {
  castleFromTheLeft?: number;
  castleFromTheRight?: number;
  rows?: number;
  columns?: number;
  onDraw?: (this: ChessController, context: CanvasRenderingContext2D) => void;
  getTurns?: (this: ChessController, isNewGame: boolean) => number;
  name: string;
  slug: string;
  canLightFullyMove?: boolean;
  hasCheck?: boolean;
  removeIllegalMoves?: (
    this: ChessController,
    movements: Movement[],
    config: MovementConfig | null | undefined
  ) => Movement[];
  getSelectedPiece?: (this: ChessController) => Piece | null | undefined;
  getGameState?: (this: ChessController) => GameState;
  newGame?: (this: ChessController) => Array<Array<Piece | null>>;
  getPromotions?: (this: ChessController, color: ChessColor) => Piece[];
  onClick?: (this: ChessController, x: number, y: number) => boolean;
  executeMovement?: (this: ChessController, movement: Movement) => void;
}

interface ChessEvent {
  promotion?: Piece;
}

export type ChessEventListener = (event?: ChessEvent) => void;

export type ChessEventName = "afterMove" | "promote";

export interface PieceData {
  type: PieceType;
  color: ChessColor;
  count: number;
}

export interface Drawable<T> {
  type: "text" | "rect";
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  data?: T;
}

export interface StockfishResponse {
  bestmove: string;
  continuation: string;
  evaluation: number;
  mate: string;
  success: boolean;
}

export interface LastMovement {
  from: Cell;
  to: Cell;
}
