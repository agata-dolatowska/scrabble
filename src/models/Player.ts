import TileModel from '@/models/Tile'

export default class Player {
  public availableTiles: TileModel[] = []
  public name = ''
  public id: number

  constructor (id: number) {
    this.id = id
  }
}
