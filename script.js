console.log('works')
let mediaRecorder
let isRecording = false
let isPaused = false
let recordedChunks = []
let startTime
let timerInterval
let pausedTime = 0
let timerRunning = false

const actionPanel = document.createElement('div')
actionPanel.className = 'action-panel'
actionPanel.innerHTML = `
<div class="action-panel-time">
  <p id="recording-time">00:00</p>
  <div class="recording-icon"></div>
</div>

<div class="action-panel-right">
  <button id="pause">
    <img src="public/images/pause.png" alt="" />
  </button>

  <button id="resume" style="display: none">
    <img src="public/images/resume.png" alt="" width="55" />
  </button>

  <button id="stop">
    <img src="public/images/stop.png" alt="" />
  </button>

  <button id="">
    <img src="public/images/camera.png" alt="" />
  </button>

  <button id="">
    <img src="public/images/mic.png" alt="" />
  </button>

  <button>
    <img src="public/images/delete.png" alt="" />
  </button>
</div>
`

document.body.append(actionPanel)

let isDragging = false
let offsetX, offsetY

console.log(isDragging)

actionPanel.addEventListener('mousedown', startDrag)
actionPanel.addEventListener('mouseup', stopDrag)

function startDrag(e) {
  isDragging = true

  // Get the initial mouse position relative to the action-panel's position
  offsetX = e.clientX - actionPanel.getBoundingClientRect().left
  offsetY = e.clientY - actionPanel.getBoundingClientRect().top

  // Change cursor style to indicate dragging
  actionPanel.style.cursor = 'grabbing'

  // Add a class to make the panel transparent or change its appearance as desired
  actionPanel.classList.add('dragging')

  // Prevent default behavior to avoid text selection while dragging
  e.preventDefault()

  // Add event listeners to handle dragging
  document.addEventListener('mousemove', drag)
}

function stopDrag() {
  if (isDragging) {
    isDragging = false

    // Reset cursor style
    actionPanel.style.cursor = 'grab'

    // Remove the transparent or modified appearance class
    actionPanel.classList.remove('dragging')

    // Remove event listeners used for dragging
    document.removeEventListener('mousemove', drag)
  }
}

function drag(e) {
  if (isDragging) {
    // Calculate the new position of the action-panel based on mouse movement
    const left = e.clientX - offsetX
    const top = e.clientY - offsetY

    // Set the new position
    actionPanel.style.left = left + 'px'
    actionPanel.style.top = top + 'px'
  }
}

let start = document.getElementById('start')
let stop = document.getElementById('stop')
let pause = document.getElementById('pause')
let resume = document.getElementById('resume')
let recordingTimeDisplay = document.getElementById('recording-time')

pause.addEventListener('click', function () {
  if (isRecording && !isPaused) {
    mediaRecorder.pause()
    isPaused = true

    // Store the time when paused
    pausedTime = Date.now() - startTime

    pause.style.display = 'none'
    resume.style.display = 'block'
    clearInterval(timerInterval) // Pause the timer
    timerRunning = false // Set the timer flag to not running
  }
})

resume.addEventListener('click', function () {
  if (isRecording && isPaused) {
    mediaRecorder.resume()
    isPaused = false

    // Adjust the start time to account for the paused time
    startTime = Date.now() - pausedTime

    pause.style.display = 'block'
    resume.style.display = 'none'

    // Resume the timer if it was running
    if (!timerRunning) {
      timerInterval = setInterval(updateRecordingTime, 1000)
      timerRunning = true // Set the timer flag to running
    }
  }
})

stop.addEventListener('click', function () {
  if (isRecording) {
    mediaRecorder.stop()
    isRecording = false

    // Clear the timer interval when stopping
    clearInterval(timerInterval)
  }
})

async function recordScreen() {
  return await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: { mediaSource: 'screen' },
  })
}

function createRecorder(stream, mimeType) {
  // the stream data is stored in this array
  recordedChunks = []

  const mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data)
    }
  }
  mediaRecorder.onstop = function () {
    saveFile(recordedChunks)
    recordedChunks = []
  }
  mediaRecorder.onpause = function () {
    isPaused = true
  }
  mediaRecorder.onresume = function () {
    isPaused = false
  }
  mediaRecorder.start(200) // For every 200ms the stream data will be stored in a separate chunk.
  isRecording = true
  return mediaRecorder
}

function saveFile(recordedChunks) {
  const blob = new Blob(recordedChunks, {
    type: 'video/mp4',
  })
  let filename = window.prompt('Enter file name'),
    downloadLink = document.createElement('a')
  downloadLink.href = URL.createObjectURL(blob)
  downloadLink.download = `${filename}.mp4`

  document.body.appendChild(downloadLink)
  downloadLink.click()
  URL.revokeObjectURL(blob) // clear from memory
  document.body.removeChild(downloadLink)
}

function updateRecordingTime() {
  const currentTime = Date.now() - startTime
  const minutes = Math.floor(currentTime / 60000)
  const seconds = ((currentTime % 60000) / 1000).toFixed(0)
  recordingTimeDisplay.textContent = `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`
}

chrome.runtime.onMessage.addListener(function (request) {
  ;(async function () {
    let stream = await recordScreen()
    let mimeType = 'video/mp4'
    mediaRecorder = createRecorder(stream, mimeType)

    actionPanel.style.display = 'flex'

    // Start the recording timer
    startTime = Date.now() - pausedTime // Account for the total paused time
    updateRecordingTime() // Initial call to display the time

    // Set up a timer to update the recording time every second (1000ms)
    timerInterval = setInterval(updateRecordingTime, 1000)
    timerRunning = true // Set the timer flag to running
  })()
  console.log('Message received in content script:', request.message)
})
