import React from 'react'
import { startOliviaChat } from '../../../utils/olivia'

export default function ConnectWithOlivia() {
  return (
    <div className="border-[#2D394A] bg-[#131820] border-1 border-solid p-0 mt-6 rounded-2xl overflow-hidden relative h-[124px] z-10">
      <div className="flex justify-between items-end h-full">
        {/* Content */}
        <div className="h-full flex flex-col justify-center items-start w-[60%] pl-6">
          <p className="text-white/70 text-[12px] mb-3">
            Olivia AI
          </p>
        </div>

        {/* Image */}
        <div className="w-1/2 h-full flex justify-end">
          <img 
            src="/OliviaAdvertPose.png" 
            alt="Olivia AI" 
            className="h-full w-30 object-cover object-bottom"
          />
        </div>
      </div>
    </div>
  )
}
