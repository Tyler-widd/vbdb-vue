// composables/useScoresData.js
import { ref, computed } from "vue";

export function useScoresData() {
  // Reactive state
  const scores = ref([]);
  const schools = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const divisionFilter = ref("D-I");
  const conferenceFilter = ref([]); // Changed to array for multi-select
  const teamFilter = ref([]); // New team filter
  const search = ref("");
  const rankedOnlyFilter = ref(false); // New filter for ranked teams only

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

  // Helper function to format rank display
  const formatRank = (rank) => {
    if (!rank || rank === null) return null;
    return `#${rank}`;
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
    if (!divisionFilter.value) return [];

    const conferenceSet = new Set();

    scores.value.forEach((score) => {
      if (
        score.team_1_division === divisionFilter.value &&
        score.team_1_conference
      ) {
        conferenceSet.add(formatConference(score.team_1_conference));
      }
      if (
        score.team_2_division === divisionFilter.value &&
        score.team_2_conference
      ) {
        conferenceSet.add(formatConference(score.team_2_conference));
      }
    });

    const conferenceArray = Array.from(conferenceSet);

    // Sort with Region ordering first
    return conferenceArray.sort((a, b) => {
      const regionA = a.match(/^Region (\d+)$/);
      const regionB = b.match(/^Region (\d+)$/);

      if (regionA && regionB)
        return parseInt(regionA[1]) - parseInt(regionB[1]);
      if (regionA) return -1;
      if (regionB) return 1;
      return a.localeCompare(b);
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

    // Filter by conferences if selected
    if (conferenceFilter.value && conferenceFilter.value.length > 0) {
      filteredScores = filteredScores.filter(
        (score) =>
          conferenceFilter.value.includes(
            formatConference(score.team_1_conference)
          ) ||
          conferenceFilter.value.includes(
            formatConference(score.team_2_conference)
          )
      );
    }

    // Extract unique teams from filtered scores
    const teamMap = new Map();

    filteredScores.forEach((score) => {
      // Check if team 1 matches current filters
      const team1MatchesDivision =
        !divisionFilter.value || score.team_1_division === divisionFilter.value;
      const team1MatchesConference =
        conferenceFilter.value.length === 0 ||
        conferenceFilter.value.includes(
          formatConference(score.team_1_conference)
        );

      // Check if team 2 matches current filters
      const team2MatchesDivision =
        !divisionFilter.value || score.team_2_division === divisionFilter.value;
      const team2MatchesConference =
        conferenceFilter.value.length === 0 ||
        conferenceFilter.value.includes(
          formatConference(score.team_2_conference)
        );

      // Add team 1 if it matches all filters
      if (
        team1MatchesDivision &&
        team1MatchesConference &&
        score.team_1_name &&
        score.team_1_id
      ) {
        teamMap.set(score.team_1_id, {
          title: score.team_1_name,
          value: score.team_1_id,
          division: score.team_1_division,
          conference: formatConference(score.team_1_conference),
        });
      }

      // Add team 2 if it matches all filters
      if (
        team2MatchesDivision &&
        team2MatchesConference &&
        score.team_2_name &&
        score.team_2_id
      ) {
        teamMap.set(score.team_2_id, {
          title: score.team_2_name,
          value: score.team_2_id,
          division: score.team_2_division,
          conference: formatConference(score.team_2_conference),
        });
      }
    });

    return Array.from(teamMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  });

  // Get ranked teams for easy filtering
  const rankedTeams = computed(() => {
    const rankedSet = new Set();
    scores.value.forEach((score) => {
      if (score.team_1_rank) rankedSet.add(score.team_1_name);
      if (score.team_2_rank) rankedSet.add(score.team_2_name);
    });
    return Array.from(rankedSet).sort();
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
        // Format rankings for display
        team_1_rank_display: formatRank(score.team_1_rank),
        team_2_rank_display: formatRank(score.team_2_rank),
        // Helper flags for ranked status
        team_1_is_ranked:
          score.team_1_rank !== null && score.team_1_rank !== undefined,
        team_2_is_ranked:
          score.team_2_rank !== null && score.team_2_rank !== undefined,
        has_ranked_team:
          (score.team_1_rank !== null && score.team_1_rank !== undefined) ||
          (score.team_2_rank !== null && score.team_2_rank !== undefined),
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

    // Apply team filter (now using team IDs)
    if (teamFilter.value && teamFilter.value.length > 0) {
      filtered = filtered.filter(
        (score) =>
          teamFilter.value.includes(score.team_1_id) ||
          teamFilter.value.includes(score.team_2_id)
      );
    }

    // Apply ranked teams only filter
    if (rankedOnlyFilter.value) {
      filtered = filtered.filter((score) => score.has_ranked_team);
    }

    // Apply search filter
    if (search.value) {
      const searchTerm = search.value.toLowerCase();
      filtered = filtered.filter(
        (score) =>
          score.team_1_name?.toLowerCase().includes(searchTerm) ||
          score.team_2_name?.toLowerCase().includes(searchTerm) ||
          score.team_1_conference?.toLowerCase().includes(searchTerm) ||
          score.team_2_conference?.toLowerCase().includes(searchTerm) ||
          score.team_1_division?.toLowerCase().includes(searchTerm) ||
          score.team_2_division?.toLowerCase().includes(searchTerm) ||
          (score.location && score.location.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  });

  // Get top ranked matchups (games between ranked teams)
  const rankedMatchups = computed(() => {
    return filteredScores.value
      .filter((score) => score.team_1_is_ranked && score.team_2_is_ranked)
      .sort((a, b) => {
        // Sort by combined ranking (lower numbers = higher ranking)
        const aTotal = (a.team_1_rank || 999) + (a.team_2_rank || 999);
        const bTotal = (b.team_1_rank || 999) + (b.team_2_rank || 999);
        return aTotal - bTotal;
      });
  });

  const fetchScores = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Fetch both scores and schools
      const [scoresResponse, schoolsResponse] = await Promise.all([
        fetch("https://api.volleyballdatabased.com/results"),
        fetch("https://api.volleyballdatabased.com/schools"),
      ]);

      if (!scoresResponse.ok) throw new Error("Failed to fetch scores data");
      if (!schoolsResponse.ok) throw new Error("Failed to fetch schools data");

      const scoresData = await scoresResponse.json();
      const schoolsData = await schoolsResponse.json();

      // Build lookup map by org_id
      const schoolMap = new Map(schoolsData.map((s) => [String(s.org_id), s]));

      // Deduplicate games using multiple strategies
      const uniqueGames = new Map();

      scoresData.forEach((game) => {
        // Create multiple possible keys for this game
        const keys = [];

        // Primary key: match_id if available
        if (game.match_id) {
          keys.push(`match_${game.match_id}`);
        }

        // Secondary key: date + teams (both orders)
        const team1 = game.team_1_id || game.team_1;
        const team2 = game.team_2_id || game.team_2;
        const date = game.date;

        if (team1 && team2 && date) {
          keys.push(`teams_${date}_${team1}_${team2}`);
          keys.push(`teams_${date}_${team2}_${team1}`); // Handle swapped teams
        }

        // Check if any of these keys already exist
        const existingKey = keys.find((key) => uniqueGames.has(key));

        if (!existingKey) {
          // Use the first key as the primary key for this game
          const primaryKey = keys[0];
          uniqueGames.set(primaryKey, game);

          // Also set all other keys to point to this same game (to catch future duplicates)
          keys.slice(1).forEach((key) => {
            uniqueGames.set(key, game);
          });
        }
      });

      // Get unique games (remove duplicates that were added for key mapping)
      const uniqueGamesList = Array.from(new Set(uniqueGames.values()));

      // Convert to final format and attach logos
      scores.value = uniqueGamesList.map((game) => {
        const team1School = schoolMap.get(String(game.team_1_id));
        const team2School = schoolMap.get(String(game.team_2_id));
        return {
          ...game,
          team1Img: team1School?.logo || null,
          team2Img: team2School?.logo || null,
        };
      });

      schools.value = schoolsData;

      console.log(
        `Loaded ${scoresData.length} total games, ${scores.value.length} unique games`
      );
    } catch (err) {
      error.value = err.message || "Failed to fetch data";
    } finally {
      loading.value = false;
    }
  };
  const setDivisionFilter = (division) => {
    divisionFilter.value = division;
    // Clear dependent filters when division changes
    conferenceFilter.value = [];
    teamFilter.value = [];
  };

  const setConferenceFilter = (conferences) => {
    conferenceFilter.value = conferences;
    // Clear team filter when conference changes since available teams will change
    teamFilter.value = [];
  };

  const setTeamFilter = (teams) => {
    teamFilter.value = teams;
  };

  const setRankedOnlyFilter = (rankedOnly) => {
    rankedOnlyFilter.value = rankedOnly;
  };

  const setSearch = (searchTerm) => {
    search.value = searchTerm;
  };

  const clearFilters = () => {
    divisionFilter.value = null;
    conferenceFilter.value = [];
    teamFilter.value = [];
    rankedOnlyFilter.value = false;
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
    rankedOnlyFilter,
    search,

    // Computed
    divisions,
    conferences,
    teams,
    rankedTeams,
    transformedScores,
    filteredScores,
    rankedMatchups,
    naiaStandings,

    // Methods
    fetchScores,
    setDivisionFilter,
    setConferenceFilter,
    setTeamFilter,
    setRankedOnlyFilter,
    setSearch,
    clearFilters,
  };
}
