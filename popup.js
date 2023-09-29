const untoggleCam = document.getElementById('untoggle-camera')
const toggleCam = document.getElementById('toggle-camera')
const untoggleMic = document.getElementById('untoggle-mic')
const toggleMic = document.getElementById('toggle-mic')

untoggleCam.addEventListener('click', function camToggle() {
  untoggleCam.style.display = 'none'
  toggleCam.style.display = 'block'
})

toggleCam.addEventListener('click', function camUnToggle() {
  untoggleCam.style.display = 'block'
  toggleCam.style.display = 'none'
})

untoggleMic.addEventListener('click', function micToggle() {
  untoggleMic.style.display = 'none'
  toggleMic.style.display = 'block'
})

toggleMic.addEventListener('click', function micUnToggle() {
  untoggleMic.style.display = 'block'
  toggleMic.style.display = 'none'
})

start.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log(tabs)
    chrome.tabs.sendMessage(tabs[0].id, {
      message: 'start recording',
    })
  })
})
