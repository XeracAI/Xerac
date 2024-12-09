'use client'

import React, {useEffect, useState, useMemo} from 'react'
import Link from 'next/link'
import {ClaudeLogo, OpenAILogo, GeminiLogo, MetaIconOutline, XeracLogo, CopilotLogo} from './custom-icons'
import {Card, CardSkeletonContainer} from './cards'

const ANIMATION_DURATION = 20000 // 20 seconds in milliseconds

const useCarouselAnimation = ({screenWidth}) => {
  const [progress, setProgress] = useState(0)
  const [radius, setRadius] = useState(1)
  const maxRadius = Math.min(500, screenWidth / 2)

  useEffect(() => {
    let startTime
    let animationFrameId
    let radiusChangeSpeed = 2

    const animate = (timestamp) => {
      setRadius((prev) => (prev < maxRadius ? prev + radiusChangeSpeed : prev))

      // Grdually decrease speed
      radiusChangeSpeed = Math.max(0.1, radiusChangeSpeed * 0.995)

      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      setProgress((elapsed % ANIMATION_DURATION) / ANIMATION_DURATION)
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return {progress, radius, maxRadius}
}

const IconContainer = React.memo(({index, iconCount, radius, progress, children}) => {
  const angle = useMemo(() => (index / iconCount + progress) * 2 * Math.PI, [index, progress])
  // const radius = Math.min(500, screenWidth / 2);
  const xPos = Math.sin(angle) * radius
  const yPos = Math.cos(angle) * radius * 0.3
  const zPos = Math.sin(angle) * 100
  const scale = 0.5 + (0.5 * (1 + Math.cos(angle))) / 2
  const opacity = 0.3 + (0.7 * (1 + Math.cos(angle))) / 2

  const style = useMemo(
    () => ({
      position: 'absolute',
      left: `calc(50% + ${xPos}px)`,
      top: `calc(50% + ${yPos}px)`,
      transform: `translate(-50%, -50%) scale(${scale}) translateZ(${zPos}px)`,
      opacity,
      zIndex: Math.round((1 + Math.cos(angle)) * 50),
    }),
    [xPos, yPos, scale, zPos, opacity, angle]
  )

  return (
    <div style={style} suppressHydrationWarning>
      {children}
    </div>
  )
})

IconContainer.displayName = 'IconContainer'

const Carousel = React.memo(() => {
  const [landingCentrifuge, setLandingCentrifuge] = useState('A')

  useEffect(() => {
    // Check localStorage to see if there's a stored variant
    const ABTests = JSON.parse(localStorage.getItem('xerac-ab-tests') || '{}')

    if (ABTests.landingCentrifuge) {
      setLandingCentrifuge(ABTests.landingCentrifuge)
    } else {
      // Randomly assign a variant if none is stored
      const newVariant = Math.random() < 0.5 ? 'A' : 'B'
      localStorage.setItem('xerac-ab-tests', JSON.stringify({landingCentrifuge: newVariant}))
      setLandingCentrifuge(newVariant)
    }
  }, [])

  const {progress, radius, maxRadius} = useCarouselAnimation({screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0})

  const icons = useMemo(
    () => [
      <GeminiLogo key="gemini" className="w-16 h-16 md:w-24 md:h-24 md:hover:w-32 md:hover:h-32 transition-all cursor-pointer" />,
      <OpenAILogo key="openai" className="w-16 h-16 md:w-24 md:h-24 md:hover:w-32 md:hover:h-32 transition-all cursor-pointer" />,
      <ClaudeLogo key="claude" className="w-16 h-16 md:w-24 md:h-24 md:hover:w-32 md:hover:h-32 transition-all cursor-pointer" />,
      <MetaIconOutline key="meta" className="w-16 h-16 md:w-24 md:h-24 md:hover:w-32 md:hover:h-32 transition-all cursor-pointer" />,
      <CopilotLogo key="copilot" className="w-16 h-16 md:w-24 md:h-24 md:hover:w-32 md:hover:h-32 transition-all cursor-pointer" />,
    ],
    []
  )

  return (
    <div className="relative w-full h-[75vh] perspective-1000">
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="relative">
          <Link href="/chat" className="flex flex-col gap-4 justify-center items-center">
            <XeracLogo className="w-20 h-20 md:w-48 md:h-48 md:hover:w-64 md:hover:h-64 text-black dark:text-[#f2f0e8] transition-all cursor-pointer" />
          </Link>
          {/*<div className="absolute inset-0 bg-gradient-radial from-blue-500/30 to-transparent rounded-full blur-xl"></div>*/}
        </div>
      </div>

      {icons.map((icon, index) => (
        <IconContainer key={index} index={index} iconCount={icons.length} radius={landingCentrifuge === 'A' ? radius : maxRadius} progress={progress}>
          {icon}
        </IconContainer>
      ))}
    </div>
  )
})

Carousel.displayName = 'Carousel'

export function FeatureBlock3DCarousel() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-[#1F2C3C] dark:from-background dark:to-neutral-800">
      <Card className="w-full h-full max-w-none md:overflow-hidden">
        <CardSkeletonContainer className="w-full h-full">
          <Carousel />
        </CardSkeletonContainer>
      </Card>
    </div>
  )
}
