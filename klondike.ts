interface GameObject {
  card?: {
    suit: string,
    rank: number,
    faceUp: boolean
  },
  stack?: {
    previous: GameObject,
    spaced: boolean
  },
  transform?: {
    x: number,
    y: number
  }
}

// INIT

const gos = new Set<GameObject>()

// create cards
{
  for (const suit of ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"])
    for (let rank = 1; rank <= 13; ++rank)
      gos.add({
        card: {
          suit,
          rank,
          faceUp: false
        },
        transform: {
          x: Math.random() * 1024 | 0,
          y: Math.random() * 768 | 0
        }
      })
}

// deal cards
{
  const shuffledDeck = [...gos.values()].sort((a, b) => Math.random() - .5)
  for (let pile = 1; pile <= 7; ++pile) {
    let previous: GameObject = {
      transform: {
        x: pile * 120 - 100,
        y: 200
      }
    }
    gos.add(previous)
    for (let position = 1; position <= pile; ++position) {
      const card = shuffledDeck.pop()!
      card.stack = {
        previous,
        spaced: position > 1
      }
      previous = card
    }
    previous.card!.faceUp = true
  }
  let previous: GameObject = {
    transform: {
      x: 7 * 120 - 100,
      y: 20
    }
  }
  gos.add(previous)
  for (const card of shuffledDeck) {
    card.stack = {
      previous,
      spaced: false
    }
    previous = card
  }
  previous.card!.faceUp = true
}

// UPDATE

setInterval(function update() {
  for (const go of gos.values())
    if (go.card)
      updateCard(go)
}, 10)

function updateCard(go: GameObject) {
  if (go.stack) {
    go.transform = { ...go.stack.previous.transform! }
    if (go.stack.spaced) {
      go.transform.y += 30
    } else {
      go.transform.x += .1
      go.transform.y += .2
    }
  }
}

// RENDER

const canvas = document.getElementsByTagName("canvas")[0]
const ctx = canvas.getContext("2d")!

requestAnimationFrame(function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  renderCards()
  requestAnimationFrame(render)
})

function renderCards() {
  const sortedCards = [...gos.values()]
    .filter(go => go.card)
    .sort((a, b) => a.transform!.y - b.transform!.y)
  for (const go of sortedCards)
    renderCard(go)
}

function renderCard(go: GameObject) {
  const { suit, rank, faceUp } = go.card!
  const { x, y } = go.transform!
  ctx.clearRect(x, y, 100, 150)
  ctx.strokeRect(x, y, 100, 150)
  const text = faceUp ? rank + " of " + suit : "?"
  ctx.fillText(text, x + 10, y + 20)
}
