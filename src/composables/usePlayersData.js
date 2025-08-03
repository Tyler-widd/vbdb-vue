// composables/usePlayersData.js
import { ref } from "vue";

export function usePlayersData() {
  const loading = ref(false);
  const error = ref(null);

  // Format conference name helper
  const formatConference = (conference) => {
    if (conference && conference.includes(".0")) {
      return `Region ${conference.replace(".0", "")}`;
    }
    return conference;
  };

  // Format player data for display
  const formatPlayers = (players) => {
    return players.map((player) => ({
      ...player,
      school:
        player.school?.name || player.school || player.schoolName || "N/A",
      player:
        `${player.firstName || player.first_name || ""} ${
          player.lastName || player.last_name || ""
        }`.trim() ||
        player.name ||
        "N/A",
      jersey_number:
        player.jerseyNumber || player.jersey_number || player.number || "N/A",
      class: player.class || player.year || player.grade || "N/A",
      position: player.position || player.pos || "N/A",
      height: player.height || "N/A",
      hometown:
        player.hometown ||
        player.city ||
        `${player.city || ""}, ${player.state || ""}`.replace(", ", "") ||
        "",
      division: player.division || player.school?.division || "N/A",
      conference:
        formatConference(player.conference || player.school?.conference) ||
        "N/A",
    }));
  };

  // Sort players by different fields
  const sortPlayers = (players, sortBy = "player", ascending = true) => {
    return [...players].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case "player":
          valueA = (a.player || "").toLowerCase();
          valueB = (b.player || "").toLowerCase();
          break;
        case "school":
          valueA = (a.school || "").toLowerCase();
          valueB = (b.school || "").toLowerCase();
          break;
        case "class":
          // Handle class/year sorting (Fr, So, Jr, Sr)
          const classOrder = { Fr: 1, So: 2, Jr: 3, Sr: 4 };
          valueA = classOrder[a.class] || 999;
          valueB = classOrder[b.class] || 999;
          break;
        case "position":
          valueA = (a.position || "").toLowerCase();
          valueB = (b.position || "").toLowerCase();
          break;
        case "height":
          // Convert height to inches for proper sorting
          valueA = convertHeightToInches(a.height);
          valueB = convertHeightToInches(b.height);
          break;
        case "hometown":
          valueA = (a.hometown || "").toLowerCase();
          valueB = (b.hometown || "").toLowerCase();
          break;
        default:
          valueA = (a[sortBy] || "").toString().toLowerCase();
          valueB = (b[sortBy] || "").toString().toLowerCase();
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return ascending
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        if (ascending) {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      }
    });
  };

  // Helper function to convert height to inches for sorting
  const convertHeightToInches = (height) => {
    if (!height || height === "N/A") return 0;

    // Handle format like "6'2" or "6-2"
    const match = height.match(/(\d+)['"-](\d+)/);
    if (match) {
      return parseInt(match[1]) * 12 + parseInt(match[2]);
    }

    // Handle format like "72" (inches only)
    const inches = parseInt(height);
    if (!isNaN(inches)) {
      return inches;
    }

    return 0;
  };

  // Fetch players with optional org filtering, formatting, and sorting
  const fetchPlayers = async (orgId = null, options = {}) => {
    loading.value = true;
    error.value = null;

    const { format = true, sortBy = null, ascending = true } = options;

    try {
      let url = `https://api.volleyballdatabased.com/players`;
      const params = new URLSearchParams();

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

      let data = await response.json();

      // Format if requested
      if (format) {
        data = formatPlayers(data);
      }

      // Sort if requested
      if (sortBy) {
        data = sortPlayers(data, sortBy, ascending);
      }

      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching players:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Fetch all players and filter by orgId (fallback if API doesn't support orgId filtering)
  const fetchAndFilterPlayers = async (orgId = null, options = {}) => {
    loading.value = true;
    error.value = null;

    const { format = true, sortBy = null, ascending = true } = options;

    try {
      const url = `https://api.volleyballdatabased.com/players`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let allPlayers = await response.json();

      // If no orgId specified, return all players
      if (!orgId) {
        if (format) {
          allPlayers = formatPlayers(allPlayers);
        }
        if (sortBy) {
          allPlayers = sortPlayers(allPlayers, sortBy, ascending);
        }
        return allPlayers;
      }

      // Filter players by orgId
      let filteredPlayers = allPlayers.filter(
        (player) => player.orgId === orgId || player.organizationId === orgId
      );

      // Format if requested
      if (format) {
        filteredPlayers = formatPlayers(filteredPlayers);
      }

      // Sort if requested
      if (sortBy) {
        filteredPlayers = sortPlayers(filteredPlayers, sortBy, ascending);
      }

      return filteredPlayers;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching and filtering players:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Get players by organization ID
  const getPlayersByOrg = async (orgId, options = {}) => {
    if (!orgId) {
      error.value = "Organization ID is required";
      return [];
    }

    // Try to fetch players with orgId parameter first
    let players = await fetchPlayers(orgId, options);

    // If no players or API doesn't support orgId filtering, use fallback
    if (!players || players.length === 0) {
      players = await fetchAndFilterPlayers(orgId, options);
    }

    return players;
  };

  // Get all players
  const getAllPlayers = async (options = {}) => {
    return await fetchPlayers(null, options);
  };

  return {
    loading,
    error,
    fetchPlayers,
    fetchAndFilterPlayers,
    getPlayersByOrg,
    getAllPlayers,
    formatPlayers,
    sortPlayers,
    formatConference,
  };
}
