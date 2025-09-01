<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "@/composables/useLiveData.js";
import LiveHeader from "./LiveHeader.vue";
import LiveScoreCard from "./LiveScoreCard.vue";
import LiveTable from "./LiveTable.vue";

// Use the live data composable
const {
  liveMatches,
  loading,
  error,
  fetchLiveData,
  getScoreSummary
} = useLiveData();

// Filter states
const search = ref("");
const divisionFilter = ref(null);
const conferenceFilter = ref([]); // Changed to array for multi-select
const teamFilter = ref([]); // New state for team filter
const showOnlyLive = ref(false); // New state for live-only filter
const showCompleted = ref(false); // New state for showing completed matches
const showUpcoming = ref(false); // New state for showing upcoming matches
const showTableView = ref(false); // New state for table view toggle

// Get unique divisions from live data
const divisions = computed(() => {
  const divisionSet = new Set();

  liveMatches.value.forEach((match) => {
    if (match.team_1_division) divisionSet.add(match.team_1_division);
    if (match.team_2_division) divisionSet.add(match.team_2_division);
  });

  return Array.from(divisionSet).sort();
});

// Get available conferences based on selected division
const conferences = computed(() => {
  let matches = liveMatches.value;

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

// Get available teams based on selected division and conference
const teams = computed(() => {
  let matches = liveMatches.value;

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team_1_division === divisionFilter.value ||
        match.team_2_division === divisionFilter.value
    );
  }

  // Filter by conference if selected
  if (conferenceFilter.value && conferenceFilter.value.length > 0) {
    matches = matches.filter(
      (match) =>
        conferenceFilter.value.includes(match.team_1_conference) ||
        conferenceFilter.value.includes(match.team_2_conference)
    );
  }

  // Extract unique teams from filtered matches
  const teamSet = new Set();
  matches.forEach((match) => {
    if (match.team_1_name) teamSet.add(match.team_1_name);
    if (match.team_2_name) teamSet.add(match.team_2_name);
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
    const team1Score = set.team1 !== null && set.team1 !== "" ? parseInt(set.team1, 10) : null;
    const team2Score = set.team2 !== null && set.team2 !== "" ? parseInt(set.team2, 10) : null;

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

    // Team 2 data
    team2Name: match.team_2_name,
    team2Img: match.team_2_logo || null,
    team2Conference: match.team_2_conference || "",
    team2Division: match.team_2_division || "",
    team2Id: match.team_2_id,

    // Score data
    team1SetsWon: team1Wins,
    team2SetsWon: team2Wins,
    individualSets,
    winnerId,
    status,
    currentSet,
  };
};

// Get formatted matches for both card and table views
const formattedMatches = computed(() => {
  // Apply the same filtering logic as LiveScoreCard
  let filtered = [...liveMatches.value];

  // Filter out matches where first set is 0-0
  filtered = filtered.filter((match) => {
    const set1Team1 = match.set_1_team_1 !== null && match.set_1_team_1 !== ""
      ? parseInt(match.set_1_team_1, 10) : null;
    const set1Team2 = match.set_1_team_2 !== null && match.set_1_team_2 !== ""
      ? parseInt(match.set_1_team_2, 10) : null;
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
  conferenceFilter.value = null;
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

const updateShowTableView = (value) => {
  showTableView.value = value;
};

const handleRetry = () => {
  error.value = null;
  fetchLiveData();
};

// Fetch data on mount
onMounted(() => {
  fetchLiveData();
});

// Watch for division changes to update conferences
watch(divisionFilter, () => {
  conferenceFilter.value = null;
});
</script>

<template>
  <!-- Error Alert -->
  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="error = null"
  >
    <template v-slot:title>Failed to load live matches</template>
    {{ error }}
    <template v-slot:append>
      <v-btn color="error" variant="outlined" size="small" @click="handleRetry">
        Retry
      </v-btn>
    </template>
  </v-alert>

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
    :show-table-view="showTableView"
    :loading="loading"
    @update:search="updateSearch"
    @update:division="updateDivision"
    @update:conference="updateConference"
    @update:teams="updateTeams"
    @update:show-only-live="updateShowOnlyLive"
    @update:show-completed="updateShowCompleted"
    @update:show-upcoming="updateShowUpcoming"
    @update:show-table-view="updateShowTableView"
  />

  <!-- Live Matches - Card View or Table View -->
  <LiveScoreCard
    v-if="!showTableView"
    :formatted-matches="formattedMatches"
    :loading="loading"
  />

  <LiveTable
    v-else
    :formatted-matches="formattedMatches"
    :loading="loading"
  />
</template>
