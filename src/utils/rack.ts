import TileModel from '@/models/Tile'

export default function chooseRandomLetters (tiles: TileModel[], currentTiles: TileModel[] = []): TileModel[] {
  let randomIndex = 0
  const newSetOfTiles: TileModel[] = JSON.parse(JSON.stringify(currentTiles))
  const tilesCopy: TileModel[] = JSON.parse(JSON.stringify(tiles))
  let availableTiles = tilesCopy.some(tiles => tiles.amount > 0)

  while (newSetOfTiles.length <= 6 &&
    availableTiles) {
    randomIndex = Math.floor(Math.random() * (tiles.length - 0))

    if (tilesCopy[randomIndex].amount > 0) {
      newSetOfTiles.push(tiles[randomIndex])
      tilesCopy[randomIndex].amount--
      availableTiles = tilesCopy.some(tiles => tiles.amount > 0)
    }
  }

  return newSetOfTiles
}
