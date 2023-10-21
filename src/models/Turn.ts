import Square from './Square'
import Word from './Word'

export default class Turn {
    public allLettersBonus = false
    public savedWords: Word[] = []
    public typedLetters: Square[] = []
    public points = 0
}
