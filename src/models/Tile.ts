export default class Tile {
    public letter = '';
    public amount = 0;
    public points = 0;
    public typed = false

    constructor (letter: string, amount: number, points: number) {
      this.letter = letter
      this.amount = amount
      this.points = points
    }
}
