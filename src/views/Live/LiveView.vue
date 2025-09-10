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
  let hasAnyScores = false;

  sets.forEach((set, index) => {
    const team1Score =
      set.team1 !== null && set.team1 !== "" ? parseInt(set.team1, 10) : null;
    const team2Score =
      set.team2 !== null && set.team2 !== "" ? parseInt(set.team2, 10) : null;

    if (team1Score !== null && team2Score !== null) {
      hasAnyScores = true;
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
  let status;

  if (matchCompleted) {
    winnerId = team1Wins > team2Wins ? match.team_1_id : match.team_2_id;
    status = "completed";
  } else if (hasAnyScores && currentSet) {
    status = "in_progress";
  } else {
    status = "not_started";
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

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get formatted matches with all filtering applied
const formattedMatches = computed(() => {
  // Start with all matches and format them first
  const allFormattedMatches = liveMatches.value.map(formatLiveMatchForDisplay);

  // Filter out matches where first set is 0-0 (these are usually not real matches)
  let filtered = allFormattedMatches.filter((match) => {
    if (match.individualSets.length === 0) return true; // Allow upcoming matches with no scores
    const firstSet = match.individualSets[0];
    return !(
      firstSet &&
      firstSet.team1Score === 0 &&
      firstSet.team2Score === 0
    );
  });

  // Apply status filters
  if (showOnlyLive.value) {
    filtered = filtered.filter((match) => match.status === "in_progress");
  } else if (showCompleted.value) {
    filtered = filtered.filter((match) => match.status === "completed");
  } else if (showUpcoming.value) {
    filtered = filtered.filter((match) => match.status === "not_started");
  }

  // Apply division filter
  if (divisionFilter.value) {
    filtered = filtered.filter(
      (match) =>
        match.team1Division === divisionFilter.value ||
        match.team2Division === divisionFilter.value
    );
  }

  // Apply conference filter
  if (conferenceFilter.value && conferenceFilter.value.length > 0) {
    filtered = filtered.filter(
      (match) =>
        conferenceFilter.value.includes(match.team1Conference) ||
        conferenceFilter.value.includes(match.team2Conference)
    );
  }

  // Apply team filter
  if (teamFilter.value && teamFilter.value.length > 0) {
    filtered = filtered.filter(
      (match) =>
        teamFilter.value.includes(match.team1Name) ||
        teamFilter.value.includes(match.team2Name)
    );
  }

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (match) =>
        match.team1Name.toLowerCase().includes(searchLower) ||
        match.team2Name.toLowerCase().includes(searchLower) ||
        match.formattedDate.includes(search.value) ||
        match.team1Conference.toLowerCase().includes(searchLower) ||
        match.team2Conference.toLowerCase().includes(searchLower)
    );
  }

  // Sort by status and date
  return filtered.sort((a, b) => {
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

// Helper function to get filtered matches for computing available options
const getBaseFilteredMatches = () => {
  const allFormattedMatches = liveMatches.value.map(formatLiveMatchForDisplay);

  // Apply status filter only
  let filtered = allFormattedMatches;

  if (showOnlyLive.value) {
    filtered = filtered.filter((match) => match.status === "in_progress");
  } else if (showCompleted.value) {
    filtered = filtered.filter((match) => match.status === "completed");
  } else if (showUpcoming.value) {
    filtered = filtered.filter((match) => match.status === "not_started");
  }

  return filtered;
};

// Get unique divisions from filtered data
const divisions = computed(() => {
  const divisionSet = new Set();
  const statusFilteredMatches = getBaseFilteredMatches();

  statusFilteredMatches.forEach((match) => {
    if (match.team1Division) divisionSet.add(match.team1Division);
    if (match.team2Division) divisionSet.add(match.team2Division);
  });

  return Array.from(divisionSet).sort();
});

// Get available conferences based on selected division and status
const conferences = computed(() => {
  let matches = getBaseFilteredMatches();

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team1Division === divisionFilter.value ||
        match.team2Division === divisionFilter.value
    );
  }

  // Extract unique conferences from filtered matches
  const confs = new Set();
  matches.forEach((match) => {
    if (match.team1Conference) confs.add(match.team1Conference);
    if (match.team2Conference) confs.add(match.team2Conference);
  });

  return Array.from(confs).sort();
});

// Get available teams based on selected division, conference, and status
const teams = computed(() => {
  let matches = getBaseFilteredMatches();

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team1Division === divisionFilter.value ||
        match.team2Division === divisionFilter.value
    );
  }

  // Extract unique teams from filtered matches, but only include teams that belong to selected conferences
  const teamSet = new Set();

  matches.forEach((match) => {
    // Add team 1 if no conference filter is selected, or if it belongs to selected conferences
    if (match.team1Name) {
      if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
        teamSet.add(match.team1Name);
      } else if (conferenceFilter.value.includes(match.team1Conference)) {
        teamSet.add(match.team1Name);
      }
    }

    // Add team 2 if no conference filter is selected, or if it belongs to selected conferences
    if (match.team2Name) {
      if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
        teamSet.add(match.team2Name);
      } else if (conferenceFilter.value.includes(match.team2Conference)) {
        teamSet.add(match.team2Name);
      }
    }
  });

  return Array.from(teamSet).sort();
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
    :show-upcoming="showUpcoming"
  />
</template>
