interface GameObject {
  card?: {
    suit: string,
    rank: number,
    faceUp: boolean
  },
  renderer?: {
    render: (go: GameObject, ctx: CanvasRenderingContext2D) => void
  },
  transform?: {
    x: number,
    y: number
  }
}

const cardRenderer = {
  render(go: GameObject, ctx: CanvasRenderingContext2D) {
    const { suit, rank, faceUp } = go.card!
    const { x, y } = go.transform!
    ctx.clearRect(x, y, 100, 150)
    ctx.strokeRect(x, y, 100, 150)
    const text = faceUp ? rank + " of " + suit : "?"
    ctx.fillText(text, x + 10, y + 20)
  }
}

const gos = [] as GameObject[]

for (const suit of ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"])
  for (const rank of [1 /* ACE */, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 /* JACK */, 12 /* QUEEN */, 13 /* KING */])
    gos.push({
      card: {
        suit,
        rank,
        faceUp: false
      },
      renderer: cardRenderer,
      transform: {
        x: Math.random() * 800 | 0,
        y: Math.random() * 600 | 0
      }
    })

const canvas = document.getElementsByTagName("canvas")[0]
const ctx = canvas.getContext("2d")!

requestAnimationFrame(function render() {
  for (const go of gos)
    if (go.renderer)
      go.renderer.render(go, ctx)
  requestAnimationFrame(render)
})