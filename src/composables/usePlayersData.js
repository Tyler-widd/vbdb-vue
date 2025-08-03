// composables/usePlayersData.js
import { ref } from "vue";

export function usePlayersData() {
  const loading = ref(false);
  const error = ref(null);
  const currentPage = ref(1);
  const totalPages = ref(0);
  const totalPlayers = ref(0);
  const perPage = ref(100);

  // Format conference name helper
  const formatConference = (conference) => {
    if (conference && conference.includes(".0")) {
      return `Region ${conference.replace(".0", "")}`;
    }
    return conference;
  };

  // Format player data for display
  const formatPlayer = (player) => ({
    ...player,
    player: player.name || "N/A",
    jersey_number: player.jersey_number || "N/A",
    class: player.class || "N/A",
    position: player.position || "N/A",
    height: player.height || "N/A",
    hometown: player.hometown || "",
    division: player.division || "N/A",
    conference: formatConference(player.conference) || "N/A",
    img: player.img || "",
    school: player.school || "N/A",
  });

  // Fetch players with server-side filtering and pagination
  const fetchPlayers = async (options = {}) => {
    loading.value = true;
    error.value = null;

    const {
      page = 1,
      perPage: itemsPerPage = 100,
      division = null,
      conference = null,
      teamId = null,
      position = null,
      search = null,
      allDivisions = false,
    } = options;

    try {
      const params = new URLSearchParams();

      params.append("page", page);
      params.append("per_page", itemsPerPage);

      if (allDivisions) {
        params.append("all_divisions", "true");
      } else if (division) {
        params.append("division", division);
      }

      if (conference) {
        params.append("conference", conference);
      }

      if (teamId) {
        params.append("team_id", teamId);
      }

      if (position) {
        params.append("position", position);
      }

      if (search) {
        params.append("search", search);
      }

      const url = `https://api.volleyballdatabased.com/players?division=D-I&${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update pagination info
      currentPage.value = data.page;
      totalPages.value = data.total_pages;
      totalPlayers.value = data.total;
      perPage.value = data.per_page;

      // Format players
      const formattedPlayers = data.players.map(formatPlayer);

      return {
        players: formattedPlayers,
        pagination: {
          page: data.page,
          perPage: data.per_page,
          total: data.total,
          totalPages: data.total_pages,
        },
      };
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching players:", err);
      return {
        players: [],
        pagination: {
          page: 1,
          perPage: itemsPerPage,
          total: 0,
          totalPages: 0,
        },
      };
    } finally {
      loading.value = false;
    }
  };

  // Get unique values for filters (divisions, conferences, schools)
  // This is a temporary solution - ideally you'd have separate API endpoints for these
  const fetchFilterOptions = async () => {
    try {
      // For now, we'll hardcode common divisions since fetching all players
      // just for filter options is inefficient
      const divisions = ["D-I", "D-II", "D-III"];

      // For conferences and schools, you might want to create dedicated endpoints
      // that return distinct values from the database
      // For now, we'll return empty arrays and let them be populated
      // based on the current filtered data

      return {
        divisions,
        conferences: [], // Will be populated from current data
        schools: [], // Will be populated from current data
        positions: ["OH", "MB", "S", "L", "DS", "RS", "OPP"],
      };
    } catch (err) {
      console.error("Error fetching filter options:", err);
      return {
        divisions: [],
        conferences: [],
        schools: [],
        positions: [],
      };
    }
  };

  // Get players by team/organization ID
  const getPlayersByTeam = async (teamId, options = {}) => {
    if (!teamId) {
      error.value = "Team ID is required";
      return { players: [], pagination: {} };
    }

    return await fetchPlayers({ ...options, teamId });
  };

  return {
    loading,
    error,
    currentPage,
    totalPages,
    totalPlayers,
    perPage,
    fetchPlayers,
    fetchFilterOptions,
    getPlayersByTeam,
    formatConference,
  };
}
