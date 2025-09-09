// composables/useScheduleData.js
import { computed, ref } from "vue";

export function useScheduleData() {
  const scheduleData = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Helper function to transform division values
  const transformDivision = (division) => {
    const divisionMap = {
      D1: "D-I",
      D2: "D-II",
      D3: "D-III",
    };
    return divisionMap[division] || division;
  };

  // Helper function to transform game data
  const transformGameData = (game) => {
    return {
      ...game,
      // Transform division values for both teams
      team_1_division: transformDivision(game.team_1_division),
      team_2_division: transformDivision(game.team_2_division),
      // Convert date format from MM-DD-YYYY to YYYY-MM-DD
      date: game.date,
      // Convert time format from "06:00PM ET" to "18:00"
      time: game.time,
      // Keep original values for reference
      original_date: game.start_date,
      original_time: game.start_time,
    };
  };

  // Get unique divisions for filters
  const divisions = computed(() => {
    const uniqueDivisions = [
      ...new Set([
        "NAIA",
        "D-I",
        "D-II",
        "D-III",
        "CCCAA",
        "NJCAA D-1",
        "NJCAA D-2",
        "NJCAA D-3",
      ]),
    ];
    return uniqueDivisions.sort();
  });

  // Get conferences filtered by selected division
  const getConferencesForDivision = (selectedDivision = null) => {
    let filteredGames = scheduleData.value;

    if (selectedDivision) {
      filteredGames = scheduleData.value.filter(
        (game) =>
          game.team_1_division === selectedDivision ||
          game.team_2_division === selectedDivision
      );
    }

    const uniqueConferences = [
      ...new Set(filteredGames.map((game) => game.team_1_conference)),
    ];
    return uniqueConferences.sort();
  };

  // Computed conferences for reactivity
  const conferences = computed(() => {
    const uniqueConferences = [
      ...new Set(scheduleData.value.map((game) => game.team_1_conference)),
    ];
    return uniqueConferences.sort();
  });

  // Computed property for future games only
  const futureGames = computed(() => {
    const today = new Date().toISOString().split("T")[0];

    return scheduleData.value.filter((game) => {
      return !game.date || game.date >= today;
    });
  });

  // Computed property for upcoming games (includes time checking for today's games)
  const upcomingGames = computed(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    return scheduleData.value.filter((game) => {
      if (!game.date) return true;

      if (game.date > today) {
        return true;
      } else if (game.date === today) {
        if (!game.time) return true;
        return game.time >= currentTime;
      }

      return false;
    });
  });

  // Helper function to create a unique key for each game
  const createGameKey = (game) => {
    const teamIds = [game.team_1_id, game.team_2_id].sort().join("-");
    return `${game.date}_${game.time}_${teamIds}`;
  };

  // Helper function to remove duplicate games
  const removeDuplicateGames = (games) => {
    const seen = new Map();
    const uniqueGames = [];

    games.forEach((game) => {
      const key = createGameKey(game);

      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueGames.push(game);
      }
    });

    return uniqueGames;
  };

  const fetchSchedule = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/schedule"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();

      // Transform the data to match expected format
      const transformedData = rawData.map(transformGameData);

      const uniqueData = removeDuplicateGames(transformedData);

      if (transformedData.length !== uniqueData.length) {
      }

      scheduleData.value = uniqueData;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching schedule:", err);
    } finally {
      loading.value = false;
    }
  };

  // Filter function with optional date filtering
  const filterSchedule = (
    items,
    search,
    divisionFilter,
    conferenceFilter,
    showPastGames = false
  ) => {
    const isValidValue = (value) => {
      return (
        value != null && value !== "" && value !== "TBA" && value !== "TBD"
      );
    };

    const getTeamName = (teamData) => {
      if (typeof teamData === "string") return teamData;
      if (typeof teamData === "object" && teamData?.name) return teamData.name;
      return teamData;
    };

    const getTeamDivision = (teamData) => {
      if (typeof teamData === "object" && teamData?.division)
        return teamData.division;
      return null;
    };

    const getTeamConference = (teamData) => {
      if (typeof teamData === "object" && teamData?.conference)
        return teamData.conference;
      return null;
    };

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    let filtered = items.filter((item) => {
      const team1Name = getTeamName(item.team_1_name);
      const team2Name = getTeamName(item.team_2_name);

      const hasValidNames = isValidValue(team1Name) && isValidValue(team2Name);

      // FIXED: Better date filtering logic
      let isNotPastGame = true;
      if (!showPastGames && item.date) {
        // Convert date to YYYY-MM-DD format for comparison if needed
        let gameDate = item.date;
        if (gameDate.includes("/")) {
          // Convert MM/DD/YYYY to YYYY-MM-DD
          const parts = gameDate.split("/");
          if (parts.length === 3) {
            gameDate = `${parts[2]}-${parts[0].padStart(
              2,
              "0"
            )}-${parts[1].padStart(2, "0")}`;
          }
        }
        isNotPastGame = gameDate >= today;
      }

      return hasValidNames && isNotPastGame;
    });

    // Apply division filter - FIXED: Better division matching
    if (divisionFilter && divisionFilter !== "all") {
      filtered = filtered.filter((game) => {
        const team1Division =
          getTeamDivision(game.team_1_name) || game.team_1_division;
        const team2Division =
          getTeamDivision(game.team_2_name) || game.team_2_division;

        // FIXED: More flexible division matching
        const divisionMatches = (division) => {
          if (!division) return false;

          // Exact match
          if (division === divisionFilter) return true;

          // Handle variations (D-I matches D1, etc.)
          const normalizedDivision = division
            .replace(/[-\s]/g, "")
            .toUpperCase();
          const normalizedFilter = divisionFilter
            .replace(/[-\s]/g, "")
            .toUpperCase();

          return normalizedDivision === normalizedFilter;
        };

        return divisionMatches(team1Division) || divisionMatches(team2Division);
      });
    }

    // Apply conference filter
    if (conferenceFilter && conferenceFilter !== "all") {
      filtered = filtered.filter((game) => {
        const team1Conference =
          getTeamConference(game.team_1_name) || game.team_1_conference;
        const team2Conference =
          getTeamConference(game.team_2_name) || game.team_2_conference;

        return (
          team1Conference === conferenceFilter ||
          team2Conference === conferenceFilter
        );
      });
    }

    // Apply search filter
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((game) => {
        const team1Name = getTeamName(game.team_1_name);
        const team2Name = getTeamName(game.team_2_name);

        const team1Match =
          team1Name?.toLowerCase?.()?.includes(searchLower) || false;
        const team2Match =
          team2Name?.toLowerCase?.()?.includes(searchLower) || false;
        const dateMatch = game.date?.includes?.(search) || false;
        const timeMatch =
          game.time?.toLowerCase?.()?.includes(searchLower) || false;

        return team1Match || team2Match || dateMatch || timeMatch;
      });
    }

    return filtered;
  };

  return {
    scheduleData,
    loading,
    error,
    divisions,
    conferences,
    getConferencesForDivision,
    fetchSchedule,
    filterSchedule,
    futureGames,
    upcomingGames,
  };
}
