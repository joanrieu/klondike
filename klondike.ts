interface GameObject {
  card?: {
    suit: string,
    rank: number,
    faceUp: boolean
  },
  mouse?: {
    pressed: boolean,
    target?: GameObject
  },
  stack?: {
    previous: GameObject,
    spaced: boolean
  },
  transform?: {
    x: number,
    y: number,
    width: number,
    height: number
  }
}

// INIT

const gos = new Set<GameObject>()
const canvas = document.getElementsByTagName("canvas")[0]
const ctx = canvas.getContext("2d")!

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
          y: -Infinity,
          width: 100,
          height: 150
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
        y: 200,
        width: 100,
        height: 150
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
      y: 20,
      width: 100,
      height: 150
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

// watch mouse events
{
  const go: GameObject = {
    mouse: {
      pressed: false
    },
    transform: {
      x: -Infinity,
      y: -Infinity,
      width: 1,
      height: 1
    }
  }
  gos.add(go)
  canvas.addEventListener("mousedown", () => go.mouse!.pressed = true)
  canvas.addEventListener("mouseup", () => go.mouse!.pressed = false)
  canvas.addEventListener("mousemove", ({ offsetX: x, offsetY: y }) => (go.transform!.x = x, go.transform!.y = y))
}

// UPDATE

setInterval(function update() {
  for (const go of gos.values()) {
    if (go.card)
      updateCard(go)
    if (go.mouse)
      updateMouse(go)
  }
}, 13)

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

function updateMouse(go: GameObject) {
  const { pressed } = go.mouse!
  const { x, y } = go.transform!
  const cards = [...gos.values()]
    .filter(go => go.card)
    .filter(go => go.transform!.x <= x && x < go.transform!.x + go.transform!.width)
    .filter(go => go.transform!.y <= y && y < go.transform!.y + go.transform!.height)
    .sort((a, b) => a.transform!.y - b.transform!.y)
  const card = cards.pop()
  go.mouse!.target = card
}

// RENDER

requestAnimationFrame(function render() {
  ctx.fillStyle = "green"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  renderCards()
  renderMouse()

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
  const { x, y, width, height } = go.transform!

  ctx.fillStyle = faceUp ? "white" : "#EEE";
  ctx.fillRect(x, y, width, height)

  ctx.strokeStyle = "#CCC"
  ctx.strokeRect(x, y, width, height)

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

function renderMouse() {
  for (const go of gos.values()) {
    if (go.mouse) {
      const { x, y } = go.transform!
      const { pressed, target } = go.mouse!
      const rad = 5

      ctx.fillStyle = pressed ? "red" : "grey"
      ctx.fillRect(x - rad, y - rad, 2 * rad, 2 * rad)

      ctx.font = "8pt sans"
      ctx.fillStyle = "blue"
      ctx.textAlign = "left"
      if (target && target.card)
        ctx.fillText(target.card.rank + " of " + target.card.suit, x + 10, y)
    }
  }
}
