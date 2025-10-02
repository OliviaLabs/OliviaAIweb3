import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, ScrollShadow } from "@heroui/react";
import { ArrowLeft, CheckCircle, Users } from 'lucide-react';
import Button from '../../ui/Button';
import { exploreService } from '../../../api/services/explore.service';

export default function TokenSpeakersDrawer({ isOpen, onOpenChange, tokenSymbol }) {
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, verified, whitelisted

  useEffect(() => {
    if (isOpen && tokenSymbol) {
      fetchSpeakers();
    }
  }, [isOpen, tokenSymbol]);

  const fetchSpeakers = async () => {
    setLoading(true);
    try {
      const data = await exploreService.getTokenSpeakers(tokenSymbol);
      setSpeakers(data.speakers || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpeakers = speakers.filter(speaker => {
    if (filter === 'verified') return speaker.verified;
    if (filter === 'whitelisted') return speaker.whitelisted;
    return true;
  });

  return (
    <Drawer
      hideCloseButton
      backdrop="blur"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="full"
    >
      <DrawerContent className="bg-gradient-to-t from-[#181818] to-[#000000]">
        {(onClose) => (
          <>
            <DrawerHeader className="relative flex items-center justify-center px-6 py-8">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onClose}
                className="absolute left-6 text-white bg-[#1D2530] rounded-full h-10 w-10"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-medium">Who's Talking About ${tokenSymbol}?</h2>
            </DrawerHeader>

            <DrawerBody className="flex justify-center p-0 px-4 w-full h-full">
              <div className="flex flex-col gap-4 w-full pb-20">
                
                {/* Filter Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'solid' : 'bordered'}
                    className={`flex-1 rounded-full ${
                      filter === 'all' 
                        ? 'bg-[#4ED342] text-black' 
                        : 'border-[#2D394A] text-white'
                    }`}
                    onPress={() => setFilter('all')}
                  >
                    All ({speakers.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'verified' ? 'solid' : 'bordered'}
                    className={`flex-1 rounded-full ${
                      filter === 'verified' 
                        ? 'bg-[#4ED342] text-black' 
                        : 'border-[#2D394A] text-white'
                    }`}
                    onPress={() => setFilter('verified')}
                  >
                    Verified ({speakers.filter(s => s.verified).length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'whitelisted' ? 'solid' : 'bordered'}
                    className={`flex-1 rounded-full ${
                      filter === 'whitelisted' 
                        ? 'bg-[#4ED342] text-black' 
                        : 'border-[#2D394A] text-white'
                    }`}
                    onPress={() => setFilter('whitelisted')}
                  >
                    Trusted ({speakers.filter(s => s.whitelisted).length})
                  </Button>
                </div>

                {/* Info Banner */}
                <div className="bg-[#1D2530]/50 border border-[#2D394A] rounded-xl p-3 flex items-start gap-2">
                  <Users className="w-4 h-4 text-[#4ED342] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-white/70">
                    Showing speakers who mentioned <span className="text-[#4ED342] font-medium">${tokenSymbol}</span> in the last 24 hours. 
                    Data refreshes every 6 hours.
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col gap-4 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#1D2530]/30 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="h-3 w-32 bg-gray-700 rounded"></div>
                          <div className="h-2 w-24 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Speakers List */}
                {!loading && (
                  <ScrollShadow className="h-[calc(100vh-280px)]" hideScrollBar={false} size={40}>
                    <div className="flex flex-col gap-3">
                      {filteredSpeakers.length === 0 ? (
                        <div className="text-center py-12 text-white/50">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No speakers found with current filters</p>
                        </div>
                      ) : (
                        filteredSpeakers.map((speaker, idx) => (
                          <div
                            key={speaker.handle}
                            className="bg-[#1D2530] rounded-xl p-4 hover:bg-[#2D394A] transition-colors cursor-pointer"
                            onClick={() => window.open(speaker.url, '_blank')}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#2D394A] flex-shrink-0">
                                {speaker.avatar ? (
                                  <img
                                    src={speaker.avatar}
                                    alt={speaker.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#4ED342] to-[#0AFDE1] flex items-center justify-center">
                                    <span className="text-black font-bold text-lg">
                                      {speaker.handle.charAt(1).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white truncate">
                                    {speaker.name || speaker.handle}
                                  </span>
                                  {speaker.verified && (
                                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                  {speaker.whitelisted && (
                                    <div className="px-2 py-0.5 bg-[#4ED342]/20 border border-[#4ED342]/40 rounded-full">
                                      <span className="text-[10px] text-[#4ED342] font-medium">TRUSTED</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-xs text-white/60 mb-2">{speaker.handle}</div>
                                
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="bg-[#000000]/30 rounded-lg p-2">
                                    <div className="text-white/50">Tweets</div>
                                    <div className="text-white font-medium">{speaker.tweets}</div>
                                  </div>
                                  <div className="bg-[#000000]/30 rounded-lg p-2">
                                    <div className="text-white/50">Avg Likes</div>
                                    <div className="text-white font-medium">
                                      {speaker.avgLikes ? Math.round(speaker.avgLikes) : 0}
                                    </div>
                                  </div>
                                  <div className="bg-[#000000]/30 rounded-lg p-2">
                                    <div className="text-white/50">Followers</div>
                                    <div className="text-white font-medium">
                                      {speaker.followers ? new Intl.NumberFormat('en-US', { 
                                        notation: 'compact', 
                                        compactDisplay: 'short' 
                                      }).format(speaker.followers) : '0'}
                                    </div>
                                  </div>
                                  <div className="bg-[#000000]/30 rounded-lg p-2">
                                    <div className="text-white/50">Engagement</div>
                                    <div className="text-white font-medium">
                                      {speaker.totalEngagement ? Math.round(speaker.totalEngagement) : 0}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Rank Badge */}
                              <div className="flex-shrink-0">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                  ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                                    idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black' :
                                    'bg-[#2D394A] text-white/70'}
                                `}>
                                  #{idx + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollShadow>
                )}
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

