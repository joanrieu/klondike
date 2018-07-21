interface GameObject {
  card?: {
    suit: string,
    rank: number,
    faceUp: boolean
  },
  mouse?: {
    pressed: boolean,
    wasPressed: boolean,
    targets: {
      card?: GameObject,
      slot?: GameObject
    }
  },
  slot?: {
    kind: "pile",
    pile: number
  } | {
    kind: "stock"
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
      slot: {
        kind: "pile",
        pile
      },
      transform: {
        x: pile * 120 - 50,
        y: 300,
        width: 100,
        height: Infinity
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
    slot: {
      kind: "stock"
    },
    transform: {
      x: 70,
      y: 100,
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
      pressed: false,
      wasPressed: false,
      targets: {}
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
    const { x: px, y: py } = go.stack.previous.transform!
    if (go.stack.spaced) {
      go.transform!.x = px
      go.transform!.y = py + 30
    } else {
      go.transform!.x = px + .2
      go.transform!.y = py + .4
    }
  }
}

function updateMouse(go: GameObject) {
  // detect card & slot under mouse
  const { x, y } = go.transform!
  const cards = [...gos.values()]
    .filter(go => go.card || go.slot)
    .filter(go => go.transform!.x - go.transform!.width / 2 <= x && x < go.transform!.x + go.transform!.width / 2)
    .filter(go => go.transform!.y - go.transform!.height / 2 <= y && y < go.transform!.y + go.transform!.height / 2)
    .sort((a, b) => a.transform!.y - b.transform!.y)
  const card = cards.filter(go => go.card).pop()
  const slot = cards.filter(go => go.slot).pop()
  go.mouse!.targets = { card, slot }

  // move card when pressed
  const { pressed, wasPressed } = go.mouse!
  const changed = pressed !== wasPressed
  go.mouse!.wasPressed = go.mouse!.pressed
  if (changed) {
    if (pressed && card)
      card.stack = { previous: go, spaced: false }
    else if (!pressed && card)
      delete card.stack
  }
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
  const halfwidth = width / 2, halfheight = height / 2

  ctx.fillStyle = faceUp ? "white" : "#EEE";
  ctx.fillRect(x - halfwidth, y - halfheight, width, height)

  ctx.strokeStyle = "#CCC"
  ctx.strokeRect(x - halfwidth, y - halfheight, width, height)

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
    ctx.fillText("" + rank, x - halfwidth + xpad, y - halfheight + ypad)
    ctx.textAlign = "right"
    ctx.fillText("" + rank, x + halfwidth - xpad, y + halfheight - ypad + ypadneg)

    // suit
    const suitChar = ({
      SPADES: "\u2660",
      HEARTS: "\u2665",
      CLUBS: "\u2663",
      DIAMONDS: "\u2666"
    } as { [key: string]: string })[suit]
    ctx.font = "16pt sans"
    ctx.textAlign = "right"
    ctx.fillText(suitChar, x + halfwidth - xpad, y - halfheight + ypad)
    ctx.textAlign = "left"
    ctx.fillText(suitChar, x - halfwidth + xpad, y + halfheight - ypad + ypadneg)

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
    ctx.fillText(largeSuitChar, x, y)
  }
}

function renderMouse() {
  for (const go of gos.values()) {
    if (go.mouse) {
      const { x, y } = go.transform!
      const { pressed, targets } = go.mouse!
      const rad = 5

      ctx.fillStyle = pressed ? "red" : "grey"
      ctx.fillRect(x - rad, y - rad, 2 * rad, 2 * rad)

      ctx.font = "8pt sans"
      ctx.fillStyle = "blue"
      ctx.textAlign = "left"
      if (targets.card)
        ctx.fillText(targets.card.card!.rank + " of " + targets.card.card!.suit, x + 10, y)
      if (targets.slot)
        ctx.fillText(Object.values(targets.slot.slot!).join(" "), x + 10, y - 15)
    }
  }
}
