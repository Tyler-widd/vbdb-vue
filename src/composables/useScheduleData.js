// composables/useScheduleData.js
import { ref, computed, onMounted } from "vue";

export function useScheduleData() {
  const scheduleData = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Get unique divisions for filters
  const divisions = computed(() => {
    const uniqueDivisions = [
      ...new Set(scheduleData.value.map((game) => game.team_1_division)),
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
    let filtered = items;

    // Apply division filter
    if (divisionFilter) {
      filtered = filtered.filter(
        (game) =>
          game.team_1_division === divisionFilter ||
          game.team_2_division === divisionFilter
      );
    }

    // Apply conference filter
    if (conferenceFilter) {
      filtered = filtered.filter(
        (game) =>
          game.team_1_conference === conferenceFilter ||
          game.team_2_conference === conferenceFilter
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.team_1_name.toLowerCase().includes(searchLower) ||
          game.team_2_name.toLowerCase().includes(searchLower) ||
          game.date.includes(search) ||
          game.time.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Optional: Get statistics about the data
  const getScheduleStats = computed(() => {
    const totalGames = scheduleData.value.length;
    const uniqueDates = new Set(scheduleData.value.map((game) => game.date))
      .size;
    const uniqueTeams = new Set([
      ...scheduleData.value.map((game) => game.team_1_id),
      ...scheduleData.value.map((game) => game.team_2_id),
    ]).size;

    return {
      totalGames,
      uniqueDates,
      uniqueTeams,
      divisions: divisions.value.length,
      conferences: conferences.value.length,
    };
  });

  return {
    scheduleData,
    loading,
    error,
    divisions,
    conferences,
    getConferencesForDivision,
    fetchSchedule,
    filterSchedule,
    getScheduleStats, // Optional: for debugging/info
  };
}
