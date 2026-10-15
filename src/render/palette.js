// TMS9918 (MSX1) palette as RGB. Index 0 is transparent and drawn as black.
export const PALETTE = [
  [0, 0, 0], [0, 0, 0], [33, 200, 66], [94, 220, 120],
  [84, 85, 237], [125, 118, 252], [212, 82, 77], [66, 235, 245],
  [252, 85, 84], [255, 121, 120], [212, 193, 84], [230, 206, 128],
  [33, 176, 59], [201, 91, 186], [204, 204, 204], [255, 255, 255],
];

export const COLOR = Object.freeze({
  BLACK: 1, LEFT_BIKE: 6, BORDER: 7, TEXT: 10, RIGHT_BIKE: 12, OBSTACLE: 13, WHITE: 15,
});
