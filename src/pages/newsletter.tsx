const loadEvents = async () => {
    setLoading(true);
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- THIS WEEKEND (Thu → Sun) ---
        const day = today.getDay();
        const thisThursday = new Date(today);
        const daysUntilThursday = (4 - day + 7) % 7;
        thisThursday.setDate(today.getDate() + daysUntilThursday);

        const thisSunday = new Date(thisThursday);
        thisSunday.setDate(thisThursday.getDate() + 3);

        // --- NEXT WEEK (Mon → Sun) ---
        const nextMonday = new Date(thisSunday);
        nextMonday.setDate(thisSunday.getDate() + 1);

        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);

        // Format YYYY-MM-DD
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const thuStr = fmt(thisThursday);
        const sundayStr = fmt(thisSunday);
        const nextMonStr = fmt(nextMonday);
        const nextSunStr = fmt(nextSunday);

        console.log("📅 Loading events:", {
            thisWeekend: `${thuStr} → ${sundayStr}`,
            nextWeek: `${nextMonStr} → ${nextSunStr}`
        });

        // --- Load THIS WEEKEND ---
        const { data: weekendData, error: weekendError } = await supabase
            .from("ticketmaster_events")
            .select(`
        event_id,
        event_name,
        event_date,
        event_time,
        venue_name,
        venue_city,
        venue_state,
        venue_country,
        event_url
      `)
            .eq("is_active", true)
            .gte("event_date", thuStr)
            .lte("event_date", sundayStr)
            .order("event_date");

        if (weekendError) console.error("Weekend fetch error:", weekendError);

        // --- Load NEXT WEEK ---
        const { data: nextWeekData, error: nextWeekError } = await supabase
            .from("ticketmaster_events")
            .select(`
        event_id,
        event_name,
        event_date,
        event_time,
        venue_name,
        venue_city,
        venue_state,
        venue_country,
        event_url
      `)
            .eq("is_active", true)
            .gte("event_date", nextMonStr)
            .lte("event_date", nextSunStr)
            .order("event_date");

        if (nextWeekError) console.error("Next week fetch error:", nextWeekError);

        // Save results
        const weekendEvents = weekendData || [];
        const nextWeekEvents = nextWeekData || [];

        setThisWeekendEvents(weekendEvents);
        setnextWeekEvents(nextWeekEvents);

        // Unique city list
        const allEvents = [...weekendEvents, ...nextWeekEvents];
        const uniqueCities = [...new Set(allEvents.map(e => e.venue_city))].sort();

        setAvailableCities(uniqueCities);
        setSelectedCity("all");

    } catch (err) {
        console.error("💥 Error loading events:", err);
    } finally {
        setLoading(false);
    }
};
