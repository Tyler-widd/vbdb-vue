// composables/useGamesStore.js
import { ref, readonly, computed } from "vue";

// Global state - shared across all components
const games = ref([]);
const loading = ref(false);
const error = ref(null);
let dataLoaded = false;

export function useGamesStore() {
  const fetchGames = async () => {
    // Only fetch once
    if (dataLoaded && games.value.length > 0) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch("https://api.volleyballdatabased.com/games");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      games.value = data;
      dataLoaded = true;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching games data:", err);
    } finally {
      loading.value = false;
    }
  };

  // Get a game by its match_id:
  const getGameByMatchId = (matchId) => {
    return games.value.find((game) => game.match_id === matchId.toString());
  };

  // Get games for a specific team (by team ID):
  const getGamesByTeamId = (teamId) => {
    const id = teamId.toString();
    return games.value.filter(
      (game) => game.team_1_id === id || game.team_2_id === id
    );
  };

  // Get a single game where a specific team played:
  const getGameByTeamId = (teamId) => {
    const id = teamId.toString();
    return games.value.find(
      (game) => game.team_1_id === id || game.team_2_id === id
    );
  };

  // Filter games by winner:
  const getGamesByWinner = (winnerId) => {
    return games.value.filter((game) => game.winner_id === winnerId.toString());
  };

  // Filter games by division:
  const getGamesByDivision = (division) => {
    return games.value.filter(
      (game) =>
        game.team_1_division === division || game.team_2_division === division
    );
  };

  // Filter games by conference:
  const getGamesByConference = (conference) => {
    return games.value.filter(
      (game) =>
        game.team_1_conference === conference ||
        game.team_2_conference === conference
    );
  };

  // Filter games by date range:
  const getGamesByDateRange = (startDate, endDate) => {
    return games.value.filter((game) => {
      const gameDate = new Date(game.date);
      return gameDate >= new Date(startDate) && gameDate <= new Date(endDate);
    });
  };

  // Filter games by location (partial match):
  const getGamesByLocation = (location) => {
    return games.value.filter(
      (game) =>
        game.location &&
        game.location.toLowerCase().includes(location.toLowerCase())
    );
  };

  // Complex filter - games for a team in a specific season/year:
  const getTeamGamesByYear = (teamId, year) => {
    const id = teamId.toString();
    return games.value.filter((game) => {
      const gameYear = new Date(game.date).getFullYear();
      return (
        (game.team_1_id === id || game.team_2_id === id) && gameYear === year
      );
    });
  };

  // Get games for a specific team (alias for getGamesByTeamId):
  const getGamesByTeam = (teamId) => {
    return getGamesByTeamId(teamId);
  };

  // Get games between two specific teams:
  const getGamesBetweenTeams = (team1Id, team2Id) => {
    const id1 = team1Id.toString();
    const id2 = team2Id.toString();
    return games.value.filter(
      (game) =>
        (game.team_1_id === id1 && game.team_2_id === id2) ||
        (game.team_1_id === id2 && game.team_2_id === id1)
    );
  };

  // Filter games with specific set patterns (e.g., games that went to 5 sets):
  const getFiveSetGames = () => {
    return games.value.filter(
      (game) => game.set_5_team_1 !== null && game.set_5_team_2 !== null
    );
  };

  // Sort games by date (newest first):
  const getGamesSortedByDate = () => {
    return [...games.value].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get unique divisions from games data:
  const getDivisions = () => {
    const divisions = new Set();
    games.value.forEach((game) => {
      if (game.team_1_division) divisions.add(game.team_1_division);
      if (game.team_2_division) divisions.add(game.team_2_division);
    });
    return [...divisions].filter(Boolean).sort();
  };

  // Get unique conferences, optionally filtered by division:
  const getConferences = (division = null) => {
    const conferences = new Set();
    games.value.forEach((game) => {
      // Check team 1
      if (!division || game.team_1_division === division) {
        if (game.team_1_conference) conferences.add(game.team_1_conference);
      }
      // Check team 2
      if (!division || game.team_2_division === division) {
        if (game.team_2_conference) conferences.add(game.team_2_conference);
      }
    });
    return [...conferences].filter(Boolean).sort();
  };

  // Search games by team names, schools, or coaches:
  const searchGames = (query) => {
    if (!query) return games.value;

    const lowerQuery = query.toLowerCase();
    return games.value.filter(
      (game) =>
        game.team_1_name?.toLowerCase().includes(lowerQuery) ||
        game.team_1_school?.toLowerCase().includes(lowerQuery) ||
        game.team_1_coaches?.toLowerCase().includes(lowerQuery) ||
        game.team_2_name?.toLowerCase().includes(lowerQuery) ||
        game.team_2_school?.toLowerCase().includes(lowerQuery) ||
        game.team_2_coaches?.toLowerCase().includes(lowerQuery) ||
        game.location?.toLowerCase().includes(lowerQuery)
    );
  };

  // Computed properties
  const gamesCount = computed(() => games.value.length);
  const divisionsCount = computed(() => getDivisions().length);
  const conferencesCount = computed(() => getConferences().length);

  return {
    // Read-only state
    games: readonly(games),
    loading: readonly(loading),
    error: readonly(error),

    // Computed properties
    gamesCount,
    divisionsCount,
    conferencesCount,

    // Actions
    fetchGames,

    // Game filters
    getGameByMatchId,
    getGamesByTeamId,
    getGameByTeamId,
    getGamesByTeam,
    getGamesByWinner,
    getGamesByDivision,
    getGamesByConference,
    getGamesByDateRange,
    getGamesByLocation,
    getTeamGamesByYear,
    getGamesBetweenTeams,
    getFiveSetGames,
    getGamesSortedByDate,

    // Data getters
    getDivisions,
    getConferences,
    searchGames,
  };
}
