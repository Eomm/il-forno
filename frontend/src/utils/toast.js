// Toast notification utility
let toastContainer = null

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function showToast(message, type = 'info') {
  const container = getToastContainer()

  const toast = document.createElement('div')
  toast.className = `
    px-4 py-3 rounded-lg shadow-lg text-white font-medium
    transform transition-all duration-300 translate-x-0 opacity-100
    ${type === 'error' ? 'bg-bakery-berry' : ''}
    ${type === 'success' ? 'bg-bakery-pistachio' : ''}
    ${type === 'info' ? 'bg-bakery-brown' : ''}
  `
  toast.textContent = message

  container.appendChild(toast)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0')
    setTimeout(() => {
      container.removeChild(toast)
      if (container.children.length === 0 && toastContainer) {
        document.body.removeChild(toastContainer)
        toastContainer = null
      }
    }, 300)
  }, 3000)
}
