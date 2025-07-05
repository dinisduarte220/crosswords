function setWords(words) {
  document.getElementById('wordsDisplay').innerText = "Number of words: " + words
}

let grid

async function createGrid(userWords) {
  document.getElementById('board').innerHTML = ""
  document.getElementById('wordsContainer').innerHTML = ""

  const averageLength = 6
  const factor = 1.5
  const gridSize = Math.ceil(Math.sqrt(userWords * averageLength * factor))

  let newBoard_matrix = []
  for (let i = 0; i < gridSize; i++) {
    newBoard_matrix[i] = []
    for (let j = 0; j < gridSize; j++) {
      newBoard_matrix[i][j] = 0
    }
  }

  const minLength = 3
  const maxLength = 10
  let words = []

  for (let i = 0; i < userWords; i++) {
    let startX, startY
    let previousStartX, previousStartY
    let direction
    let baseLetter

    if (i == 0) {
      startX = 0
      startY = 0
      direction = Math.floor(Math.random() * 2) // 0 horizontal, 1 vertical
    } else {
      let baseWord = words[Math.floor(Math.random() * words.length)]
      let basePosition = Math.floor(Math.random() * baseWord.length)
      let baseWordLetters = baseWord.word.split('')
      baseLetter = baseWordLetters[basePosition]
      previousStartX = baseWord.startX
      previousStartY = baseWord.startY

      if (baseWord.direction == 0) {
        startX = previousStartX + basePosition
        startY = previousStartY
        direction = 1
      } else {
        startX = previousStartX
        startY = previousStartY + basePosition
        direction = 0
      }
    }

    function canPlaceWord(word, startX, startY, direction) {
      const len = word.length
      const dx = direction === 0 ? 1 : 0
      const dy = direction === 0 ? 0 : 1

      if (startX + dx * (len - 1) >= gridSize || startY + dy * (len - 1) >= gridSize)
        return false

      for (let i = 0; i < len; i++) {
        const x = startX + dx * i
        const y = startY + dy * i
        const existing = newBoard_matrix[x][y]

        if (existing !== 0 && existing !== word[i]) return false

        if (existing === 0) {
          if (direction === 0) {
            if (y - 1 >= 0 && newBoard_matrix[x][y - 1] !== 0) return false
            if (y + 1 < gridSize && newBoard_matrix[x][y + 1] !== 0) return false
          } else {
            if (x - 1 >= 0 && newBoard_matrix[x - 1][y] !== 0) return false
            if (x + 1 < gridSize && newBoard_matrix[x + 1][y] !== 0) return false
          }
        }
      }

      const preX = startX - dx
      const preY = startY - dy
      if (preX >= 0 && preY >= 0 && newBoard_matrix[preX][preY] !== 0) return false

      const postX = startX + dx * len
      const postY = startY + dy * len
      if (postX < gridSize && postY < gridSize && newBoard_matrix[postX][postY] !== 0) return false

      return true
    }

    try {
      let wordLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength
      wordLength = Math.max(minLength, wordLength) // Garantir mínimo length

      // Evita valores inválidos
      if (wordLength <= 0 || isNaN(wordLength)) {
        i--
        continue
      }

      let word_data, newWord

      if (i > 0) {
        let newWordPosition = Math.floor(Math.random() * wordLength)

        // Corrige possíveis excessos fora da grelha
        if (direction == 0) {
          if (previousStartX - newWordPosition < 0) newWordPosition = previousStartX
          if (previousStartX + newWordPosition >= gridSize) newWordPosition = gridSize - previousStartX - 1
        } else {
          if (previousStartY - newWordPosition < 0) newWordPosition = previousStartY
          if (previousStartY + newWordPosition >= gridSize) newWordPosition = gridSize - previousStartY - 1
        }

        let searchPattern = ""
        for (let k = 0; k < wordLength; k++) {
          searchPattern += (k === newWordPosition) ? baseLetter : "?"
        }

        word_data = await getAPI(`sp=${searchPattern}`)
        if (!word_data) {
          i--
          continue
        }

        if (direction == 0) {
          startX = startX - newWordPosition
        } else {
          startY = startY - newWordPosition
        }

        newWord = {
          word: word_data,
          startX: startX,
          startY: startY,
          length: wordLength,
          direction: direction
        }
      } else {
        word_data = await getAPI(`sp=${'?'.repeat(wordLength)}`)
        if (!word_data) {
          i--
          continue
        }
        newWord = {
          word: word_data,
          startX: startX,
          startY: startY,
          length: wordLength,
          direction: direction
        }
      }

      const chars = newWord.word.split('')

      if (direction == 0 && startX + wordLength > gridSize) {
        startX -= (startX + wordLength - gridSize)
      }
      if (direction == 1 && startY + wordLength > gridSize) {
        startY -= (startY + wordLength - gridSize)
      }

      if (!canPlaceWord(newWord.word, startX, startY, direction)) {
        i--
        continue
      }

      if (direction === 0) {
        for (let i = 0; i < chars.length; i++) {
          newBoard_matrix[startX + i][startY] = chars[i]
        }
      } else {
        for (let i = 0; i < chars.length; i++) {
          newBoard_matrix[startX][startY + i] = chars[i]
        }
      }

      words.push(newWord)

    } catch (error) {
      console.error(error.stack)
      i--
      continue
    }
  }

  displayGrid(newBoard_matrix, words)
  grid = newBoard_matrix
}

function displayGrid(grid, words) {
  const mainMenu = document.getElementById('mainMenu')
  const gridContainer = document.getElementById('board')
  const wordsContainer = document.getElementById('wordsContainer')

  gridContainer.innerHTML = ""
  wordsContainer.innerHTML = ""

  // Vamos escolher 5 posições com letras para mostrar
  const letterPositions = []
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      if (grid[x][y] !== 0) {
        letterPositions.push({ x, y })
      }
    }
  }

  // Selecionar 5 posições aleatórias (ou todas se forem menos que 5)
  const lettersToShowCount = 5
  const chosenPositions = []
  while (chosenPositions.length < lettersToShowCount && letterPositions.length > 0) {
    const idx = Math.floor(Math.random() * letterPositions.length)
    chosenPositions.push(letterPositions[idx])
    letterPositions.splice(idx, 1)
  }

  for (let i = 0; i < grid.length; i++) {
    let newRow = document.createElement('div')
    newRow.setAttribute('class', 'gridRow')
    for (let j = 0; j < grid[i].length; j++) {
      let newCell = document.createElement('input')
      newCell.setAttribute('type', 'text')
      newCell.setAttribute('maxlength', '1')
      newCell.setAttribute('class', 'gridCell')
      newCell.setAttribute('oninput', 'nextCell()')

      // Verifica se esta posição está entre as 5 letras que mostramos
      const shouldShowLetter = chosenPositions.some(pos => pos.x === j && pos.y === i)

      if (grid[j][i] !== 0 && shouldShowLetter) {
        newCell.value = grid[j][i]
        newCell.disabled = false // não permite editar estas letras já mostradas
      } else if (grid[j][i] !== 0) {
        newCell.value = ""
        newCell.disabled = false // utilizador pode preencher aqui
      } else {
        newCell.value = ""
        newCell.disabled = true // células vazias que não fazem parte da grelha
      }

      newRow.appendChild(newCell)
    }
    gridContainer.appendChild(newRow)
  }

  // Mostrar as palavras agrupadas (pode ficar igual)
  const wordsByLength = {}
  words.forEach(wordObj => {
    const len = wordObj.word.length
    if (!wordsByLength[len]) {
      wordsByLength[len] = []
    }
    wordsByLength[len].push(wordObj.word)
  })

  let headerCount = 0
  Object.keys(wordsByLength).sort((a, b) => a - b).forEach(len => {
    const lengthHeader = document.createElement('h3')
    if (headerCount == 0) {
      lengthHeader.innerHTML = `Words:`
      headerCount++
    } else {
      headerCount++
      lengthHeader.innerHTML = `<br>`
    }
    wordsContainer.appendChild(lengthHeader)

    wordsByLength[len].forEach(word => {
      const p = document.createElement('p')
      const wordId = Math.floor(Math.random() * 999999)
      p.setAttribute('id', 'word_' + wordId)
      p.innerText = `- ${word}`
      p.style.cursor = 'pointer'
      p.addEventListener('click', () => selectWord(wordId))
      wordsContainer.appendChild(p)
    })
  })

  mainMenu.style.display = "none"
  gridContainer.style.display = "block"
}

function checkBoardComplete(grid) {
  const gridContainer = document.getElementById('board')
  const rows = gridContainer.querySelectorAll('.gridRow')

  for (let i = 0; i < grid.length; i++) {
    const inputs = rows[i].querySelectorAll('input.gridCell')
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[j][i] !== 0) {
        const expectedLetter = grid[j][i].toLowerCase()
        const inputLetter = inputs[j].value.toLowerCase()
        if (inputLetter !== expectedLetter) {
          return false
        }
      }
    }
  }
  return true
}

function nextCell() {
  const gridContainer = document.getElementById('board')
  const inputs = Array.from(gridContainer.querySelectorAll('input.gridCell'))

  const activeElement = document.activeElement
  const currentIndex = inputs.indexOf(activeElement)

  // Move para a próxima célula editável (não disabled)
  for (let i = currentIndex + 1; i < inputs.length; i++) {
    if (!inputs[i].disabled && inputs[i].value.length === 0) {
      inputs[i].focus()
      break
    }
  }

  // Verifica se o tabuleiro está completo
  if (checkBoardComplete(grid)) {
    alert("Parabéns! Completeste o puzzle!")
    // Aqui podes colocar código para avançar para o próximo puzzle ou mostrar algo
  }
}

function selectWord(id) {
  const wordItem = document.getElementById('word_' + id)

  const style = window.getComputedStyle(wordItem).textDecoration
  if (!style.includes("line-through")) {
    wordItem.style.textDecoration = "line-through"
    wordItem.style.opacity = ".5"
  } else {
    wordItem.style.textDecoration = "none"
    wordItem.style.opacity = "1"
  }
}

async function getAPI(filter) {
  const response = await fetch(`https://api.datamuse.com/words?${filter}&max=150`)
  const words = await response.json()
  if (words.length === 0) return null

  // Filter words to exclude those with '-' or spaces
  const filteredWords = words.filter(w => !w.word.includes('-') && !w.word.includes(' '))

  if (filteredWords.length === 0) return null

  const randomIndex = Math.floor(Math.random() * filteredWords.length)
  return filteredWords[randomIndex].word
}