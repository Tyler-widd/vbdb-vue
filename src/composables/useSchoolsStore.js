// composables/useSchoolsStore.js
import { ref, readonly, computed } from "vue";

// Global state - shared across all components
const schools = ref([]);
const loading = ref(false);
const error = ref(null);
let dataLoaded = false;

export function useSchoolsStore() {
  const fetchSchools = async () => {
    // Only fetch once
    if (dataLoaded && schools.value.length > 0) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch("/teams.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      schools.value = data;
      dataLoaded = true;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching schools data:", err);
    } finally {
      loading.value = false;
    }
  };

  // Helper methods for common operations
  const getSchoolById = (id) => {
    return schools.value.find((school) => school.org_id === parseInt(id));
  };

  const getSchoolsByDivision = (division) => {
    return schools.value.filter((school) => school.division === division);
  };

  const getSchoolsByConference = (conference) => {
    return schools.value.filter((school) => school.conference === conference);
  };

  const getDivisions = () => {
    return [...new Set(schools.value.map((school) => school.division))]
      .filter(Boolean)
      .sort();
  };

  const getConferences = (division = null) => {
    let filtered = schools.value;
    if (division) {
      filtered = filtered.filter((school) => school.division === division);
    }
    return [...new Set(filtered.map((school) => school.conference))]
      .filter(Boolean)
      .sort();
  };

  const searchSchools = (query) => {
    if (!query) return schools.value;

    const lowerQuery = query.toLowerCase();
    return schools.value.filter(
      (school) =>
        school.name_official?.toLowerCase().includes(lowerQuery) ||
        school.school_short?.toLowerCase().includes(lowerQuery) ||
        school.head_coaches?.toLowerCase().includes(lowerQuery)
    );
  };

  // Computed properties
  const schoolsCount = computed(() => schools.value.length);
  const divisionsCount = computed(() => getDivisions().length);
  const conferencesCount = computed(() => getConferences().length);

  return {
    // Read-only state
    schools: readonly(schools),
    loading: readonly(loading),
    error: readonly(error),

    // Computed properties
    schoolsCount,
    divisionsCount,
    conferencesCount,

    // Actions
    fetchSchools,

    // Helpers
    getSchoolById,
    getSchoolsByDivision,
    getSchoolsByConference,
    getDivisions,
    getConferences,
    searchSchools,
  };
}
