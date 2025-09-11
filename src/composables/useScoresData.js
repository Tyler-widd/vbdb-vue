// composables/useScoresData.js
import { ref, computed } from "vue";

export function useScoresData() {
  // Reactive state
  const scores = ref([]);
  const schools = ref([]);
  const teams = ref([]); // Add teams data
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

  // Helper function to enrich game data with team information
  const enrichGameWithTeamData = (game, teamsData, schoolsData) => {
    if (!teamsData || teamsData.length === 0) {
      return game;
    }

    // Create lookup maps for efficient joining
    const teamsByOrgId = new Map();
    const teamsByShortName = new Map();
    const teamsByName = new Map();
    const schoolsByOrgId = new Map();

    teamsData.forEach((team) => {
      if (team.team_id) {
        teamsByOrgId.set(team.team_id, team);
      }
      if (team.short_name) {
        teamsByShortName.set(team.short_name.toLowerCase(), team);
      }
      if (team.name) {
        teamsByName.set(team.name.toLowerCase(), team);
      }
    });

    // Also create schools lookup for logos (fallback)
    if (schoolsData) {
      schoolsData.forEach((school) => {
        if (school.org_id) {
          schoolsByOrgId.set(String(school.org_id), school);
        }
      });
    }

    // Helper function to find team data with fallback logic
    const findTeamData = (teamId, teamName) => {
      let teamData = null;

      // First try by team_id if provided
      if (teamId) {
        teamData = teamsByOrgId.get(teamId);
      }

      // If not found and teamName exists, try by short_name
      if (!teamData && teamName) {
        teamData = teamsByShortName.get(teamName.toLowerCase());
      }

      // If still not found, try by full name
      if (!teamData && teamName) {
        teamData = teamsByName.get(teamName.toLowerCase());
      }

      return teamData;
    };

    // Helper function to merge team data with priority to teams data
    const mergeTeamData = (gameTeamData, teamData, schoolData, teamNumber) => {
      const result = {};

      // Use team data if available, otherwise fall back to game data
      if (teamData) {
        result[`team_${teamNumber}_id`] = teamData.team_id || gameTeamData.id;
        result[`team_${teamNumber}_name`] =
          teamData.short_name || teamData.name || gameTeamData.name;
        result[`team_${teamNumber}_division`] =
          teamData.division || gameTeamData.division;
        result[`team_${teamNumber}_conference`] =
          teamData.conference || gameTeamData.conference;
        result[`team_${teamNumber}_rank`] =
          teamData.avca_ranking || gameTeamData.rank;
        // For logo, prefer team data, then school data, then game data
        result[`team${teamNumber}Img`] =
          teamData.logo || schoolData?.logo || gameTeamData.logo;
      } else {
        // Use game data as fallback
        result[`team_${teamNumber}_id`] = gameTeamData.id;
        result[`team_${teamNumber}_name`] = gameTeamData.name;
        result[`team_${teamNumber}_division`] = gameTeamData.division;
        result[`team_${teamNumber}_conference`] = gameTeamData.conference;
        result[`team_${teamNumber}_rank`] = gameTeamData.rank;
        result[`team${teamNumber}Img`] = schoolData?.logo || gameTeamData.logo;
      }

      return result;
    };

    // Extract current game data for both teams
    const team1GameData = {
      id: game.team_1_id,
      name: game.team_1_name || game.team_1,
      division: game.team_1_division,
      conference: game.team_1_conference,
      rank: game.team_1_rank,
      logo: game.team1Img,
    };

    const team2GameData = {
      id: game.team_2_id,
      name: game.team_2_name || game.team_2,
      division: game.team_2_division,
      conference: game.team_2_conference,
      rank: game.team_2_rank,
      logo: game.team2Img,
    };

    // Find team data for both teams
    const team1Data = findTeamData(
      game.team_1_id,
      game.team_1_name || game.team_1
    );
    const team2Data = findTeamData(
      game.team_2_id,
      game.team_2_name || game.team_2
    );

    // Find school data for logos (fallback)
    const team1School = schoolsByOrgId.get(String(game.team_1_id));
    const team2School = schoolsByOrgId.get(String(game.team_2_id));

    // Merge team data with teams data taking priority
    const team1Merged = mergeTeamData(team1GameData, team1Data, team1School, 1);
    const team2Merged = mergeTeamData(team2GameData, team2Data, team2School, 2);

    // Create the enriched game object
    const enrichedGame = {
      ...game,
      ...team1Merged,
      ...team2Merged,
    };

    return enrichedGame;
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
  const availableTeams = computed(() => {
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

      // Add team 1 if it matches all filters and has required data
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

      // Add team 2 if it matches all filters and has required data
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

    // Apply division filter first
    if (divisionFilter.value) {
      filtered = filtered.filter(
        (score) =>
          score.team_1_division === divisionFilter.value ||
          score.team_2_division === divisionFilter.value
      );
    }

    // Apply conference filter (array) - but only if we have conferences selected
    if (conferenceFilter.value && conferenceFilter.value.length > 0) {
      filtered = filtered.filter((score) => {
        const team1Conference = formatConference(score.team_1_conference);
        const team2Conference = formatConference(score.team_2_conference);

        return (
          conferenceFilter.value.includes(team1Conference) ||
          conferenceFilter.value.includes(team2Conference)
        );
      });
    }

    // Apply team filter (using team IDs) - but only if we have teams selected
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

    // Apply search filter last
    if (search.value && search.value.trim() !== "") {
      const searchTerm = search.value.toLowerCase().trim();
      filtered = filtered.filter(
        (score) =>
          (score.team_1_name &&
            score.team_1_name.toLowerCase().includes(searchTerm)) ||
          (score.team_2_name &&
            score.team_2_name.toLowerCase().includes(searchTerm)) ||
          (score.team_1_conference &&
            formatConference(score.team_1_conference)
              .toLowerCase()
              .includes(searchTerm)) ||
          (score.team_2_conference &&
            formatConference(score.team_2_conference)
              .toLowerCase()
              .includes(searchTerm)) ||
          (score.team_1_division &&
            score.team_1_division.toLowerCase().includes(searchTerm)) ||
          (score.team_2_division &&
            score.team_2_division.toLowerCase().includes(searchTerm)) ||
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
      // Fetch scores, schools, and teams
      const [scoresResponse, schoolsResponse, teamsResponse] =
        await Promise.all([
          fetch("https://api.volleyballdatabased.com/results"),
          fetch("https://api.volleyballdatabased.com/schools"),
          fetch("https://api.volleyballdatabased.com/teams"),
        ]);

      if (!scoresResponse.ok) throw new Error("Failed to fetch scores data");
      if (!schoolsResponse.ok) throw new Error("Failed to fetch schools data");
      if (!teamsResponse.ok) throw new Error("Failed to fetch teams data");

      const scoresData = await scoresResponse.json();
      const schoolsData = await schoolsResponse.json();
      const teamsData = await teamsResponse.json();

      // Build lookup map by org_id for schools (for fallback logos)
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

      // Convert to final format and enrich with team data
      scores.value = uniqueGamesList.map((game) => {
        // First add basic school logo lookup
        const team1School = schoolMap.get(String(game.team_1_id));
        const team2School = schoolMap.get(String(game.team_2_id));

        const gameWithLogos = {
          ...game,
          team1Img: team1School?.logo || null,
          team2Img: team2School?.logo || null,
        };

        // Then enrich with team data
        return enrichGameWithTeamData(gameWithLogos, teamsData, schoolsData);
      });

      schools.value = schoolsData;
      teams.value = teamsData;

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
    // Only clear dependent filters if division actually changed
    // and we're not just clearing it
    if (division !== null) {
      conferenceFilter.value = [];
      teamFilter.value = [];
    }
  };

  const setConferenceFilter = (conferences) => {
    conferenceFilter.value = Array.isArray(conferences) ? conferences : [];
    // Only clear team filter if we're actually changing conferences
    teamFilter.value = [];
  };

  const setTeamFilter = (teams) => {
    teamFilter.value = Array.isArray(teams) ? teams : [];
  };

  const setRankedOnlyFilter = (rankedOnly) => {
    rankedOnlyFilter.value = rankedOnly;
  };

  const setSearch = (searchTerm) => {
    search.value = searchTerm || "";
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
    teams: availableTeams, // Renamed for consistency
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
