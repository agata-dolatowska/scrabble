import TileModel from '@/models/Tile'

export default function chooseRandomLetters (tiles: TileModel[], currentTiles: TileModel[] = []): TileModel[] {
  let randomIndex = 0
  const newSetOfTiles: TileModel[] = JSON.parse(JSON.stringify(currentTiles))

  while (newSetOfTiles.length <= 6) {
    randomIndex = Math.floor(Math.random() * (tiles.length - 0))
    if (tiles[randomIndex].amount > 0) {
      newSetOfTiles.push(tiles[randomIndex])
    }
  }

  return newSetOfTiles
}
