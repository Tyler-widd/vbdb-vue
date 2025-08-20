// composables/useScoresData.js
import { ref, computed } from "vue";

export function useScoresData() {
  // Reactive state
  const scores = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const divisionFilter = ref(null);
  const conferenceFilter = ref(null);
  const search = ref("");

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
    const conferenceSet = new Set();
    scores.value.forEach((score) => {
      if (score.team_1_conference) conferenceSet.add(score.team_1_conference);
      if (score.team_2_conference) conferenceSet.add(score.team_2_conference);
    });
    return Array.from(conferenceSet).sort();
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

    // Apply conference filter
    if (conferenceFilter.value) {
      filtered = filtered.filter(
        (score) =>
          score.team_1_conference === conferenceFilter.value ||
          score.team_2_conference === conferenceFilter.value
      );
    }

    // Apply search filter
    if (search.value) {
      const searchTerm = search.value.toLowerCase();
      filtered = filtered.filter(
        (score) =>
          score.team_1.toLowerCase().includes(searchTerm) ||
          score.team_2.toLowerCase().includes(searchTerm) ||
          score.location.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  });

  // Methods
  const fetchScores = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        "https://api.volleyballdatabased.com/current_games"
      ); // Your API endpoint
      const data = await response.json();
      scores.value = data;
    } catch (err) {
      error.value = err.message || "Failed to fetch scores";
    } finally {
      loading.value = false;
    }
  };

  const setDivisionFilter = (division) => {
    divisionFilter.value = division;
  };

  const setConferenceFilter = (conference) => {
    conferenceFilter.value = conference;
  };

  const setSearch = (searchTerm) => {
    search.value = searchTerm;
  };

  const clearFilters = () => {
    divisionFilter.value = null;
    conferenceFilter.value = null;
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
    search,

    // Computed
    divisions,
    conferences,
    transformedScores,
    filteredScores,

    // Methods
    fetchScores,
    setDivisionFilter,
    setConferenceFilter,
    setSearch,
    clearFilters,
  };
}
