  <button
                                onClick={() => {
                                    const ticketCubeUrl = generateTicketCubeLink({
                                        otw_event_id: event.event_id,
                                        artist_slug: undefined, // We'll add this to DB later
                                        event_date: event.event_date,
                                        event_time: event.event_time,
                                        venue: event.venue_name,
                                        venue_city: event.venue_city,
                                        venue_state: event.venue_state,
                                        artist_img_url: artistImage,
                                        venue_img_url: venueImage,
                                    });
                                    window.open(ticketCubeUrl, '_blank');
                                }}
                                className="bg-purple-500/90 hover:bg-purple-600 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                title="Get Your TCUBE"
                            >
                                <ExternalLink className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </button>