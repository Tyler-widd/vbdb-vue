// composables/useScheduleData.js
import { ref, computed, onMounted } from "vue";

export function useScheduleData() {
  const scheduleData = ref([]);
  const loading = ref(false);
  const error = ref(null);

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

  // Helper function to create a unique key for each game
  const createGameKey = (game) => {
    // Create a key that identifies unique games
    // Include date, time, and both team IDs (sorted to handle home/away variations)
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
      const data = await response.json();

      // Remove duplicates before storing
      const uniqueData = removeDuplicateGames(data);

      // Log the deduplication results for debugging
      if (data.length !== uniqueData.length) {
        console.log(
          `Removed ${data.length - uniqueData.length} duplicate games`
        );
        console.log(
          `Original count: ${data.length}, Unique count: ${uniqueData.length}`
        );
      }

      scheduleData.value = uniqueData;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching schedule:", err);
    } finally {
      loading.value = false;
    }
  };

  // Filter function for search and filters
  const filterSchedule = (items, search, divisionFilter, conferenceFilter) => {
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

    let filtered = items.filter((item) => {
      const team1Name = getTeamName(item.team_1_name);
      const team2Name = getTeamName(item.team_2_name);

      // Both teams must have valid names
      return isValidValue(team1Name) && isValidValue(team2Name);
    });

    // Apply division filter
    if (divisionFilter && divisionFilter !== "all") {
      filtered = filtered.filter((game) => {
        const team1Division =
          getTeamDivision(game.team_1_name) || game.team_1_division;
        const team2Division =
          getTeamDivision(game.team_2_name) || game.team_2_division;

        return (
          team1Division === divisionFilter || team2Division === divisionFilter
        );
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

        // Safe string operations with fallbacks
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
  };
}
