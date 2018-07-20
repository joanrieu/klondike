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
          x: -Infinity,
          y: -Infinity
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
      x: 20,
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

function update() {
  for (const go of gos.values())
    if (go.card)
      updateCard(go)
}

function updateCard(go: GameObject) {
  if (go.stack) {
    go.transform = { ...go.stack.previous.transform! }
    if (go.stack.spaced) {
      go.transform.y += 30
    } else {
      go.transform.x += .2
      go.transform.y += .4
    }
  }
}

// RENDER

const canvas = document.getElementsByTagName("canvas")[0]
const ctx = canvas.getContext("2d")!

requestAnimationFrame(function render() {
  update()

  ctx.fillStyle = "green"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
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

  ctx.fillStyle = faceUp ? "white" : "#EEE";
  ctx.fillRect(x, y, 100, 150)

  ctx.strokeStyle = "#CCC"
  ctx.strokeRect(x, y, 100, 150)

  if (faceUp) {
    // color
    const suitColor = ({
      SPADES: "black",
      HEARTS: "firebrick",
      CLUBS: "black",
      DIAMONDS: "firebrick"
    } as { [key: string]: string })[suit]

    ctx.fillStyle = suitColor
    ctx.textBaseline = "alphabetic"

    const width = 100, height = 150
    const xpad = 10, ypad = 23, ypadneg = 13;

    // rank
    ctx.font = "13pt sans"
    ctx.textAlign = "left"
    ctx.fillText("" + rank, x + xpad, y + ypad)
    ctx.textAlign = "right"
    ctx.fillText("" + rank, x + width - xpad, y + height - ypad + ypadneg)

    // suit
    const suitChar = ({
      SPADES: "\u2660",
      HEARTS: "\u2665",
      CLUBS: "\u2663",
      DIAMONDS: "\u2666"
    } as { [key: string]: string })[suit]
    ctx.font = "16pt sans"
    ctx.textAlign = "right"
    ctx.fillText(suitChar, x + width - xpad, y + ypad)
    ctx.textAlign = "left"
    ctx.fillText(suitChar, x + xpad, y + height - ypad + ypadneg)

    // large suit symbol
    const largeSuitChar = ({
      SPADES: "\u2664",
      HEARTS: "\u2661",
      CLUBS: "\u2667",
      DIAMONDS: "\u2662"
    } as { [key: string]: string })[suit]
    ctx.font = "30pt sans"
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.fillText(largeSuitChar, x + width / 2, y + height / 2)
  }
}
