import { useState, useEffect } from 'react'

export default function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const getBreakpoint = () => {
    if (screenSize.width < 640) return 'Mobile (sm)'
    if (screenSize.width < 768) return 'Mobile Large (md)'
    if (screenSize.width < 1024) return 'Tablet (lg)'
    if (screenSize.width < 1280) return 'Desktop (xl)'
    return 'Large Desktop (2xl)'
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs z-50">
      <div>Screen: {screenSize.width} × {screenSize.height}</div>
      <div>Breakpoint: {getBreakpoint()}</div>
    </div>
  )
}
