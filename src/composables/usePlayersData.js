// composables/usePlayersData.js
import { ref } from "vue";

export function usePlayersData() {
  const loading = ref(false);
  const error = ref(null);
  const currentPage = ref(1);
  const totalPages = ref(0);
  const totalPlayers = ref(0);
  const perPage = ref(10);

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
      perPage: itemsPerPage = 10,
      divisions = ["D-I", "D-II", "D-III"], // Changed from single division to array
      conference = null,
      teamId = null,
      school = null,
      position = null,
      search = null,
    } = options;

    try {
      let allPlayers = [];
      let totalCount = 0;

      // Always fetch from the specified divisions array
      const promises = divisions.map(async (div) => {
        const params = new URLSearchParams();
        params.append("division", div);
        params.append("per_page", "10000"); // Get all players for filtering

        if (conference) {
          const apiConference = conference.startsWith("Region ")
            ? conference.replace("Region ", "") + ".0"
            : conference;
          params.append("conference", apiConference);
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

        const url = `https://api.volleyballdatabased.com/players?${params.toString()}`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return data.players.map(formatPlayer);
        } catch (err) {
          console.error(`Error fetching ${div} players:`, err);
          return [];
        }
      });

      const results = await Promise.all(promises);
      allPlayers = results.flat();

      // Apply client-side school filtering if needed
      if (school) {
        allPlayers = allPlayers.filter((player) => player.school === school);
      }

      totalCount = allPlayers.length;

      // Apply client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPlayers = allPlayers.slice(startIndex, endIndex);

      // Update pagination info
      currentPage.value = page;
      totalPages.value = Math.ceil(totalCount / itemsPerPage);
      totalPlayers.value = totalCount;
      perPage.value = itemsPerPage;

      return {
        players: paginatedPlayers,
        pagination: {
          page: page,
          perPage: itemsPerPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
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

  // Get all players for filter population (limited request)
  const getAllPlayers = async () => {
    try {
      // Fetch a limited set of players to populate filters
      const response = await fetch(
        "https://api.volleyballdatabased.com/players?division=D-I&per_page=1000",
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.players.map(formatPlayer);
    } catch (err) {
      console.error("Error fetching all players:", err);
      return [];
    }
  };

  // Get unique values for filters
  const fetchFilterOptions = async () => {
    try {
      const divisions = ["D-I", "D-II", "D-III"];

      return {
        divisions,
        conferences: [],
        schools: [],
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
    getAllPlayers,
    formatConference,
  };
}
