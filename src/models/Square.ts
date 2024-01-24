export default class Square {
    public id: string;
    public bonus = '';
    public letter = '';
    public row: number;
    public column: number;
    public isBlocked = false

    constructor (id: string, row: number, column: number) {
      this.id = id
      this.row = row
      this.column = column
    }
}
