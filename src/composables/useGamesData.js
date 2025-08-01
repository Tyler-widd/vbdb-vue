// composables/useGamesData.js
import { ref } from "vue";

export function useGamesData() {
  const loading = ref(false);
  const error = ref(null);

  // Helper function to format date to MM/DD/YYYY for API
  const formatDateForAPI = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Helper function to format date to YYYY-MM-DD for internal use
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get previous date from a given date
  const getPreviousDate = (testDate = null) => {
    const baseDate = testDate ? new Date(testDate) : new Date();
    const previousDay = new Date(baseDate);
    previousDay.setDate(previousDay.getDate() - 1);
    return formatDateForAPI(previousDay);
  };

  // Fetch games for a specific date
  const fetchGamesByDate = async (date, orgId = null) => {
    loading.value = true;
    error.value = null;

    try {
      let url = `http://localhost:4000/games`;
      const params = new URLSearchParams();

      if (date) {
        params.append("date", date);
      }

      if (orgId) {
        params.append("orgId", orgId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching games by date:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Fetch all games and filter by date (fallback if API doesn't support date filtering)
  const fetchAndFilterGamesByDate = async (targetDate, orgId = null) => {
    loading.value = true;
    error.value = null;

    try {
      const url = orgId
        ? `http://localhost:4000/games/${orgId}`
        : `http://localhost:4000/games`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allGames = await response.json();

      // Convert targetDate to YYYY-MM-DD format for comparison
      const dateParts = targetDate.split("/");
      const formattedTargetDate = `${dateParts[2]}-${dateParts[0].padStart(
        2,
        "0"
      )}-${dateParts[1].padStart(2, "0")}`;

      // Filter games by date
      const filteredGames = allGames.filter(
        (game) => game.date === formattedTargetDate
      );

      return filteredGames;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching games:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Get random games from previous day
  const getRandomPreviousDayGames = async (
    count = 10,
    testDate = null,
    orgId = null
  ) => {
    const previousDate = getPreviousDate(testDate);

    // Try to fetch games by date first (if API supports it)
    let games = await fetchGamesByDate(previousDate, orgId);

    // If no games or API doesn't support date filtering, use fallback
    if (!games || games.length === 0) {
      games = await fetchAndFilterGamesByDate(previousDate, orgId);
    }

    // If there are fewer games than requested, return all
    if (games.length <= count) {
      return games;
    }

    // Shuffle and take first 'count' items
    const shuffled = [...games].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Get all games from previous day (no randomization)
  const getPreviousDayGames = async (testDate = null, orgId = null) => {
    const previousDate = getPreviousDate(testDate);

    // Try to fetch games by date first
    let games = await fetchGamesByDate(previousDate, orgId);

    // If no games or API doesn't support date filtering, use fallback
    if (!games || games.length === 0) {
      games = await fetchAndFilterGamesByDate(previousDate, orgId);
    }

    return games;
  };

  return {
    loading,
    error,
    getRandomPreviousDayGames,
    getPreviousDayGames,
    fetchGamesByDate,
    formatDate,
    formatDateForAPI,
    getPreviousDate,
  };
}
