cat: can't open '/app/components/VibeChart.tsx': No such file or directory
              <div className="absolute top-1/2 left-1/2 w-0 h-0">
                {positionedArtists.map((artist, index) => {
                  const thumbnailUrl = getArtistThumbnail(artist);
                  
                  return (
                    <HoverCard key={artist.uuid as Key} openDelay={100} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <motion.div
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                          style={{
                            left: `${artist.x}%`,
                            top: `${artist.y}%`,
                          }}
                        >
                          <img
                            src={thumbnailUrl}
                            alt={`Artist ${index}`}
                            className="w-10 h-10 rounded-full"
                          />
                        </motion.div>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="flex flex-col items-center">
                          <h3 className="text-lg font-semibold">{artist.name}</h3>
                          <p className="text-sm text-gray-500">{artist.description}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
