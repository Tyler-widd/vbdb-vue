// composables/useLiveData.js
import { ref } from "vue";

export default function useLiveData() {
  const liveMatches = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchLiveData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch("https://api.volleyballdatabased.com/live");
      if (!response.ok) {
        throw new Error("Failed to fetch live data");
      }
      const data = await response.json();
      liveMatches.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching live data:", err);
    } finally {
      loading.value = false;
    }
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

    const completedSets = sets.filter(
      (set) => set.team1 !== null && set.team2 !== null,
    );
    const currentSet = completedSets.length + 1;

    if (completedSets.length === 0) {
      return { status: "not_started", currentSet: 1 };
    }

    // Check if match is complete (best of 5, first to 3 sets wins)
    const team1Wins = completedSets.filter(
      (set) => set.team1 > set.team2,
    ).length;
    const team2Wins = completedSets.filter(
      (set) => set.team2 > set.team1,
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

    const completedSets = sets.filter(
      (set) => set.team1 !== null && set.team2 !== null,
    );
    const team1SetWins = completedSets.filter(
      (set) => set.team1 > set.team2,
    ).length;
    const team2SetWins = completedSets.filter(
      (set) => set.team2 > set.team1,
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
    fetchLiveData,
    getMatchStatus,
    getScoreSummary,
  };
}
