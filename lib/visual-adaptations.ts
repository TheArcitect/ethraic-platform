export function injectKeyframes(keyframes: string) {
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = keyframes
  document.head.appendChild(style)
  setTimeout(() => {
    if (style.parentNode) {
      style.parentNode.removeChild(style)
    }
  }, 10000)
}
