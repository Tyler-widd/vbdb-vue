// composables/useScoresData.js
import { ref, computed } from "vue";

export function useScoresData() {
  // Reactive state
  const scores = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const divisionFilter = ref(null);
  const conferenceFilter = ref([]); // Changed to array for multi-select
  const teamFilter = ref([]); // New team filter
  const search = ref("");

  // Helper function to format conference names
  const formatConference = (conference) => {
    if (!conference) return conference;

    // Check if it's a numeric region (like "5.0", "5", etc.)
    const numericMatch = conference.toString().match(/^(\d+)(?:\.0)?$/);
    if (numericMatch) {
      return `Region ${numericMatch[1]}`;
    }

    return conference;
  };

  // Computed properties
  const divisions = computed(() => {
    const divisionSet = new Set();
    scores.value.forEach((score) => {
      if (score.team_1_division) divisionSet.add(score.team_1_division);
      if (score.team_2_division) divisionSet.add(score.team_2_division);
    });
    return Array.from(divisionSet).sort();
  });

  const conferences = computed(() => {
    let filteredScores = scores.value;

    // Filter by division if selected
    if (divisionFilter.value) {
      filteredScores = filteredScores.filter(
        (score) =>
          score.team_1_division === divisionFilter.value ||
          score.team_2_division === divisionFilter.value
      );
    }

    // Extract unique conferences from filtered scores
    const conferenceSet = new Set();
    filteredScores.forEach((score) => {
      if (score.team_1_conference) {
        const formatted = formatConference(score.team_1_conference);
        conferenceSet.add(formatted);
      }
      if (score.team_2_conference) {
        const formatted = formatConference(score.team_2_conference);
        conferenceSet.add(formatted);
      }
    });

    // Convert to array and sort
    const conferenceArray = Array.from(conferenceSet);

    // Custom sort to handle "Region X" format properly
    return conferenceArray.sort((a, b) => {
      // Check if both are region format
      const regionA = a.match(/^Region (\d+)$/);
      const regionB = b.match(/^Region (\d+)$/);

      if (regionA && regionB) {
        // Both are regions, sort numerically
        return parseInt(regionA[1]) - parseInt(regionB[1]);
      } else if (regionA) {
        // A is region, B is not - regions first
        return -1;
      } else if (regionB) {
        // B is region, A is not - regions first
        return 1;
      } else {
        // Neither are regions, sort alphabetically
        return a.localeCompare(b);
      }
    });
  });

  // Get available teams based on selected division and conference
  const teams = computed(() => {
    let filteredScores = scores.value;

    // Filter by division if selected
    if (divisionFilter.value) {
      filteredScores = filteredScores.filter(
        (score) =>
          score.team_1_division === divisionFilter.value ||
          score.team_2_division === divisionFilter.value
      );
    }

    // Extract unique teams from filtered scores, but only include teams that belong to selected conferences
    const teamSet = new Set();

    filteredScores.forEach((score) => {
      // Add team 1 if no conference filter is selected, or if it belongs to selected conferences
      if (score.team_1_name) {
        if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
          teamSet.add(score.team_1_name);
        } else if (conferenceFilter.value.includes(formatConference(score.team_1_conference))) {
          teamSet.add(score.team_1_name);
        }
      }

      // Add team 2 if no conference filter is selected, or if it belongs to selected conferences
      if (score.team_2_name) {
        if (!conferenceFilter.value || conferenceFilter.value.length === 0) {
          teamSet.add(score.team_2_name);
        } else if (conferenceFilter.value.includes(formatConference(score.team_2_conference))) {
          teamSet.add(score.team_2_name);
        }
      }
    });

    return Array.from(teamSet).sort();
  });

  // NAIA Standings calculation
  const naiaStandings = computed(() => {
    // Filter for NAIA division games only
    const naiaGames = scores.value.filter(
      (score) =>
        score.team_1_division === "NAIA" || score.team_2_division === "NAIA"
    );

    // Create a map to track team statistics
    const teamStats = new Map();

    // Process each game
    naiaGames.forEach((game) => {
      const team1 = game.team_1;
      const team2 = game.team_2;

      // Initialize team stats if not exists
      if (!teamStats.has(team1)) {
        teamStats.set(team1, {
          team: team1,
          conference: formatConference(game.team_1_conference) || "Unknown",
          location: game.team_1_location || "",
          wins: 0,
          losses: 0,
          games: 0,
        });
      }

      if (!teamStats.has(team2)) {
        teamStats.set(team2, {
          team: team2,
          conference: formatConference(game.team_2_conference) || "Unknown",
          location: game.team_2_location || "",
          wins: 0,
          losses: 0,
          games: 0,
        });
      }

      // Update game counts
      teamStats.get(team1).games++;
      teamStats.get(team2).games++;

      // Update win/loss records based on winner
      if (game.winner === team1) {
        teamStats.get(team1).wins++;
        teamStats.get(team2).losses++;
      } else if (game.winner === team2) {
        teamStats.get(team2).wins++;
        teamStats.get(team1).losses++;
      }
    });

    // Convert to array and calculate win percentages
    const standings = Array.from(teamStats.values()).map((team) => ({
      ...team,
      winPercentage: team.games > 0 ? team.wins / team.games : 0,
      overall_record: `${team.wins}-${team.losses}`,
    }));

    // Sort by win percentage (descending), then by wins (descending)
    return standings.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.wins - a.wins;
    });
  });

  // Transform scores data for display
  const transformedScores = computed(() => {
    return scores.value.map((score) => {
      // Calculate final score display
      const sets = [];
      if (score.set_1_team_1 && score.set_1_team_2) {
        sets.push(`${score.set_1_team_1}-${score.set_1_team_2}`);
      }
      if (score.set_2_team_1 && score.set_2_team_2) {
        sets.push(`${score.set_2_team_1}-${score.set_2_team_2}`);
      }
      if (score.set_3_team_1 && score.set_3_team_2) {
        sets.push(`${score.set_3_team_1}-${score.set_3_team_2}`);
      }
      if (score.set_4_team_1 && score.set_4_team_2) {
        sets.push(`${score.set_4_team_1}-${score.set_4_team_2}`);
      }
      if (score.set_5_team_1 && score.set_5_team_2) {
        sets.push(`${score.set_5_team_1}-${score.set_5_team_2}`);
      }

      return {
        ...score,
        // Format conferences in the transformed data
        team_1_conference: formatConference(score.team_1_conference),
        team_2_conference: formatConference(score.team_2_conference),
        score: sets.join(", "),
        formattedDate: new Date(score.date).toLocaleDateString(),
        formattedTime: score.time,
        isWinner1: score.winner === score.team_1,
        isWinner2: score.winner === score.team_2,
      };
    });
  });

  // Filtered scores based on search and filters
  const filteredScores = computed(() => {
    let filtered = transformedScores.value;

    // Apply division filter
    if (divisionFilter.value) {
      filtered = filtered.filter(
        (score) =>
          score.team_1_division === divisionFilter.value ||
          score.team_2_division === divisionFilter.value
      );
    }

    // Apply conference filter (array)
    if (conferenceFilter.value && conferenceFilter.value.length > 0) {
      filtered = filtered.filter(
        (score) =>
          conferenceFilter.value.includes(score.team_1_conference) ||
          conferenceFilter.value.includes(score.team_2_conference)
      );
    }

    // Apply team filter
    if (teamFilter.value && teamFilter.value.length > 0) {
      filtered = filtered.filter(
        (score) =>
          teamFilter.value.includes(score.team_1_name) ||
          teamFilter.value.includes(score.team_2_name)
      );
    }

    // Apply search filter
    if (search.value) {
      const searchTerm = search.value.toLowerCase();
      filtered = filtered.filter(
        (score) =>
          score.team_1.toLowerCase().includes(searchTerm) ||
          score.team_2.toLowerCase().includes(searchTerm) ||
          (score.location && score.location.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  });

  // Methods
  const fetchScores = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/results"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch scores data");
      }
      const data = await response.json();
      scores.value = data;
    } catch (err) {
      error.value = err.message || "Failed to fetch scores";
    } finally {
      loading.value = false;
    }
  };

  const setDivisionFilter = (division) => {
    divisionFilter.value = division;
    // Clear conference filter when division changes since available conferences will change
    conferenceFilter.value = null;
  };

  const setConferenceFilter = (conference) => {
    conferenceFilter.value = conference;
  };

  const setTeamFilter = (teams) => {
    teamFilter.value = teams;
  };

  const setSearch = (searchTerm) => {
    search.value = searchTerm;
  };

  const clearFilters = () => {
    divisionFilter.value = null;
    conferenceFilter.value = [];
    teamFilter.value = [];
    search.value = "";
  };

  // Initialize data
  fetchScores();

  return {
    // State
    scores,
    loading,
    error,
    divisionFilter,
    conferenceFilter,
    teamFilter,
    search,

    // Computed
    divisions,
    conferences,
    teams,
    transformedScores,
    filteredScores,
    naiaStandings,

    // Methods
    fetchScores,
    setDivisionFilter,
    setConferenceFilter,
    setTeamFilter,
    setSearch,
    clearFilters,
  };
}
