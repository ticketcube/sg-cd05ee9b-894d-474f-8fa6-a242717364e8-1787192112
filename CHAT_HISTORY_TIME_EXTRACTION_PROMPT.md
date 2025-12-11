# Chat History Time Extraction Prompt

**Purpose:** Extract development time data from previous Softgen chat threads to calculate time spent on each project element.

---

## Instructions for User

1. Open each previous chat thread individually
2. Copy the prompt below
3. Paste it into the chat
4. Copy the AI's response
5. Save all responses to a single file called `TIME_TRACKING_DATA.md`
6. Provide that file to me for final analysis and compilation

---

## Prompt to Run on Each Previous Thread

```
Please analyze this entire chat thread and extract the following time-related data in a structured format:

## Thread Overview
- **Thread Date/Timeframe:** [When did this thread take place?]
- **Total Messages in Thread:** [Count of all messages]
- **Your Working Messages:** [Count of messages where you were actively building/coding]

## Features/Tasks Worked On

For each distinct feature or task you worked on in this thread, provide:

### [Feature/Task Name]

**Time Period:**
- Started: [First message timestamp related to this task]
- Completed: [Last message timestamp, or "In Progress" if not finished]
- Duration: [Calculated or estimated time span]

**Work Description:**
- What was built/modified
- Key files created or edited
- Major decisions made

**Iteration Count:**
- Number of messages/iterations spent on this task

**Complexity Level:**
- Simple (1-5 iterations)
- Medium (6-15 iterations)
- Complex (16+ iterations)

**Status:**
- ✅ Completed in this thread
- 🚧 In progress at thread end
- ⏸️ Paused/deferred

---

## Summary Statistics for This Thread

**Total Estimated Development Time:** [Your best estimate based on message timestamps and iteration count]

**Features Completed:** [Number]
**Features Started:** [Number]
**Bug Fixes:** [Number]
**Refactoring Sessions:** [Number]

**Major Accomplishments:**
1. [Most significant achievement]
2. [Second most significant]
3. [Third most significant]

---

## File-Level Work Summary

List the top 10 most-worked-on files in this thread:

1. **[File path]** - [Brief description of work done] - [Estimated iterations]
2. **[File path]** - [Brief description of work done] - [Estimated iterations]
...

---

## Context for Next Thread

**Open Items at Thread End:**
- [What was left incomplete]
- [What was planned next]
- [Any blockers or issues]

---

Please provide this information in the exact format above so it can be easily compiled into a master time tracking document.
```

---

## After Collecting All Thread Data

Once you've run this prompt on all previous threads and collected the responses:

1. **Combine all responses** into a single file: `TIME_TRACKING_DATA.md`
2. **Add section headers** for each thread (Thread 1, Thread 2, etc.)
3. **Include thread dates** if available
4. **Provide the complete file** back to me

I will then:
- Compile all the data
- Calculate total time per feature area
- Create visualizations and summaries
- Generate a comprehensive project timeline
- Calculate time estimates for remaining work
- Create a master time tracking report

---

## Alternative: Manual Time Tracking Template

If you prefer to manually track time going forward, use this template in each new thread:

```markdown
## Time Tracking - [Date]

**Feature:** [Name]
**Start Time:** [HH:MM]
**End Time:** [HH:MM]
**Duration:** [X hours X minutes]
**Status:** ✅ Complete / 🚧 In Progress / ⏸️ Paused

**Work Done:**
- [Task 1]
- [Task 2]
- [Task 3]

**Files Modified:**
- [file 1]
- [file 2]

**Iterations:** [Number]
```

This will make future time tracking much easier!