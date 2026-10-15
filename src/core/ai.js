// Computer player for the left bike. See "Computer player" in docs/original-analysis.md.
import { isBlocked, moveFrom } from './field.js';

const turnRight = (dir) => (dir + 2) & 7;
const turnLeft = (dir) => (dir - 2) & 7;

const blockedAhead = (game, bike, dir) => {
  const { x, y } = moveFrom(bike.x, bike.y, dir);
  return isBlocked(game, x, y);
};

/** Direction the computer wants for this move. */
export function chooseDirection(game, player) {
  const bike = game.players[player];
  const { dir } = bike;
  if (!blockedAhead(game, bike, dir)) return dir;

  const right = turnRight(dir);
  const left = turnLeft(dir);
  if (blockedAhead(game, bike, right)) return left;
  if (blockedAhead(game, bike, left)) return right;
  return game.rng(2) === 0 ? right : left;
}
