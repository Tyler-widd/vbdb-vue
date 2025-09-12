// composables/useLiveData.js
import { ref, computed, onUnmounted } from "vue";
import { vbdbApi } from "@/services/vbdbApi";

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
      const response = await vbdbApi.getTeams();
      schools.value = response.data;
    } catch (err) {
      console.error("Error fetching schools:", err);
    }
  };

  const enrichLiveMatchesWithConference = (matches, schoolsData) => {
    if (!schoolsData || schoolsData.length === 0) {
      return matches;
    }

    // Create lookup maps for efficient joining
    const schoolsByOrgId = new Map();
    const schoolsByShortName = new Map();
    const schoolsByName = new Map();

    schoolsData.forEach((school) => {
      if (school.team_id) {
        schoolsByOrgId.set(school.team_id, school);
      }
      if (school.school_short) {
        schoolsByShortName.set(school.school_short.toLowerCase(), school);
      }
      if (school.short_name) {
        schoolsByShortName.set(school.short_name.toLowerCase(), school);
      }
      if (school.name) {
        schoolsByName.set(school.name.toLowerCase(), school);
      }
    });

    // Helper function to find school data with fallback logic
    const findSchoolData = (teamId, teamName, currentData) => {
      let schoolData = null;

      // First try by team_id if provided
      if (teamId) {
        schoolData = schoolsByOrgId.get(teamId);
      }

      // If not found and teamName exists, try by short_name
      if (!schoolData && teamName) {
        schoolData = schoolsByShortName.get(teamName.toLowerCase());
      }

      // If still not found, try by full name
      if (!schoolData && teamName) {
        schoolData = schoolsByName.get(teamName.toLowerCase());
      }

      return schoolData;
    };

    // Helper function to merge team data with priority to schools data
    const mergeTeamData = (liveTeamData, schoolData, teamNumber) => {
      const result = {};

      // Use school data if available, otherwise fall back to live data
      if (schoolData) {
        result[`team_${teamNumber}_id`] = schoolData.team_id || liveTeamData.id;
        result[`team_${teamNumber}_name`] =
          schoolData.short_name || schoolData.name || liveTeamData.name;
        result[`team_${teamNumber}_logo`] =
          schoolData.logo || liveTeamData.logo;
        result[`team_${teamNumber}_division`] =
          schoolData.division || liveTeamData.division;
        result[`team_${teamNumber}_conference`] =
          schoolData.conference || liveTeamData.conference;
        result[`team_${teamNumber}_avca_ranking`] =
          schoolData.avca_ranking || null;
      } else {
        // Use live data as fallback
        result[`team_${teamNumber}_id`] = liveTeamData.id;
        result[`team_${teamNumber}_name`] = liveTeamData.name;
        result[`team_${teamNumber}_logo`] = liveTeamData.logo;
        result[`team_${teamNumber}_division`] = liveTeamData.division;
        result[`team_${teamNumber}_conference`] = liveTeamData.conference;
        result[`team_${teamNumber}_avca_ranking`] = null;
      }

      return result;
    };

    return matches.map((match) => {
      // Extract current live data for both teams
      const team1LiveData = {
        id: match.team_1_id,
        name: match.team_1_name,
        logo: match.team_1_logo,
        division: match.team_1_division,
        conference: match.team_1_conference,
      };

      const team2LiveData = {
        id: match.team_2_id,
        name: match.team_2_name,
        logo: match.team_2_logo,
        division: match.team_2_division,
        conference: match.team_2_conference,
      };

      // Find school data for both teams
      const team1School = findSchoolData(
        match.team_1_id,
        match.team_1_name,
        team1LiveData
      );
      const team2School = findSchoolData(
        match.team_2_id,
        match.team_2_name,
        team2LiveData
      );

      // Merge team data with school data taking priority
      const team1Data = mergeTeamData(team1LiveData, team1School, 1);
      const team2Data = mergeTeamData(team2LiveData, team2School, 2);

      // Create the enriched match object
      const enrichedMatch = {
        ...match,
        ...team1Data,
        ...team2Data,
        // If both teams are from the same conference, set a match conference
        conference:
          team1Data.team_1_conference &&
          team1Data.team_1_conference === team2Data.team_2_conference
            ? team1Data.team_1_conference
            : null,
        live_stats_url: match.live_stats_url || null,
      };

      return enrichedMatch;
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
      const response = await vbdbApi.getLiveGames();
      const data = response.data;

      // Enrich matches with conference and ranking data
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

  // Computed property to get ranked matches (matches with at least one ranked team)
  const rankedMatches = computed(() => {
    return liveMatches.value.filter(
      (match) => match.team_1_avca_ranking || match.team_2_avca_ranking
    );
  });

  // Helper function to format AVCA ranking display
  const formatRanking = (ranking) => {
    if (!ranking) return null;
    return `#${ranking}`;
  };

  // Helper function to get match ranking info
  const getMatchRankingInfo = (match) => {
    const team1Ranking = match.team_1_avca_ranking;
    const team2Ranking = match.team_2_avca_ranking;

    return {
      hasRankedTeams: !!(team1Ranking || team2Ranking),
      bothTeamsRanked: !!(team1Ranking && team2Ranking),
      team1Formatted: formatRanking(team1Ranking),
      team2Formatted: formatRanking(team2Ranking),
      isTopTenMatchup:
        (team1Ranking && team1Ranking <= 10) ||
        (team2Ranking && team2Ranking <= 10),
    };
  };

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
    rankedMatches,
    fetchLiveData,
    startPolling,
    stopPolling,
    getMatchStatus,
    getScoreSummary,
    getMatchRankingInfo,
    formatRanking,
  };
}
