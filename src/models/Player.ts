import TileModel from '@/models/Tile'
import TurnModel from '@/models/Turn'

export default class Player {
  public availableTiles: TileModel[] = []
  public name = ''
  public id: number
  public score: TurnModel[] = []

  constructor (id: number) {
    this.id = id
  }
}
