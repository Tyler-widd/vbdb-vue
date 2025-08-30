// composables/useLiveData.js
import { ref, computed, onUnmounted } from "vue";

export default function useLiveData() {
  const liveMatches = ref([]);
  const schools = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const isPolling = ref(false);

  let pollingInterval = null;

  // Fetch schools data
  const fetchSchools = async () => {
    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/schools"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch schools data");
      }
      const data = await response.json();
      schools.value = data;
    } catch (err) {
      console.error("Error fetching schools:", err);
      // Don't set error for schools, as we can still show live data without conferences
    }
  };

  // Join live matches with schools data to add conference information
  const enrichLiveMatchesWithConference = (matches, schoolsData) => {
    if (!schoolsData || schoolsData.length === 0) {
      return matches;
    }

    // Create lookup maps for efficient joining
    const schoolsByOrgId = new Map();
    const schoolsByShortName = new Map();

    schoolsData.forEach((school) => {
      if (school.org_id) {
        schoolsByOrgId.set(school.org_id, school);
      }
      if (school.school_short) {
        schoolsByShortName.set(school.school_short.toLowerCase(), school);
      }
    });

    return matches.map((match) => {
      // Try to find team 1's school data
      let team1School = null;
      // First try by org_id
      if (match.team_1_id) {
        team1School = schoolsByOrgId.get(match.team_1_id);
      }
      // If not found, try by school name
      if (!team1School && match.team_1_name) {
        team1School = schoolsByShortName.get(match.team_1_name.toLowerCase());
      }

      // Try to find team 2's school data
      let team2School = null;
      // First try by org_id
      if (match.team_2_id) {
        team2School = schoolsByOrgId.get(match.team_2_id);
      }
      // If not found, try by school name
      if (!team2School && match.team_2_name) {
        team2School = schoolsByShortName.get(match.team_2_name.toLowerCase());
      }

      // Add conference data to the match
      return {
        ...match,
        team_1_conference: team1School?.conference || null,
        team_2_conference: team2School?.conference || null,
        // If both teams are from the same conference, set a match conference
        conference:
          team1School?.conference &&
          team1School?.conference === team2School?.conference
            ? team1School.conference
            : null,
      };
    });
  };

  const fetchLiveData = async (silent = false) => {
    // Only show loading indicator if it's not a silent background update
    if (!silent) {
      loading.value = true;
    }
    error.value = null;

    try {
      // Fetch schools data if we don't have it yet
      if (schools.value.length === 0) {
        await fetchSchools();
      }

      // Fetch live matches
      const response = await fetch("https://api.volleyballdatabased.com/live");
      if (!response.ok) {
        throw new Error("Failed to fetch live data");
      }
      const data = await response.json();

      // Enrich matches with conference data
      liveMatches.value = enrichLiveMatchesWithConference(data, schools.value);
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching live data:", err);
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  };

  const startPolling = (intervalMs = 30000) => {
    if (pollingInterval) return; // Already polling

    isPolling.value = true;
    pollingInterval = setInterval(() => {
      fetchLiveData(true);
    }, intervalMs);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      isPolling.value = false;
    }
  };

  // Auto-cleanup when composable is unmounted
  onUnmounted(() => {
    stopPolling();
  });

  // Computed property to get unique conferences from live matches
  const availableConferences = computed(() => {
    const conferences = new Set();
    liveMatches.value.forEach((match) => {
      if (match.team_1_conference) conferences.add(match.team_1_conference);
      if (match.team_2_conference) conferences.add(match.team_2_conference);
    });
    return Array.from(conferences).sort();
  });

  // Helper function to get match status
  const getMatchStatus = (match) => {
    const sets = [
      { team1: match.set_1_team_1, team2: match.set_1_team_2 },
      { team1: match.set_2_team_1, team2: match.set_2_team_2 },
      { team1: match.set_3_team_1, team2: match.set_3_team_2 },
      { team1: match.set_4_team_1, team2: match.set_4_team_2 },
      { team1: match.set_5_team_1, team2: match.set_5_team_2 },
    ];

    // Helper function to check if a set is complete
    const isSetComplete = (set) => {
      if (set.team1 === null || set.team2 === null) return false;

      const score1 = set.team1;
      const score2 = set.team2;

      // Win by 2, minimum 25 points
      return (
        (score1 >= 25 && score1 - score2 >= 2) ||
        (score2 >= 25 && score2 - score1 >= 2)
      );
    };

    const completedSets = sets.filter(isSetComplete);
    const currentSet = completedSets.length + 1;

    if (completedSets.length === 0) {
      return { status: "not_started", currentSet: 1 };
    }

    // Check if match is complete (best of 5, first to 3 sets wins)
    const team1Wins = completedSets.filter(
      (set) => set.team1 > set.team2
    ).length;
    const team2Wins = completedSets.filter(
      (set) => set.team2 > set.team1
    ).length;

    if (team1Wins >= 3 || team2Wins >= 3) {
      return {
        status: "completed",
        currentSet: completedSets.length,
        winner: team1Wins > team2Wins ? 1 : 2,
      };
    }

    return { status: "in_progress", currentSet };
  };

  // Helper function to get current score summary
  const getScoreSummary = (match) => {
    const matchStatus = getMatchStatus(match);
    const sets = [
      { team1: match.set_1_team_1, team2: match.set_1_team_2 },
      { team1: match.set_2_team_1, team2: match.set_2_team_2 },
      { team1: match.set_3_team_1, team2: match.set_3_team_2 },
      { team1: match.set_4_team_1, team2: match.set_4_team_2 },
      { team1: match.set_5_team_1, team2: match.set_5_team_2 },
    ];

    // Helper function to check if a set is complete
    const isSetComplete = (set) => {
      if (set.team1 === null || set.team2 === null) return false;

      const score1 = set.team1;
      const score2 = set.team2;

      // Win by 2, minimum 25 points
      return (
        (score1 >= 25 && score1 - score2 >= 2) ||
        (score2 >= 25 && score2 - score1 >= 2)
      );
    };

    const completedSets = sets.filter(isSetComplete);
    const team1SetWins = completedSets.filter(
      (set) => set.team1 > set.team2
    ).length;
    const team2SetWins = completedSets.filter(
      (set) => set.team2 > set.team1
    ).length;

    return {
      team1SetWins,
      team2SetWins,
      completedSets: completedSets.length,
      ...matchStatus,
    };
  };

  return {
    liveMatches,
    loading,
    error,
    isPolling,
    availableConferences,
    fetchLiveData,
    startPolling,
    stopPolling,
    getMatchStatus,
    getScoreSummary,
  };
}
