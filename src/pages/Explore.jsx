import React from 'react'
import BubbleMapSection from '../components/features/explore/BubbleMapSection'
import TradingInfluencersSection from '../components/features/explore/TradingInfluencersSection'

export default function Explore() {
  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <BubbleMapSection />
      <TradingInfluencersSection />
    </div>
  )
}
