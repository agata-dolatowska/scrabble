import TileModel from '@/models/Tile'

export default function chooseRandomLetters (tiles: TileModel[], currentTiles: TileModel[] = []): TileModel[] {
  let randomIndex = 0
  const newSetOfTiles: TileModel[] = JSON.parse(JSON.stringify(currentTiles))
  const tilesCopy: TileModel[] = JSON.parse(JSON.stringify(tiles))

  while (newSetOfTiles.length <= 6) {
    randomIndex = Math.floor(Math.random() * (tiles.length - 0))

    if (tilesCopy[randomIndex].amount > 0) {
      newSetOfTiles.push(tiles[randomIndex])
      tilesCopy[randomIndex].amount--
    }
  }

  return newSetOfTiles
}
