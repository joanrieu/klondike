interface GameObject {
  card?: {
    suit: string,
    rank: number,
    faceUp: boolean
  },
  firework?: {
    life: number,
    color: string,
    ax: number,
    ay: number,
    vx: number,
    vy: number
  },
  grab?: {
    dx: number,
    dy: number,
    stack: GameObject["stack"] & {}
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
  } | {
    kind: "discard"
  } | {
    kind: "foundation",
    foundation: number
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
}

// create discard slot
{
  const go: GameObject = {
    slot: {
      kind: "discard"
    },
    transform: {
      x: 190,
      y: 100,
      width: 100,
      height: 150
    }
  }
  gos.add(go)
}

// create foundation
{
  for (let foundation = 1; foundation <= 4; ++foundation) {
    const go: GameObject = {
      slot: {
        kind: "foundation",
        foundation
      },
      transform: {
        x: 120 * foundation + 310,
        y: 100,
        width: 100,
        height: 150
      }
    }
    gos.add(go)
  }
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
  canvas.addEventListener("mousedown", event => {
    go.mouse!.pressed = true
    event.preventDefault()
  })
  canvas.addEventListener("mouseup", event => {
    go.mouse!.pressed = false
    event.preventDefault()
  })
  canvas.addEventListener("mousemove", event => {
    go.transform!.x = event.offsetX / canvas.offsetWidth * canvas.width
    go.transform!.y = event.offsetY / canvas.offsetHeight * canvas.height
    event.preventDefault()
  })
  canvas.addEventListener("touchstart", event => {
    go.mouse!.pressed = true
    const { left, top } = canvas.getBoundingClientRect()
    go.transform!.x = (event.touches[0].clientX - left) / canvas.offsetWidth * canvas.width
    go.transform!.y = (event.touches[0].clientY - top) / canvas.offsetHeight * canvas.height
    event.preventDefault()
  })
  canvas.addEventListener("touchmove", event => {
    const { left, top } = canvas.getBoundingClientRect()
    go.transform!.x = (event.touches[0].clientX - left) / canvas.offsetWidth * canvas.width
    go.transform!.y = (event.touches[0].clientY - top) / canvas.offsetHeight * canvas.height
    event.preventDefault()
  })
  canvas.addEventListener("touchend", event => {
    go.mouse!.pressed = false
    event.preventDefault()
  })
  canvas.addEventListener("touchcancel", event => {
    go.mouse!.pressed = false
    event.preventDefault()
  })
}

// UPDATE

function update() {
  for (const go of gos.values()) {
    if (go.grab)
      updateGrab(go)
    if (go.mouse)
      updateMouse(go)
  }
  for (const go of gos.values()) {
    if (go.card)
      updateCard(go)
  }
  updateFireworks()
}

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

function updateFireworks() {
  let found = false
  for (const go of gos.values()) {
    if (go.firework) {
      found = true
      updateFirework(go)
    }
  }
  if (!found) {
    const won = ![...gos.values()]
      .filter(go => go.slot && go.slot.kind === "foundation")
      .map(findTopCardOfSlot)
      .find(go => !go.card || go.card.rank < 13)
    if (won)
      spawnFireworks()
  }
}

function updateFirework(go: GameObject) {
  if (go.firework!.life-- > 0) {
    // gravity
    go.firework!.ay += 0.001

    // physics
    go.firework!.vx += go.firework!.ax
    go.transform!.x += go.firework!.vx
    go.firework!.vy += go.firework!.ay
    go.transform!.y += go.firework!.vy
  } else {
    gos.delete(go)
  }
}

function spawnFireworks() {
  const color = Math.random() < .5 ? "firebrick" : "white"
  const x = Math.random() * canvas.width
  const y = (Math.random() ** 2) * canvas.height
  for (let i = 0; i < 10; i++) {
    const go: GameObject = {
      firework: {
        life: Math.random() * 1000,
        color,
        ax: (Math.random() - .5) * .05,
        ay: Math.random() * -.05,
        vx: 0,
        vy: 0
      },
      transform: {
        x,
        y,
        width: 10,
        height: 10
      }
    }
    gos.add(go)
  }
  setTimeout(spawnFireworks, Math.random() * 400)
}

function updateGrab(go: GameObject) {
  const mouse = [...gos.values()].find(go => !!go.mouse)!
  go.transform!.x = mouse.transform!.x + go.grab!.dx
  go.transform!.y = mouse.transform!.y + go.grab!.dy
}

function updateMouse(go: GameObject) {
  // detect card & slot under mouse
  const { x, y } = go.transform!
  const card = [...gos.values()]
    .filter(go =>
      go.card
        && x >= go.transform!.x - go.transform!.width / 2
        && x < go.transform!.x + go.transform!.width / 2
        && y >= go.transform!.y - go.transform!.height / 2
        && y < go.transform!.y + go.transform!.height / 2
    )
    .sort((a, b) => a.transform!.y - b.transform!.y)
    .pop()
  const slot = [...gos.values()]
    .filter(go =>
      go.slot
        && x >= go.transform!.x - go.transform!.width / 2
        && x < go.transform!.x + go.transform!.width / 2
        && y >= go.transform!.y - go.transform!.height / 2
        && (go.slot!.kind === "pile" || y < go.transform!.y + go.transform!.height / 2)
    )
    .sort((a, b) => a.transform!.y - b.transform!.y)
    .pop()
  go.mouse!.targets = { card, slot }

  // move card when pressed
  const { pressed, wasPressed } = go.mouse!
  const changed = pressed !== wasPressed
  go.mouse!.wasPressed = go.mouse!.pressed
  if (changed) {
    const grabbedCard = [...gos.values()].find(go => !!go.grab)
    if (!grabbedCard && pressed) {
      if (card) {
        if (card.card!.faceUp) {
          // start moving a card
          card.grab = {
            dx: card.transform!.x - x,
            dy: card.transform!.y - y,
            stack: card.stack!
          }
          delete card.stack
        } else if (findSlotOfCard(card).slot!.kind === "stock"
          && card === findTopCardOfSlot(card)) {
          // reveal discarded card
          card.card!.faceUp = true
          card.stack!.previous = findTopCardOfSlot(findDiscardSlot())
        }
      } else if (slot && slot.slot!.kind === "stock") {
        // flip discard pile and move it to stock
        let stockCard = slot
        let discardedCard = findTopCardOfSlot(findDiscardSlot())
        while (discardedCard.card) {
          const { previous } = discardedCard.stack!
          discardedCard.card.faceUp = false
          discardedCard.stack = {
            previous: stockCard,
            spaced: false
          }
          stockCard = discardedCard
          discardedCard = previous
        }
      }
    } else if (grabbedCard && !pressed) {
      moveGrabbedCards(grabbedCard, slot)
    }
  }
}

function findDiscardSlot() {
  return [...gos.values()].find(go => !!go.slot && go.slot.kind === "discard")!
}

function moveGrabbedCards(grabbedCard: GameObject, newSlot?: GameObject) {
  const MOVE_CANCELLED = Symbol.for("move cancelled")
  try {
    // check if move target exists
    const topCardOfOldSlot = grabbedCard.grab!.stack.previous
    const oldSlot = findSlotOfCard(topCardOfOldSlot)
    if (!newSlot || newSlot === oldSlot)
      throw MOVE_CANCELLED

    // check if rules allow the move
    const topCardOfNewSlot = findTopCardOfSlot(newSlot)
    switch (newSlot.slot!.kind) {
      case "pile":
        if (oldSlot.slot!.kind === "stock"
          || (topCardOfNewSlot.card
            ? !isStackingAllowed(topCardOfNewSlot, grabbedCard)
            : grabbedCard.card!.rank < 13))
          throw MOVE_CANCELLED
        break
      case "stock":
        throw MOVE_CANCELLED
      case "discard":
        throw MOVE_CANCELLED
      case "foundation":
        if (oldSlot.slot!.kind === "stock")
          throw MOVE_CANCELLED
        if (topCardOfNewSlot.card) {
          if (grabbedCard.card!.suit !== topCardOfNewSlot.card!.suit
            || grabbedCard.card!.rank !== topCardOfNewSlot.card!.rank + 1)
            throw MOVE_CANCELLED
        } else {
          if (grabbedCard.card!.rank !== 1)
            throw MOVE_CANCELLED
        }
        break
    }

    // put card in new stack
    grabbedCard.stack = {
      previous: topCardOfNewSlot,
      spaced: newSlot.slot!.kind === "pile" && topCardOfNewSlot !== newSlot
    }

    // show last card in origin slot
    if (topCardOfOldSlot.card && oldSlot.slot!.kind !== "stock")
      topCardOfOldSlot.card!.faceUp = true

    // release card from grab
    delete grabbedCard.grab
  } catch (error) {
    if (error !== MOVE_CANCELLED)
      throw error

    // put card back in old stack
    grabbedCard.stack = grabbedCard.grab!.stack

    delete grabbedCard.grab
  }
}

function findSlotOfCard(card: GameObject) {
  let slot = card
  while (slot.stack)
    slot = slot.stack.previous
  return slot
}

function findTopCardOfSlot(slot: GameObject) {
  let slotTop = slot
  while (true) {
    const above = findCardAbove(slotTop)
    if (!above)
      break
    slotTop = above
  }
  return slotTop
}

function findCardAbove(card: GameObject) {
  return [...gos.values()].find(go => !!(go.stack && go.stack.previous === card))
}

function isStackingAllowed(bottomCard: GameObject, topCard: GameObject) {
  // check decreasing rank and alternating color
  return topCard.card!.rank + 1 === bottomCard.card!.rank
    && isRedCard(bottomCard) !== isRedCard(topCard)
}

function isRedCard(card: GameObject) {
  switch (card.card!.suit) {
    case "HEARTS":
    case "DIAMONDS":
      return true
    default:
      return false
  }
}

// RENDER

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  renderSlots()
  renderCards()
  renderFireworks()
  // renderMouse()
}

function renderCards() {
  const sortedCards = [...gos.values()]
    .filter(go => go.card)
    .sort((a, b) => {
      const grabA = findSlotOfCard(a).grab ? 1 : 0
      const grabB = findSlotOfCard(b).grab ? 1 : 0
      if (grabA === grabB)
        // both grabbed or none grabbed
        return a.transform!.y - b.transform!.y
      else
        // one grabbed (foreground) and one normal (background)
        return grabA - grabB
    })
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
    const rankText = rank === 1 ? "A" : rank <= 10 ? "" + rank : ["J", "Q", "K"][rank - 11]
    ctx.font = "13pt sans"
    ctx.textAlign = "left"
    ctx.fillText(rankText, x - halfwidth + xpad, y - halfheight + ypad)
    ctx.textAlign = "right"
    ctx.fillText(rankText, x + halfwidth - xpad, y + halfheight - ypad + ypadneg)

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

function renderFireworks() {
  for (const go of gos.values()) {
    if (go.firework) {
      const { x, y, width, height } = go.transform!
      ctx.strokeStyle = "black"
      ctx.strokeRect(x - width / 2, y - height / 2, width - width / 2, height - height / 2)
      ctx.fillStyle = go.firework.color
      ctx.fillRect(x - width / 2, y - height / 2, width - width / 2, height - height / 2)
    }
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

function renderSlots() {
  for (const go of gos.values())
    if (go.slot)
      renderSlot(go)
}

function renderSlot(go: GameObject) {
  const { x, y, width, height } = go.transform!
  const halfwidth = width / 2, halfheight = height / 2

  ctx.strokeStyle = "#CCC"
  ctx.strokeRect(x - halfwidth, y - halfheight, width, height)
}

// RUN

requestAnimationFrame(function run() {
  update()
  render()
  requestAnimationFrame(run)
})
