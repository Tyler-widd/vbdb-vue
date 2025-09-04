<!-- views/Live/LiveView.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "@/composables/useLiveData.js";
import LiveHeader from "./LiveHeader.vue";
import LiveTable from "./LiveTable.vue";

// Use the live data composable with polling functionality
const {
  liveMatches,
  loading,
  error,
  fetchLiveData,
  getScoreSummary,
  startPolling,
  stopPolling,
  isPolling,
} = useLiveData();

// Filter states - these persist across data refreshes
const search = ref("");
const divisionFilter = ref(null);
const conferenceFilter = ref([]); // Array for multi-select
const teamFilter = ref([]); // Team filter
const showOnlyLive = ref(true); // Default to show only live matches
const showCompleted = ref(false); // Show completed matches
const showUpcoming = ref(false); // Show upcoming matches

// Props (if needed for orgId)
const props = defineProps({
  orgId: {
    type: String,
    default: null,
  },
});

// Helper function to get filtered matches based on status checkboxes
const getStatusFilteredMatches = () => {
  let filtered = [...liveMatches.value];

  // Filter out matches where first set is 0-0
  filtered = filtered.filter((match) => {
    const set1Team1 =
      match.set_1_team_1 !== null && match.set_1_team_1 !== ""
        ? parseInt(match.set_1_team_1, 10)
        : null;
    const set1Team2 =
      match.set_1_team_2 !== null && match.set_1_team_2 !== ""
        ? parseInt(match.set_1_team_2, 10)
        : null;
    return set1Team1 !== 0 || set1Team2 !== 0;
  });

  // Apply status filters
  if (showOnlyLive.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "in_progress";
    });
  } else if (showCompleted.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "completed";
    });
  } else if (showUpcoming.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "not_started";
    });
  }

  return filtered;
};

// Get unique divisions from live data - filtered by status
const divisions = computed(() => {
  const divisionSet = new Set();

  // Use only matches that match the current status filter
  const statusFilteredMatches = getStatusFilteredMatches();

  statusFilteredMatches.forEach((match) => {
    if (match.team_1_division) divisionSet.add(match.team_1_division);
    if (match.team_2_division) divisionSet.add(match.team_2_division);
  });

  return Array.from(divisionSet).sort();
});

// Get available conferences based on selected division and status
const conferences = computed(() => {
  // Start with status-filtered matches
  let matches = getStatusFilteredMatches();

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team_1_division === divisionFilter.value ||
        match.team_2_division === divisionFilter.value
    );
  }

  // Extract unique conferences from filtered matches
  const confs = new Set();
  matches.forEach((match) => {
    if (match.team_1_conference) confs.add(match.team_1_conference);
    if (match.team_2_conference) confs.add(match.team_2_conference);
  });

  return Array.from(confs).sort();
});

// Get available teams based on selected division, conference, and status
const teams = computed(() => {
  // Start with status-filtered matches
  let matches = getStatusFilteredMatches();

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team_1_division === divisionFilter.value ||
        match.team_2_division === divisionFilter.value
    );
  }

  // Extract unique teams from filtered matches, but only include teams that belong to selected conferences
  const teamSet = new Set();

  matches.forEach((match) => {
    // Add team 1 if no conference filter is selected, or if it belongs to selected conferences
    if (match.team_1_name) {
      if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
        teamSet.add(match.team_1_name);
      } else if (conferenceFilter.value.includes(match.team_1_conference)) {
        teamSet.add(match.team_1_name);
      }
    }

    // Add team 2 if no conference filter is selected, or if it belongs to selected conferences
    if (match.team_2_name) {
      if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
        teamSet.add(match.team_2_name);
      } else if (conferenceFilter.value.includes(match.team_2_conference)) {
        teamSet.add(match.team_2_name);
      }
    }
  });

  return Array.from(teamSet).sort();
});

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format live match data for display
const formatLiveMatchForDisplay = (match) => {
  const scoreSummary = getScoreSummary(match);

  // Build individual sets array
  const individualSets = [];
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  // Count sets won
  let team1Wins = 0;
  let team2Wins = 0;
  let currentSet = null;
  let matchCompleted = false;

  sets.forEach((set, index) => {
    const team1Score =
      set.team1 !== null && set.team1 !== "" ? parseInt(set.team1, 10) : null;
    const team2Score =
      set.team2 !== null && set.team2 !== "" ? parseInt(set.team2, 10) : null;

    if (team1Score !== null && team2Score !== null) {
      const setNumber = index + 1;
      const minPoints = setNumber === 5 ? 15 : 25;

      if (team1Score >= minPoints && team1Score - team2Score >= 2) {
        team1Wins++;
      } else if (team2Score >= minPoints && team2Score - team1Score >= 2) {
        team2Wins++;
      } else if (!currentSet && !matchCompleted) {
        currentSet = setNumber;
      }

      individualSets.push({
        setNumber: setNumber,
        team1Score: team1Score,
        team2Score: team2Score,
        team1Won: team1Score > team2Score,
      });
    }
  });

  matchCompleted = team1Wins >= 3 || team2Wins >= 3;

  let winnerId = null;
  let status = scoreSummary.status;

  if (matchCompleted) {
    winnerId = team1Wins > team2Wins ? match.team_1_id : match.team_2_id;
    status = "completed";
  } else if (currentSet) {
    status = "in_progress";
  }

  return {
    id: match.match_id || `${match.team_1_id}-${match.team_2_id}-${match.date}`,
    formattedDate: formatDate(match.date),
    time: match.time || null,

    // Team 1 data
    team1Name: match.team_1_name,
    team1Img: match.team_1_logo || null,
    team1Conference: match.team_1_conference || "",
    team1Division: match.team_1_division || "",
    team1Id: match.team_1_id,
    team1Rank: match.team_1_rank || null,

    // Team 2 data
    team2Name: match.team_2_name,
    team2Img: match.team_2_logo || null,
    team2Conference: match.team_2_conference || "",
    team2Division: match.team_2_division || "",
    team2Id: match.team_2_id,
    team2Rank: match.team_2_rank || null,

    // Score data
    team1SetsWon: team1Wins,
    team2SetsWon: team2Wins,
    individualSets,
    winnerId,
    status,
    currentSet,
    boxScore: match.box_score || null,

    live_stats_url: match.live_stats_url || null,
  };
};

// Get formatted matches
const formattedMatches = computed(() => {
  // Apply the same filtering logic
  let filtered = [...liveMatches.value];

  // Filter out matches where first set is 0-0
  filtered = filtered.filter((match) => {
    const set1Team1 =
      match.set_1_team_1 !== null && match.set_1_team_1 !== ""
        ? parseInt(match.set_1_team_1, 10)
        : null;
    const set1Team2 =
      match.set_1_team_2 !== null && match.set_1_team_2 !== ""
        ? parseInt(match.set_1_team_2, 10)
        : null;
    return set1Team1 !== 0 || set1Team2 !== 0;
  });

  // Apply status filters
  if (showOnlyLive.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "in_progress";
    });
  } else if (showCompleted.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "completed";
    });
  } else if (showUpcoming.value) {
    filtered = filtered.filter((match) => {
      const formatted = formatLiveMatchForDisplay(match);
      return formatted.status === "not_started";
    });
  }

  // Apply other filters
  if (divisionFilter.value) {
    filtered = filtered.filter(
      (match) =>
        match.team_1_division === divisionFilter.value ||
        match.team_2_division === divisionFilter.value
    );
  }

  if (conferenceFilter.value && conferenceFilter.value.length > 0) {
    filtered = filtered.filter(
      (match) =>
        conferenceFilter.value.includes(match.team_1_conference) ||
        conferenceFilter.value.includes(match.team_2_conference)
    );
  }

  if (teamFilter.value && teamFilter.value.length > 0) {
    filtered = filtered.filter(
      (match) =>
        teamFilter.value.includes(match.team_1_name) ||
        teamFilter.value.includes(match.team_2_name)
    );
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (match) =>
        match.team_1_name.toLowerCase().includes(searchLower) ||
        match.team_2_name.toLowerCase().includes(searchLower) ||
        match.date.includes(search.value) ||
        (match.location &&
          match.location.toLowerCase().includes(searchLower)) ||
        (match.team_1_conference &&
          match.team_1_conference.toLowerCase().includes(searchLower)) ||
        (match.team_2_conference &&
          match.team_2_conference.toLowerCase().includes(searchLower))
    );
  }

  return filtered.map(formatLiveMatchForDisplay).sort((a, b) => {
    // Sort by status: in_progress first, then not_started, then completed
    const statusOrder = { in_progress: 0, not_started: 1, completed: 2 };
    const aOrder = statusOrder[a.status] || 3;
    const bOrder = statusOrder[b.status] || 3;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // Within same status, sort by date
    return new Date(a.formattedDate) - new Date(b.formattedDate);
  });
});

// Event handlers
const updateSearch = (value) => {
  search.value = value;
};

const updateDivision = (value) => {
  divisionFilter.value = value;
  // Reset conference filter when division changes
  conferenceFilter.value = [];
};

const updateConference = (value) => {
  conferenceFilter.value = value;
};

const updateTeams = (value) => {
  teamFilter.value = value;
};

const updateShowOnlyLive = (value) => {
  showOnlyLive.value = value;
  // If turning on "show only live", turn off other filters
  if (value) {
    showCompleted.value = false;
    showUpcoming.value = false;
  }
};

const updateShowCompleted = (value) => {
  showCompleted.value = value;
  // If turning on "show completed", turn off other filters
  if (value) {
    showOnlyLive.value = false;
    showUpcoming.value = false;
  }
};

const updateShowUpcoming = (value) => {
  showUpcoming.value = value;
  // If turning on "show upcoming", turn off other filters
  if (value) {
    showOnlyLive.value = false;
    showCompleted.value = false;
  }
};

const handleRetry = () => {
  error.value = null;
  fetchLiveData();
};

// Fetch data on mount and start polling
onMounted(() => {
  fetchLiveData();
  // Start polling every 20 seconds (20000ms)
  startPolling(20000);
});

// Stop polling when component is unmounted
onUnmounted(() => {
  stopPolling();
});

// Watch for division changes to update conferences
watch(divisionFilter, () => {
  conferenceFilter.value = [];
});
</script>

<template>
  <!-- Live Header with Filters -->
  <LiveHeader
    class="mt-3"
    :divisions="divisions"
    :conferences="conferences"
    :teams="teams"
    :selected-division="divisionFilter"
    :selected-conference="conferenceFilter"
    :selected-teams="teamFilter"
    :show-only-live="showOnlyLive"
    :show-completed="showCompleted"
    :show-upcoming="showUpcoming"
    :loading="loading"
    @update:search="updateSearch"
    @update:division="updateDivision"
    @update:conference="updateConference"
    @update:teams="updateTeams"
    @update:show-only-live="updateShowOnlyLive"
    @update:show-completed="updateShowCompleted"
    @update:show-upcoming="updateShowUpcoming"
  />

  <!-- Live Matches Table -->
  <LiveTable
    :formatted-matches="formattedMatches"
    :loading="loading"
    :org-id="orgId"
  />
</template>
